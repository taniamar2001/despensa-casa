import { neon } from '@neondatabase/serverless';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const sql = neon(process.env.DATABASE_URL);

const COOKIE = 'despensa_sesion';
const DURACION_DIAS = 180;
export const COLECCIONES = new Set(['productos', 'lista', 'compras', 'mermas', 'recetas', 'actividad', 'config']);

let esquemaListo = null;
export function asegurarEsquema() {
  esquemaListo ??= (async () => {
    await sql`create table if not exists docs (
      coleccion   text not null,
      id          text not null,
      data        jsonb not null default '{}'::jsonb,
      actualizado timestamptz not null default clock_timestamp(),
      borrado     boolean not null default false,
      primary key (coleccion, id)
    )`;
    await sql`create index if not exists docs_actualizado on docs (actualizado)`;
    await sql`insert into docs (coleccion, id, data)
              values ('config', 'general', '{"presupuesto": 8000000, "diasAlerta": 3, "familia": []}'::jsonb)
              on conflict do nothing`;
  })().catch(e => { esquemaListo = null; throw e; });
  return esquemaListo;
}

const firmar = valor => createHmac('sha256', process.env.SESSION_SECRET).update(valor).digest('base64url');

export function crearCookie() {
  const vence = Date.now() + DURACION_DIAS * 864e5;
  const token = `${vence}.${firmar(String(vence))}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DURACION_DIAS * 86400}`;
}
export const borrarCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function sesionValida(req) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p.length === 2));
  const [vence, firma] = String(cookies[COOKIE] || '').split('.');
  if (!vence || !firma || Number(vence) < Date.now()) return false;
  const esperada = Buffer.from(firmar(vence)), recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export function claveCorrecta(clave) {
  const real = Buffer.from(firmar('clave:' + (process.env.CLAVE_CASA || '')));
  const dada = Buffer.from(firmar('clave:' + String(clave || '')));
  return Boolean(process.env.CLAVE_CASA) && timingSafeEqual(real, dada);
}

export function faltaConfiguracion() {
  return ['DATABASE_URL', 'SESSION_SECRET', 'CLAVE_CASA'].filter(k => !process.env[k]);
}
