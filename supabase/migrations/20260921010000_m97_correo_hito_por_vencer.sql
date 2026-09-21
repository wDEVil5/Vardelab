-- ============================================================================
-- M97 · Correo real para "hito por vencer"
--
-- Único de los eventos de notificación (M39) que hasta ahora solo creaba la
-- fila in-app, sin correo: a diferencia de los demás (M43-M47, M92-M95), no
-- lo dispara ninguna Server Action, sino `pg_cron` (M64/M68) una vez al día
-- — una función `plpgsql` pura no puede hablar HTTP por sí sola, y
-- reimplementar la plantilla de correo en SQL (en vez de reusar
-- `features/notifications/email.ts`) hubiera duplicado toda esa lógica.
--
-- Se resuelve con `pg_net` (extensión de Postgres para HTTP asíncrono, ya
-- incluida en la imagen de Supabase, solo no habilitada): la función arma el
-- mismo texto que ya insertaba en `notifications`, lo empaqueta en un JSON, y
-- hace un POST a un Route Handler nuevo de la app
-- (`app/api/cron/hitos-por-vencer/route.ts`) que llama a `sendEmailToUser`
-- para cada destinatario — reusando la plantilla real, sin tocarla.
--
-- La URL del webhook y el secreto que lo protege se leen de **Supabase
-- Vault** (`vault.decrypted_secrets`, extensión `supabase_vault` — ya viene
-- instalada en la imagen), no de esta migración ni de un GUC de Postgres:
-- se probó primero con `alter database ... set app.settings...` y falló acá
-- mismo en local con "permission denied to set parameter" — el rol
-- `postgres` de Supabase no es superusuario de verdad (a propósito, mismo
-- motivo por el que este proyecto ya usa `service_role` en vez de conectarse
-- como superuser). Vault sí es de uso normal: cualquier rol con acceso a
-- `vault.create_secret`/`vault.decrypted_secrets` puede guardar y leer un
-- secreto, sin permisos especiales, e idéntico en local y en producción.
--
-- Los valores en sí no van en esta migración (son distintos por ambiente y
-- no deben quedar committeados): para desarrollo local, `supabase/seed.sql`
-- los carga con `vault.create_secret(...)` y un valor de prueba
-- (`host.docker.internal`, para que el contenedor de Postgres alcance el
-- `npm run dev` corriendo en la máquina host); para producción, es un paso
-- manual documentado en BACKEND.md (§10, "antes de producción pública") —
-- mismo tratamiento que ya tienen `BREVO_API_KEY`/`SUPABASE_SERVICE_ROLE_KEY`.
--
-- Si cualquiera de los dos settings falta (típicamente: nunca se configuraron
-- en ese ambiente), la función sigue creando las notificaciones in-app igual
-- que siempre — simplemente no intenta el POST. Nunca bloquea ni revierte el
-- resto de la función: `pg_net` encola la petición y responde de inmediato,
-- el HTTP real ocurre después en un worker aparte (tabla `net._http_response`
-- para inspeccionar resultados si hiciera falta depurar).
-- ============================================================================

create extension if not exists pg_net;

create or replace function public.notificar_hitos_por_vencer()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _payload jsonb;
  _webhook_url text;
  _webhook_secret text;
begin
  select decrypted_secret into _webhook_url
    from vault.decrypted_secrets where name = 'cron_webhook_url';
  select decrypted_secret into _webhook_secret
    from vault.decrypted_secrets where name = 'cron_webhook_secret';

  -- Arma el mensaje una sola vez (antes se calculaba dos veces: una para el
  -- insert, otra para el update de dedup) y captura, vía `returning`, a quién
  -- se le insertó una notificación de verdad — eso es exactamente a quién
  -- hay que mandarle el correo.
  with candidatos as (
    select
      m.id as milestone_id,
      tm.user_id,
      'El hito "' || m.titulo || '" ' ||
        case (m.fecha_limite - current_date)
          when 0 then 'vence hoy.'
          when 1 then 'vence mañana.'
          else 'vence en ' || (m.fecha_limite - current_date) || ' días.'
        end as mensaje,
      '/proyecto/' || m.project_id as link
    from public.milestones m
    join public.projects p on p.id = m.project_id
    join public.teams t on t.project_id = m.project_id
    join public.team_members tm on tm.team_id = t.id
    where m.fecha_limite between current_date and current_date + interval '3 days'
      and m.estado in ('pendiente', 'en_progreso')
      and p.status not in ('cancelado', 'completado')
      and m.aviso_vencimiento_enviado_at is null
  ),
  notificados as (
    insert into public.notifications (user_id, tipo, mensaje, link)
    select user_id, 'hito_por_vencer', mensaje, link from candidatos
    returning user_id, mensaje, link
  )
  select jsonb_agg(jsonb_build_object('userId', user_id, 'mensaje', mensaje, 'link', link))
  into _payload
  from notificados;

  -- Mismo criterio de dedup que M68, sin cambios: marca el hito como avisado
  -- para que el cron de mañana no lo repita.
  update public.milestones m
  set aviso_vencimiento_enviado_at = now()
  from public.projects p
  where p.id = m.project_id
    and m.fecha_limite between current_date and current_date + interval '3 days'
    and m.estado in ('pendiente', 'en_progreso')
    and p.status not in ('cancelado', 'completado')
    and m.aviso_vencimiento_enviado_at is null;

  if _payload is not null and _webhook_url is not null and _webhook_secret is not null then
    perform net.http_post(
      url := _webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _webhook_secret
      ),
      body := jsonb_build_object('items', _payload)
    );
  end if;
end;
$$;
