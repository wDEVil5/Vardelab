-- ============================================================================
-- M105 · Admin/moderador pueden ocultar una ficha de portafolio que divulgue
-- datos no autorizados (REGLAS_NEGOCIO.md, "Confianza, privacidad y
-- administración" — propuesta confirmada por el dueño del piloto)
--
-- Brecha real: hoy nadie más que el propio estudiante puede cambiar la
-- visibilidad de su ficha (`portfolio_items_write_own`, M6/M102, y la Server
-- Action `togglePortfolioItemVisibility`). Si un admin la ocultara escribiendo
-- directo sobre `visibility` con esa misma policy, el estudiante podría
-- revertirlo con su propio botón dos segundos después — la moderación no
-- "pega" a nada.
--
-- `oculto_por_moderacion` es un flag aparte que el dueño no controla: la
-- lectura pública lo respeta sin importar lo que diga `visibility`, así que
-- aunque el estudiante la vuelva a marcar pública, sigue sin verse fuera de
-- Vardelab hasta que un admin o moderador la reactive.
--
-- Mismo patrón que `close_project`/`accept_application`: función
-- `security definer` que reautoriza a mano (moderador o admin — mismo umbral
-- que ya usa la RLS de `reports`, M7) y devuelve un booleano de éxito en vez
-- de solo confiar en RLS silenciosa. El registro en `audit_logs` lo hace la
-- Server Action después (moderador ya puede insertar ahí desde M100).
-- ============================================================================

alter table public.portfolio_items
  add column oculto_por_moderacion boolean not null default false,
  add column oculto_motivo text;

comment on column public.portfolio_items.oculto_por_moderacion is
  'Ocultamiento forzado por admin/moderador (no por el dueño): la lectura pública lo respeta aunque visibility siga en publico.';

-- Moderador ve fichas PÚBLICAS aunque estén ocultas (para poder reactivarlas),
-- pero no gana visibilidad sobre fichas privadas ajenas — eso seguiría siendo
-- solo del dueño y de admin (mismo alcance que ya tenía la policy de M6).
drop policy "portfolio_items_select_public_or_own" on public.portfolio_items;

create policy "portfolio_items_select_public_or_own"
  on public.portfolio_items for select
  using (
    (visibility = 'publico' and not oculto_por_moderacion)
    or profile_id = auth.uid()
    or public.has_role(auth.uid(), 'admin')
    or (visibility = 'publico' and public.has_role(auth.uid(), 'moderador'))
  );

create or replace function public.set_portfolio_item_moderacion(
  _item_id uuid,
  _oculto boolean,
  _motivo text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _filas int;
begin
  if not public.has_role(auth.uid(), 'moderador') and not public.has_role(auth.uid(), 'admin') then
    raise exception 'No autorizado';
  end if;

  if _oculto and coalesce(trim(_motivo), '') = '' then
    raise exception 'Falta el motivo';
  end if;

  update public.portfolio_items
  set oculto_por_moderacion = _oculto,
      oculto_motivo = case when _oculto then _motivo else null end
  where id = _item_id;

  get diagnostics _filas = row_count;
  return _filas > 0;
end;
$$;
