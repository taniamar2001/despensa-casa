-- Despensa de la Casa: base de datos en Supabase
-- Cómo usarlo: en Supabase abre "SQL Editor", pega todo este archivo,
-- cambia TU_CORREO@gmail.com por tu correo (línea final) y presiona "Run".

-- Correos autorizados para entrar a la app
create table if not exists public.miembros (
  email        text primary key,
  agregado_por text,
  creado       timestamptz not null default now()
);

-- Todos los datos de la app (productos, lista, compras, pérdidas, recetas, actividad, ajustes)
create table if not exists public.docs (
  coleccion   text not null,
  id          text not null,
  data        jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (coleccion, id)
);

-- ¿El usuario que hace la consulta es de la casa?
create or replace function public.es_miembro()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.miembros
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Cambia solo los campos enviados, sin pisar lo que otra persona cambió al mismo tiempo
create or replace function public.fusionar_doc(p_coleccion text, p_id text, p_cambios jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.docs
     set data = data || p_cambios, actualizado = now()
   where coleccion = p_coleccion and id = p_id;
  if not found then
    raise exception 'El documento no existe o no tienes acceso' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.marcar_actualizado()
returns trigger language plpgsql as $$
begin new.actualizado = now(); return new; end;
$$;
drop trigger if exists docs_actualizado on public.docs;
create trigger docs_actualizado before update on public.docs
  for each row execute function public.marcar_actualizado();

-- Reglas de acceso: solo los correos de la casa leen y escriben
alter table public.miembros enable row level security;
alter table public.docs     enable row level security;

drop policy if exists "miembros: leer"   on public.miembros;
drop policy if exists "miembros: crear"  on public.miembros;
drop policy if exists "miembros: borrar" on public.miembros;
create policy "miembros: leer"   on public.miembros for select to authenticated using (public.es_miembro());
create policy "miembros: crear"  on public.miembros for insert to authenticated with check (public.es_miembro());
create policy "miembros: borrar" on public.miembros for delete to authenticated using (public.es_miembro());

drop policy if exists "docs: leer"       on public.docs;
drop policy if exists "docs: crear"      on public.docs;
drop policy if exists "docs: actualizar" on public.docs;
drop policy if exists "docs: borrar"     on public.docs;
create policy "docs: leer"       on public.docs for select to authenticated using (public.es_miembro());
create policy "docs: crear"      on public.docs for insert to authenticated with check (public.es_miembro());
create policy "docs: actualizar" on public.docs for update to authenticated using (public.es_miembro()) with check (public.es_miembro());
create policy "docs: borrar"     on public.docs for delete to authenticated using (public.es_miembro());

-- Cambios en tiempo real (todos ven lo mismo al instante)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Ajustes iniciales: presupuesto de $8.000.000 y aviso 3 días antes del vencimiento
insert into public.docs (coleccion, id, data)
values ('config', 'general', '{"presupuesto": 8000000, "diasAlerta": 3, "familia": []}')
on conflict do nothing;

-- Tu correo: el primero con acceso. Desde la app agregas los demás (Gastos → Ajustes).
insert into public.miembros (email) values (lower('TU_CORREO@gmail.com'))
on conflict do nothing;
