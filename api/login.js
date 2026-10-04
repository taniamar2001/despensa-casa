import { claveCorrecta, crearCookie, faltaConfiguracion } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const falta = faltaConfiguracion();
  if (falta.length) return res.status(500).json({ error: `Falta configurar en Vercel: ${falta.join(', ')}` });
  if (!claveCorrecta(req.body?.clave)) {
    await new Promise(r => setTimeout(r, 800)); // frena los intentos repetidos
    return res.status(401).json({ error: 'Clave incorrecta' });
  }
  res.setHeader('Set-Cookie', crearCookie());
  return res.status(200).json({ ok: true });
}
