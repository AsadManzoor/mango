// Shared helpers for the Notion functions. Files starting with "_" are not exposed as routes by Vercel.

const NOTION_VERSION = '2022-06-28';

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json',
});

// fetch with one polite retry when Notion says "slow down" (429)
async function nfetch(url, opts, retries = 2) {
  const r = await fetch(url, opts);
  if (r.status === 429 && retries > 0) {
    const wait = Number(r.headers.get('retry-after') || 1) * 1000;
    await new Promise((res) => setTimeout(res, Math.min(wait, 3000)));
    return nfetch(url, opts, retries - 1);
  }
  return r;
}

const plain = (arr) => (arr || []).map((t) => t.plain_text).join('');
// Some titles contain stray HTML such as "<b>Spill the Chai</b>": show the words, not the tags.
const clean = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const fileUrl = (f) => (!f ? null : f.type === 'file' ? f.file.url : f.type === 'external' ? f.external.url : null);

// One database row (or page) -> tidy object
function normalise(page) {
  const p = page.properties || {};
  const out = { id: page.id, created: page.created_time, url: page.url };
  // The thumbnail is the page's own Cover Image (what you set in Notion with "Add cover").
  let cover = fileUrl(page.cover);
  for (const [key, prop] of Object.entries(p)) {
    switch (prop.type) {
      case 'title': out.name = clean(plain(prop.title)) || 'Untitled'; break;
      case 'status': out.status = prop.status ? prop.status.name : null; break;
      case 'multi_select': out.tags = (prop.multi_select || []).map((o) => o.name); break;
      case 'date':
        out.date = prop.date ? prop.date.start : null;
        out.dateEnd = prop.date ? prop.date.end : null;
        break;
      case 'select': {
        // Food ratings: "Gaja's Rating" / "Asad's Rating" hold one to five ⭐
        const k = key.toLowerCase(), n = prop.select ? (prop.select.name.match(/⭐/g) || []).length : null;
        if (k.includes('rating') && k.includes('gaja')) out.rateG = n;
        if (k.includes('rating') && k.includes('asad')) out.rateA = n;
        break;
      }
      case 'number': if (key.toLowerCase().startsWith('cost')) out.cost = prop.number; break;
      case 'checkbox':
        if (key === 'Has Debrief') out.hasDebrief = prop.checkbox;
        if (key.trim().toLowerCase() === 'nsfw') out.nsfw = !!prop.checkbox;
        break;
      case 'files':
        if (!cover && key.toLowerCase().includes('cover')) cover = fileUrl((prop.files || [])[0]);
        break;
      default: break;
    }
  }
  if (cover) out.cover = cover;
  if (!out.tags) out.tags = [];
  return out;
}

// VIP access. The password is checked here on the server (set VIP_PASSWORD in Vercel to change it),
// so NSFW entries are never sent to a guest's browser at all.
const VIP_PASSWORD = process.env.VIP_PASSWORD || 'plounge';
function isVip(req) {
  const q = (req.query && req.query.k) || '';
  const h = (req.headers && req.headers['x-vip']) || '';
  const k = String(q || h);
  return k.length > 0 && k === VIP_PASSWORD;
}

module.exports = { isVip, NOTION_VERSION, headers, nfetch, plain, clean, fileUrl, normalise };
