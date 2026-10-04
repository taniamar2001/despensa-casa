# Despensa de la Casa

Inventario de alimentos, aseo y mantenimiento del hogar para la familia:

- Estado de cada producto en un toque: **Hay / Poco / No hay**
- Alertas de vencimiento y resumen semanal (para revisarlo los jueves)
- Lista de mercado automática con lo que se acaba
- Carga masiva desde un catálogo de la canasta colombiana o pegando una lista
- Recetas de la casa: muestra si hay todo o qué falta
- Presupuesto mensual por quincenas, gasto por tipo y por tienda, comida perdida

## Cómo está hecha

| Pieza | Qué hace |
|---|---|
| `index.html` | Toda la app (pantallas y lógica). Se instala en el celular como app. |
| `api/` | Funciones de Vercel: la clave de la casa (`login`, `logout`) y los datos (`docs`). |
| Neon (Postgres) | Guarda los datos en una tabla `docs`, que se crea sola la primera vez. |

Cada celular revisa si hay cambios cada 15 segundos y también al volver a abrir la app.

## Variables de entorno (en Vercel, nunca en el código)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La conexión de Neon (`postgresql://…`) |
| `CLAVE_CASA` | La clave que usará la familia para entrar |
| `SESSION_SECRET` | Un texto largo y aleatorio para firmar las sesiones |

## Puesta en marcha

1. **GitHub:** crea un repositorio privado `despensa-casa` y sube esta carpeta (`git push`).
2. **Vercel:** *Add New → Project →* importa el repositorio. Framework: **Other**.
   Antes de *Deploy*, abre **Environment Variables** y agrega las tres variables de arriba.
3. Abre la dirección que entrega Vercel, escribe la clave de la casa y listo.
4. Comparte la dirección y la clave con la familia. En el celular: menú del navegador → **Agregar a la pantalla de inicio**.

Cada `git push` a `main` publica una versión nueva automáticamente.

## Mantenimiento

- **Cambiar la clave:** Vercel → Settings → Environment Variables → `CLAVE_CASA` → Redeploy.
- **Cerrar la sesión de todos los dispositivos:** cambia `SESSION_SECRET` y haz Redeploy.
- **Contraseña de la base de datos:** si se expone, cámbiala en Neon (Roles → Reset password) y actualiza `DATABASE_URL` en Vercel.

## Pendiente para más adelante

Funciones con IA (leer facturas, fotos de la nevera, sugerir recetas): se pueden agregar con una función de Vercel y una clave de la API de Anthropic.
