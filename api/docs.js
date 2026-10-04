import { sql, asegurarEsquema, sesionValida, faltaConfiguracion, COLECCIONES } from './_lib.js';

const ID_VALIDO = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
const MAX_BYTES = 200 * 1024;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const falta = faltaConfiguracion();
  if (falta.length) return res.status(500).json({ error: `Falta configurar en Vercel: ${falta.join(', ')}` });
  if (!sesionValida(req)) return res.status(401).json({ error: 'Sesión vencida' });

  try {
    await asegurarEsquema();

    // Leer: todo (primera vez) o solo lo que cambió desde "since"
    if (req.method === 'GET') {
      const since = req.query.since ? new Date(String(req.query.since)) : null;
      const [{ ahora }] = await sql`select clock_timestamp() as ahora`;
      const docs = since && !isNaN(since)
        ? await sql`select coleccion, id, data, borrado from docs where actualizado > ${since.toISOString()} order by actualizado`
        : await sql`select coleccion, id, data, borrado from docs where not borrado`;
      return res.status(200).json({ ahora, docs });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { op, coleccion, id, data } = req.body || {};
    if (!COLECCIONES.has(coleccion) || !ID_VALIDO.test(String(id || ''))) return res.status(400).json({ error: 'Colección o id no válidos' });
    if (op !== 'delete' && (typeof data !== 'object' || data === null || Array.isArray(data))) return res.status(400).json({ error: 'Datos no válidos' });
    const json = JSON.stringify(data ?? {});
    if (json.length > MAX_BYTES) return res.status(413).json({ error: 'Documento demasiado grande' });

    if (op === 'set') {
      await sql`insert into docs (coleccion, id, data, actualizado, borrado)
                values (${coleccion}, ${id}, ${json}::jsonb, clock_timestamp(), false)
                on conflict (coleccion, id) do update
                set data = excluded.data, actualizado = clock_timestamp(), borrado = false`;
    } else if (op === 'update') {
      const filas = await sql`update docs set data = data || ${json}::jsonb, actualizado = clock_timestamp()
                              where coleccion = ${coleccion} and id = ${id} and not borrado returning id`;
      if (!filas.length) return res.status(404).json({ error: 'No existe' });
    } else if (op === 'delete') {
      await sql`update docs set borrado = true, data = '{}'::jsonb, actualizado = clock_timestamp()
                where coleccion = ${coleccion} and id = ${id}`;
      if (Math.random() < 0.05) await sql`delete from docs where borrado and actualizado < now() - interval '30 days'`;
    } else {
      return res.status(400).json({ error: 'Operación no válida' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de la base de datos' });
  }
}
