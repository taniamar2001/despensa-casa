import { borrarCookie } from './_lib.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', borrarCookie());
  return res.status(200).json({ ok: true });
}
