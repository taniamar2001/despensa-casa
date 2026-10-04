# Despensa de la Casa

Inventario de alimentos, aseo y mantenimiento del hogar para la familia:

- Estado de cada producto en un toque: **Hay / Poco / No hay**
- Alertas de vencimiento y resumen semanal (para revisarlo los jueves)
- Lista de mercado automática con lo que se acaba
- Carga masiva desde un catálogo de la canasta colombiana o pegando una lista
- Recetas de la casa: muestra si hay todo o qué falta
- Presupuesto mensual por quincenas, gasto por tipo y por tienda, comida perdida

Es una página web estática (`index.html`) que se publica en **Vercel**. Los datos y el acceso viven en **Supabase**.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app |
| `config.js` | Dirección y clave pública de Supabase |
| `supabase/schema.sql` | Tablas, reglas de acceso y ajustes iniciales |
| `manifest.webmanifest`, `icon.svg`, `sw.js` | Para instalarla en el celular como una app |

## Puesta en marcha (una sola vez)

### 1. Supabase (base de datos y acceso)

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo (plan gratuito, región `South America (São Paulo)`).
2. Ve a **SQL Editor → New query**, pega el contenido de `supabase/schema.sql`, cambia `TU_CORREO@gmail.com` por tu correo y presiona **Run**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL** → `supabaseUrl` en `config.js`
   - **anon public** → `supabaseAnonKey` en `config.js`
4. Ve a **Authentication → Emails → Magic Link** y agrega el código al mensaje, para poder entrar escribiéndolo en el celular:
   ```html
   <p>Tu código para entrar: <strong>{{ .Token }}</strong></p>
   ```

### 2. GitHub (guardar el código)

1. Crea una cuenta en <https://github.com> y un repositorio nuevo **privado** llamado `despensa-casa` (sin README).
2. Desde esta carpeta:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/despensa-casa.git
   git push -u origin main
   ```

### 3. Vercel (publicar la app)

1. Crea una cuenta en <https://vercel.com> entrando con GitHub.
2. **Add New → Project → Import** el repositorio `despensa-casa`.
3. Framework: **Other**. No hace falta comando de build. Presiona **Deploy**.
4. Copia la dirección que te da Vercel (por ejemplo `https://despensa-casa.vercel.app`).
5. En Supabase, **Authentication → URL Configuration**:
   - **Site URL**: la dirección de Vercel
   - **Redirect URLs**: la dirección de Vercel

### 4. Entrar e invitar a la familia

1. Abre la dirección de Vercel, escribe tu correo y entra con el enlace o el código.
2. En **Gastos → Ajustes → Correos con acceso**, agrega el correo de cada persona.
3. Envíales la dirección. En el celular: menú del navegador → **Agregar a la pantalla de inicio**.

## Cambios futuros

Cada `git push` a `main` publica la nueva versión en Vercel automáticamente.

## Notas

- El plan gratuito de Supabase envía pocos correos de acceso por hora. Como la sesión queda abierta en cada celular, solo se necesita al entrar la primera vez.
- Un proyecto gratuito de Supabase se pausa tras 7 días sin uso; se reactiva desde su panel.
- Las funciones con IA (leer facturas, fotos de la nevera, sugerir recetas) están desactivadas en esta versión. Se pueden agregar después con una función de Vercel y una clave de la API de Anthropic.
