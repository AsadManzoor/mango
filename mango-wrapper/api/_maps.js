// Turns a Google Maps link (full, short, or already an embed link) into something an <iframe> can show,
// with no API key needed. Returns null when the link isn't a map we can embed.

const SHORT = /^(maps\.app\.goo\.gl|goo\.gl|g\.co)$/i;
const isGoogleMaps = (h) => /(^|\.)google\.[a-z.]+$/i.test(h) || h === 'maps.google.com';

async function expand(url) {
  let u = url;
  for (let i = 0; i < 5; i++) {
    let host;
    try { host = new URL(u).hostname; } catch (e) { return null; }
    if (!SHORT.test(host)) return u;
    const r = await fetch(u, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MangoWrapper/1.0)' }, signal: AbortSignal.timeout(3500) });
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) { u = new URL(loc, u).href; continue; }
    return u;
  }
  return u;
}

function parse(u) {
  let x;
  try { x = new URL(u); } catch (e) { return null; }
  if (!isGoogleMaps(x.hostname)) return null;
  if (x.pathname.startsWith('/maps/embed')) return { embed: u, title: 'Map' };
  if (x.pathname.startsWith('/maps/dir')) return null; // routes can't be embedded without a key
  const dec = (s) => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s.replace(/\+/g, ' '); } };
  let name = null, lat = null, lng = null;
  const pm = x.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
  if (pm) name = dec(pm[1]);
  const at = x.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) { lat = at[1]; lng = at[2]; }
  else {
    const d = u.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (d) { lat = d[1]; lng = d[2]; }
  }
  const q = x.searchParams.get('q') || x.searchParams.get('query') || x.searchParams.get('destination');
  if (q && !name) {
    const c = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (c && lat == null) { lat = c[1]; lng = c[2]; } else name = q;
  }
  const ll = x.searchParams.get('ll');
  if (ll && lat == null) { const c = ll.split(','); if (c.length === 2) { lat = c[0]; lng = c[1]; } }
  if (!name && lat == null) return null;
  const query = name || `${lat},${lng}`;
  let embed = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  if (lat != null && name) embed += `&ll=${lat},${lng}`;
  return { embed, title: name || 'Map' };
}

async function mapFor(url) {
  try {
    if (!/^https?:\/\//i.test(url || '')) return null;
    const full = await expand(url);
    return full ? parse(full) : null;
  } catch (e) { return null; }
}

module.exports = { mapFor, parse };
