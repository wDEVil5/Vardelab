-- ============================================================================
-- M17 · Leads: contacto de organizaciones y propuestas de desafío
--
-- Canal de captación del piloto (concierge). Unifica dos entradas públicas en
-- una sola tabla, distinguidas por `tipo`:
--   · contacto_organizacion → "Hablar con CampusLab" (landing de organizaciones)
--   · propuesta_desafio      → "Proponer un desafío" (home + /proponer)
--
-- Cualquier visitante (anónimo) puede enviar un lead; la lectura y la gestión
-- de estado quedan reservadas a moderador/admin. La revisión de esta bandeja se
-- hará vía panel de moderación en una etapa futura (Fase 2); por ahora se
-- consulta desde el panel de Supabase con esos roles.
-- ============================================================================

-- 1) ENUMS -------------------------------------------------------------------
create type lead_tipo as enum ('contacto_organizacion', 'propuesta_desafio');
create type lead_estado as enum ('nuevo', 'contactado', 'descartado');

-- 2) TABLA -------------------------------------------------------------------
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  tipo         lead_tipo not null,
  nombre       text not null,
  email        text not null,
  organizacion text,
  mensaje      text not null,
  estado       lead_estado not null default 'nuevo',
  created_at   timestamptz not null default now(),

  -- Límites defensivos para acotar payloads desde un formulario público.
  constraint leads_nombre_len check (char_length(nombre) between 1 and 120),
  constraint leads_email_len check (char_length(email) between 3 and 200),
  constraint leads_org_len check (organizacion is null or char_length(organizacion) <= 160),
  constraint leads_mensaje_len check (char_length(mensaje) between 1 and 2000)
);

-- Índice para revisar la bandeja por fecha.
create index leads_created_at_idx on public.leads (created_at desc);

-- 3) RLS ---------------------------------------------------------------------
alter table public.leads enable row level security;

-- Insert público (visitante anónimo o autenticado). Se fuerza estado = 'nuevo'
-- para que nadie marque un lead como contactado/descartado desde el cliente.
create policy "leads_insert_public"
  on public.leads for insert
  to anon, authenticated
  with check (estado = 'nuevo');

-- Lectura solo para el staff del piloto (moderador/admin).
create policy "leads_select_staff"
  on public.leads for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'moderador')
    or public.has_role(auth.uid(), 'admin')
  );

-- Gestión de estado (nuevo → contactado/descartado) solo moderador/admin.
create policy "leads_update_staff"
  on public.leads for update
  to authenticated
  using (
    public.has_role(auth.uid(), 'moderador')
    or public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.has_role(auth.uid(), 'moderador')
    or public.has_role(auth.uid(), 'admin')
  );
