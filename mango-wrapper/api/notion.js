// Vercel serverless function: reads your Notion databases and returns tidy JSON.
// The Notion token lives ONLY in the NOTION_TOKEN environment variable (never in the browser).

const NOTION_VERSION = '2022-06-28';

const DBS = {
  dates: process.env.DB_DATES || '3f788828e93080a4b4c3f76f9922946b',
  activities: process.env.DB_ACTIVITIES || '40588828e93080f4ad06c4cde5af1742',
  travel: process.env.DB_TRAVEL || '40588828e93080d1a00af76e6f7b428a',
  shows: process.env.DB_SHOWS || '3f288828e93080259671f3214fd1b5f9',
  movies: process.env.DB_MOVIES || '3f288828e930801b94a0c56c5cb25d78',
  books: process.env.DB_BOOKS || '3f388828e93080e3842ef6617367f677',
};

async function queryAll(id, token) {
  const results = [];
  let cursor;
  do {
    const r = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    });
    if (!r.ok) throw new Error(`Notion ${r.status} for database ${id}`);
    const j = await r.json();
    results.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return results;
}

const plain = (arr) => (arr || []).map((t) => t.plain_text).join('');

function normalise(page) {
  const p = page.properties || {};
  const out = { id: page.id, created: page.created_time };
  for (const [key, prop] of Object.entries(p)) {
    switch (prop.type) {
      case 'title': out.name = plain(prop.title) || 'Untitled'; break;
      case 'status': out.status = prop.status ? prop.status.name : null; break;
      case 'multi_select': out.tags = (prop.multi_select || []).map((o) => o.name); break;
      case 'date':
        out.date = prop.date ? prop.date.start : null;
        out.dateEnd = prop.date ? prop.date.end : null;
        break;
      case 'number': if (key.toLowerCase().startsWith('cost')) out.cost = prop.number; break;
      case 'checkbox': if (key === 'Has Debrief') out.hasDebrief = prop.checkbox; break;
      case 'files': {
        const f = (prop.files || [])[0];
        if (f) out.cover = f.type === 'file' ? f.file.url : f.external.url;
        break;
      }
      default: break;
    }
  }
  if (!out.tags) out.tags = [];
  return out;
}

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'NOTION_TOKEN is not set' });
    return;
  }
  const keys = Object.keys(DBS);
  const settled = await Promise.allSettled(keys.map((k) => queryAll(DBS[k], token)));
  const data = {};
  const errors = [];
  settled.forEach((s, i) => {
    if (s.status === 'fulfilled') data[keys[i]] = s.value.map(normalise);
    else { data[keys[i]] = []; errors.push(`${keys[i]}: ${s.reason.message}`); }
  });
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  res.status(200).json({ fetchedAt: new Date().toISOString(), errors, ...data });
};
