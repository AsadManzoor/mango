// /api/vip?k=<password>  ->  { ok: true|false }   Lets the intro screen check the VIP password.
const { isVip } = require('./_notion');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: isVip(req) });
};
