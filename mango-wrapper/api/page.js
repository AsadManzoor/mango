// Vercel serverless function: /api/page?id=<notion page id>
// Reads one page (a date, activity, trip, show...) and returns its photos, text and videos as tidy blocks.
// Read-only. Photo links from Notion expire after about an hour, so this is fetched fresh each time a page is opened.

const { headers, nfetch, plain, clean, fileUrl, normalise, isVip } = require('./_notion');
const { mapFor } = require('./_maps');

const MAX_DEPTH = 4;
const SKIP = new Set(['child_page', 'child_database', 'unsupported', 'table_of_contents', 'breadcrumb']);

const rich = (arr) =>
  (arr || []).map((r) => {
    const o = {
      t: r.plain_text,
      b: !!r.annotations.bold,
      i: !!r.annotations.italic,
      s: !!r.annotations.strikethrough,
      u: !!r.annotations.underline,
      c: !!r.annotations.code,
      h: r.href || null,
    };
    // "Mentions" (page links, link previews, dates, people) arrive as their own rich-text type
    if (r.type === 'mention' && r.mention) {
      const m = r.mention;
      if (m.type === 'page') o.m = { k: 'page', id: m.page.id };
      else if (m.type === 'database') o.m = { k: 'page', id: m.database.id };
      else if (m.type === 'link_mention') {
        const l = m.link_mention || {};
        o.m = { k: 'link', url: l.href || r.href || null, icon: l.icon_url || null, prov: l.link_provider || null };
        if (l.title) o.t = l.title;
      } else if (m.type === 'link_preview') o.m = { k: 'link', url: (m.link_preview && m.link_preview.url) || r.href || null };
      else if (m.type === 'date') o.m = { k: 'date' };
      else if (m.type === 'user') o.m = { k: 'user' };
      else o.m = { k: 'other' };
    }
    return o;
  });

async function children(id, token) {
  const out = [];
  let cursor;
  do {
    const r = await nfetch(
      `https://api.notion.com/v1/blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`,
      { headers: headers(token) }
    );
    if (!r.ok) throw new Error(`Notion ${r.status} reading blocks`);
    const j = await r.json();
    out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}

function shape(b) {
  const d = b[b.type] || {};
  switch (b.type) {
    case 'paragraph':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'quote':
    case 'bulleted_list_item':
    case 'numbered_list_item':
    case 'toggle':
      return { type: b.type, text: rich(d.rich_text) };
    case 'to_do':
      return { type: 'to_do', text: rich(d.rich_text), checked: !!d.checked };
    case 'callout':
      return { type: 'callout', text: rich(d.rich_text), icon: d.icon && d.icon.type === 'emoji' ? d.icon.emoji : null };
    case 'code':
      return { type: 'code', text: rich(d.rich_text), lang: d.language || '' };
    case 'divider':
      return { type: 'divider' };
    case 'image':
      return { type: 'image', url: fileUrl(d), caption: rich(d.caption), link: (d.link && (d.link.url || d.link.href)) || d.href || null };
    case 'link_to_page':
      return { type: 'pagelink', id: d.page_id || d.database_id || null };
    case 'video':
      return { type: 'video', url: fileUrl(d), caption: rich(d.caption), external: d.type === 'external' };
    case 'embed':
    case 'bookmark':
    case 'link_preview':
      return { type: 'link', url: d.url || null, caption: rich(d.caption) };
    case 'file':
    case 'pdf':
      return { type: 'file', url: fileUrl(d), name: d.name || plain(d.caption) || 'File' };
    case 'column_list':
    case 'column':
    case 'synced_block':
      return { type: b.type === 'synced_block' ? 'group' : b.type };
    case 'table':
      return { type: 'table', header: !!d.has_column_header };
    case 'table_row':
      return { type: 'table_row', cells: (d.cells || []).map(rich) };
    default:
      return null;
  }
}

// A toggle titled "NSFW" (or a callout with the 🔞 icon) marks a hidden section of a page.
const isNsfwBlock = (b) => {
  const d = b[b.type] || {};
  if (b.type === 'toggle') return plain(d.rich_text).trim().toLowerCase() === 'nsfw';
  if (b.type === 'callout') return (d.icon && d.icon.type === 'emoji' && d.icon.emoji === '🔞') || plain(d.rich_text).trim().toLowerCase() === 'nsfw';
  return false;
};

async function tree(id, token, depth, vip) {
  const list = await children(id, token);
  const done = await Promise.all(
    list.map(async (b) => {
      if (SKIP.has(b.type)) return null;
      const hidden = isNsfwBlock(b);
      if (hidden && !vip) return null; // never sent to guests, children are not even fetched
      const s = shape(b);
      if (!s) return null;
      if (hidden) s.nsfw = true;
      if (b.has_children && depth < MAX_DEPTH) s.children = await tree(b.id, token, depth + 1, vip);
      // Google Maps links become real embedded maps
      if (s.type === 'link' && s.url) { const m = await mapFor(s.url); if (m) s.map = m; }
      return s;
    })
  );
  return done.filter(Boolean);
}

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  if (!token) { res.status(500).json({ error: 'NOTION_TOKEN is not set' }); return; }
  const id = String((req.query && req.query.id) || '').replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(id)) { res.status(400).json({ error: 'Bad page id' }); return; }
  try {
    const pr = await nfetch(`https://api.notion.com/v1/pages/${id}`, { headers: headers(token) });
    if (!pr.ok) { res.status(pr.status === 404 ? 404 : 502).json({ error: `Notion ${pr.status}` }); return; }
    const page = await pr.json();
    const meta = normalise(page);
    if (meta.nsfw && !isVip(req)) { res.status(404).json({ error: 'Not found' }); return; }
    const blocks = await tree(id, token, 0, isVip(req));
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    res.status(200).json({
      id: meta.id,
      title: clean(meta.name),
      url: page.url,
      cover: meta.cover || null,
      icon: page.icon && page.icon.type === 'emoji' ? page.icon.emoji : null,
      nsfw: !!meta.nsfw,
      props: { status: meta.status || null, tags: meta.tags, date: meta.date || null, dateEnd: meta.dateEnd || null, cost: meta.cost == null ? null : meta.cost, hasDebrief: !!meta.hasDebrief },
      blocks,
    });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
