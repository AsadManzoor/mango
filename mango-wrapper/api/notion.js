// Vercel serverless function: reads your Notion databases and returns tidy JSON.
// The Notion token lives ONLY in the NOTION_TOKEN environment variable (never in the browser).

const { headers, nfetch, fileUrl, normalise, isVip, plain, clean } = require('./_notion');

const DBS = {
  dates: process.env.DB_DATES || '3f788828e93080a4b4c3f76f9922946b',
  activities: process.env.DB_ACTIVITIES || '40588828e93080f4ad06c4cde5af1742',
  food: process.env.DB_FOOD || '41188828e930806d9475e335175aae4d',
  travel: process.env.DB_TRAVEL || '40588828e93080d1a00af76e6f7b428a',
  shows: process.env.DB_SHOWS || '3f288828e93080259671f3214fd1b5f9',
  movies: process.env.DB_MOVIES || '3f288828e930801b94a0c56c5cb25d78',
  books: process.env.DB_BOOKS || '3f388828e93080e3842ef6617367f677',
};
const MAIN_PAGE = process.env.MAIN_PAGE || '3f288828e93080c9867cd092158b7d26';

async function queryAll(id, token) {
  const results = [];
  let cursor;
  do {
    const r = await nfetch(`https://api.notion.com/v1/databases/${id}/query`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (!r.ok) throw new Error(`Notion ${r.status} for database ${id}`);
    const j = await r.json();
    results.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return results;
}

async function mainPage(token) {
  const r = await nfetch(`https://api.notion.com/v1/pages/${MAIN_PAGE}`, { headers: headers(token) });
  if (!r.ok) throw new Error(`Notion ${r.status} for main page`);
  const j = await r.json();
  return { banner: fileUrl(j.cover) };
}

// ---- Resources: every link under the "Resources" heading on the main Notion page ----
async function listChildren(id, token) {
  const out = [];
  let cursor;
  do {
    const r = await nfetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`, { headers: headers(token) });
    if (!r.ok) throw new Error(`Notion ${r.status} for blocks of ${id}`);
    const j = await r.json();
    out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return out;
}
const HEADINGS = ['heading_1', 'heading_2', 'heading_3'];
const TEXTY = ['paragraph', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote', 'callout', 'toggle'];
const BARE = ['bookmark', 'embed', 'link_preview', 'video', 'pdf', 'file', 'audio'];
const isNotionUrl = (u) => /^https?:\/\/([^/]+\.)?(notion\.so|notion\.site|notion\.com)\//i.test(u);
// One block -> zero or more {label, url}
async function linksOf(b, token, depth = 0) {
  const found = [];
  const t = b.type;
  if (TEXTY.includes(t)) {
    // Notion splits a link into pieces when part of it is bold/italic, so glue neighbouring pieces with the same address back together
    let cur = null;
    for (const rt of (b[t].rich_text || [])) {
      // A Notion "mention" holds the page title and favicon next to the address; for link mentions, plain_text is only the raw URL
      const m = rt.type === 'mention' ? rt.mention || {} : null;
      const lm = m && m.type === 'link_mention' ? m.link_mention || {} : null;
      const href = rt.href || (lm && lm.href) || (m && m.link_preview && m.link_preview.url) || (rt.text && rt.text.link && rt.text.link.url) || null;
      const label = (lm && lm.title) || rt.plain_text;
      const icon = (lm && lm.icon_url) || null;
      if (href && cur && cur.url === href) { if (!(lm && lm.title)) cur.label += label; }
      else if (href) { cur = { label, url: href, ...(icon ? { icon } : {}) }; found.push(cur); }
      else cur = null;
    }
    if (!found.length) { // a bare pasted address that Notion didn't turn into a link
      const txt = (b[t].rich_text || []).map((r) => r.plain_text).join('').trim();
      if (/^https?:\/\/\S+$/.test(txt)) found.push({ label: '', url: txt });
    }
    if (b.has_children && depth < 1) for (const c of await listChildren(b.id, token)) found.push(...(await linksOf(c, token, depth + 1)));
  } else if (BARE.includes(t)) {
    const x = b[t] || {};
    const url = x.url || fileUrl(x);
    if (url) found.push({ label: plain(x.caption), url });
  } else if (t === 'link_to_page') {
    const id = b.link_to_page.page_id || b.link_to_page.database_id;
    if (id) {
      let label = '';
      try {
        const r = await nfetch(`https://api.notion.com/v1/pages/${id}`, { headers: headers(token) });
        if (r.ok) { const j = await r.json(); const tp = Object.values(j.properties || {}).find((q) => q.type === 'title'); label = tp ? plain(tp.title) : ''; }
      } catch (e) { /* label stays empty */ }
      found.push({ label, url: `https://www.notion.so/${String(id).replace(/-/g, '')}` });
    }
  }
  return found;
}
async function resourceLinks(token, vip) {
  const blocks = await listChildren(MAIN_PAGE, token);
  const start = blocks.findIndex((b) => HEADINGS.includes(b.type) && plain(b[b.type].rich_text).trim().toLowerCase() === 'resources');
  if (start < 0) return [];
  const level = HEADINGS.indexOf(blocks[start].type);
  const section = [];
  if (blocks[start].has_children) section.push(...(await listChildren(blocks[start].id, token))); // "Resources" as a toggle heading
  for (const b of blocks.slice(start + 1)) {
    if (b.type === 'divider' || (HEADINGS.includes(b.type) && HEADINGS.indexOf(b.type) <= level)) break;
    section.push(b);
  }
  const seen = new Set(), out = [];
  for (const b of section) {
    for (const l of await linksOf(b, token)) {
      if (!l.url || seen.has(l.url) || (!vip && isNotionUrl(l.url))) continue; // Notion links are VIP-only, like everywhere else
      seen.add(l.url);
      out.push({ label: clean(l.label), url: l.url, ...(l.icon ? { icon: l.icon } : {}) });
    }
  }
  return out;
}

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'NOTION_TOKEN is not set' });
    return;
  }
  const vip = isVip(req);
  const keys = Object.keys(DBS);
  const settled = await Promise.allSettled([...keys.map((k) => queryAll(DBS[k], token)), mainPage(token), resourceLinks(token, vip)]);
  const data = {};
  const errors = [];
  keys.forEach((k, i) => {
    const s = settled[i];
    if (s.status === 'fulfilled') data[k] = s.value.map((p) => normalise(p)).filter((x) => vip || !x.nsfw).map((x) => { if (!vip) delete x.url; return x; }); // Notion links are VIP-only
    else { data[k] = []; errors.push(`${k}: ${s.reason.message}`); }
  });
  const m = settled[keys.length];
  if (m.status === 'fulfilled') data.banner = m.value.banner;
  else errors.push(`banner: ${m.reason.message}`);
  const rs = settled[keys.length + 1];
  if (rs.status === 'fulfilled') data.resources = rs.value;
  else errors.push(`resources: ${rs.reason.message}`);
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  res.status(200).json({ vip, fetchedAt: new Date().toISOString(), errors, ...data });
};

module.exports._resourceLinks = resourceLinks;
