// Vercel serverless function: reads your Notion databases and returns tidy JSON.
// The Notion token lives ONLY in the NOTION_TOKEN environment variable (never in the browser).

const { headers, nfetch, fileUrl, normalise } = require('./_notion');

const DBS = {
  dates: process.env.DB_DATES || '3f788828e93080a4b4c3f76f9922946b',
  activities: process.env.DB_ACTIVITIES || '40588828e93080f4ad06c4cde5af1742',
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

module.exports = async (req, res) => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'NOTION_TOKEN is not set' });
    return;
  }
  const keys = Object.keys(DBS);
  const settled = await Promise.allSettled([...keys.map((k) => queryAll(DBS[k], token)), mainPage(token)]);
  const data = {};
  const errors = [];
  keys.forEach((k, i) => {
    const s = settled[i];
    if (s.status === 'fulfilled') data[k] = s.value.map(normalise);
    else { data[k] = []; errors.push(`${k}: ${s.reason.message}`); }
  });
  const m = settled[keys.length];
  if (m.status === 'fulfilled') data.banner = m.value.banner;
  else errors.push(`banner: ${m.reason.message}`);
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  res.status(200).json({ fetchedAt: new Date().toISOString(), errors, ...data });
};
