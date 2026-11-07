// /api/thumbs?ids=<id>,<id>...  ->  { "<id>": "<first inline image url>" | null }
// Used for Memory Lane dates that have no page cover: finds the first photo inside the page.
const { headers, nfetch, fileUrl } = require('./_notion');

async function firstImage(id, token, budget) {
  if (budget.n <= 0) return null;
  budget.n--;
  const r = await nfetch(`https://api.notion.com/v1/blocks/${id}/children?page_size=50`, { headers: headers(token) });
  if (!r.ok) return null;
  const j = await r.json();
  for (const b of j.results) {
    // never use an image from an NSFW toggle/callout as a thumbnail
    if (b.type === 'callout' || b.type === 'toggle') {
      const d = b[b.type] || {};
      const t = (d.rich_text || []).map((r) => r.plain_text).join('').trim().toLowerCase();
      if (t === 'nsfw' || (d.icon && d.icon.emoji === '🔞')) continue;
    }
    if (b.type === 'image') { const u = fileUrl(b.image); if (u) return u; }
    if (b.has_children && ['column_list', 'column', 'callout', 'toggle', 'synced_block', 'quote'].includes(b.type)) {
      const u = await firstImage(b.id, token, budget);
      if (u) return u;
    }
  }
  return null;
}

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  if (!token) { res.status(500).json({ error: 'NOTION_TOKEN is not set' }); return; }
  const ids = String((req.query && req.query.ids) || '').split(',').map((x) => x.replace(/-/g, '').toLowerCase()).filter((x) => /^[0-9a-f]{32}$/.test(x)).slice(0, 12);
  const out = {};
  await Promise.all(ids.map(async (id) => { try { out[id] = await firstImage(id, token, { n: 8 }); } catch (e) { out[id] = null; } }));
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');
  res.status(200).json(out);
};
