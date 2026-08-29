-- ============================================================================
-- seed.sql · Datos de demo — SOLO LOCAL
-- Se ejecuta con `supabase db reset` (nunca se aplica en producción).
-- Objetivo: poblar el catálogo público (P-02/P-03) con contenido realista.
-- ============================================================================

-- 1) USUARIOS DEMO (patrocinadores) ------------------------------------------
-- organizations.owner_id referencia auth.users (NOT NULL), así que primero
-- hacen falta usuarios. Se insertan directo en auth.users (solo local).
-- El trigger handle_new_user (M1) crea su fila en profiles automáticamente,
-- tomando el nombre de raw_user_meta_data.
-- Los campos de token (confirmation_token, recovery_token, email_change, …) se
-- fijan en '' (string vacío) y NO en NULL: GoTrue (Auth) hace comparaciones de
-- string sobre ellos al iniciar sesión y falla con "Database error querying
-- schema" si están en NULL. Al crear un usuario por la API esto lo hace GoTrue;
-- al insertarlo a mano hay que ponerlo explícitamente.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password,
   email_confirmed_at, created_at, updated_at,
   raw_app_meta_data, raw_user_meta_data,
   confirmation_token, recovery_token, email_change,
   email_change_token_new, email_change_token_current,
   phone_change, phone_change_token, reauthentication_token)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'investigacion@demo.cl',
   crypt('demo1234', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"nombre":"Camila Rojas","rol":"patrocinador"}',
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'semilla@demo.cl',
   crypt('demo1234', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}',
   '{"nombre":"Diego Fuentes","rol":"patrocinador"}',
   '', '', '', '', '', '', '', '')
on conflict (id) do nothing;

-- 2) ORGANIZACIONES ----------------------------------------------------------
insert into public.organizations (id, owner_id, nombre, tipo, descripcion, sitio_web, verificacion, contacto)
values
  ('a0000000-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   'Unidad de Investigación · UNAB', 'academica',
   'Investigación aplicada y colaboración estudiantil.',
   'investigacion.unab.cl', 'verificado', 'Camila Rojas'),
  ('a0000000-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222',
   'Fundación Semilla', 'social',
   'ONG de impacto comunitario en barrios.',
   'fundacionsemilla.cl', 'verificado', 'Diego Fuentes')
on conflict (id) do nothing;

-- 3) PROYECTOS (publicados, visibles en el catálogo público) -----------------
insert into public.projects
  (id, org_id, created_by, titulo, resumen, problema, alcance, entregable,
   expectativas, status, modalidad, duracion_semanas)
values
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Dashboard de encuesta académica',
   'Visualizar respuestas de una encuesta y detectar patrones.',
   'La unidad recibe cientos de respuestas y no tiene forma simple de leerlas.',
   'Una vista web con filtros y gráficos básicos sobre datos ya recolectados.',
   'Dashboard responsive con filtros y una guía breve de actualización.',
   'Reuniones semanales; foco en claridad más que en features.',
   'publicado', 'remoto', 4),
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'Rediseño del sitio vecinal',
   'Modernizar el sitio de una junta de vecinos.',
   'El sitio actual es viejo y difícil de actualizar para el equipo.',
   'Rediseño de las 4 páginas principales y guía de contenidos.',
   'Prototipo navegable + entrega de componentes reutilizables.',
   'Trabajo remoto con una reunión presencial inicial.',
   'publicado', 'hibrido', 3),
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   'Automatización de inventario',
   'Reducir el trabajo manual de registro de stock.',
   'El inventario se lleva a mano en planillas y se desactualiza.',
   'Un script/flujo que registre entradas y salidas con validación.',
   'Herramienta funcional + documentación de uso.',
   'Dedicación acotada; entregable verificable al cierre.',
   'publicado', 'remoto', 5),
  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Análisis de datos de reciclaje',
   'Explorar datos de reciclaje municipal y sacar conclusiones.',
   'Hay datos abiertos pero nadie los ha analizado para tomar decisiones.',
   'Limpieza, análisis exploratorio y un informe con hallazgos.',
   'Informe con visualizaciones + notebook reproducible.',
   'Foco formativo; se valora el rigor del análisis.',
   'publicado', 'presencial', 5)
on conflict (id) do nothing;

-- 4) ROLES DE CADA PROYECTO --------------------------------------------------
insert into public.project_roles (id, project_id, nombre, descripcion, cupos)
values
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Datos','Preparar y modelar los datos de la encuesta.',1),
  ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','Frontend','Construir la vista y los gráficos.',2),
  ('c0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002','UX/UI','Rediseñar la experiencia y las pantallas.',1),
  ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000002','Contenidos','Reescribir y ordenar los contenidos.',1),
  ('c0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000003','Backend','Diseñar el flujo de registro y validación.',1),
  ('c0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000004','Análisis de datos','Limpiar, analizar y comunicar hallazgos.',2)
on conflict (id) do nothing;

-- 5) HABILIDADES EXIGIDAS POR ROL --------------------------------------------
-- Se referencia el catálogo skills (sembrado en M2) por nombre, ya que sus id
-- son aleatorios.
insert into public.project_role_skills (project_role_id, skill_id, nivel_minimo)
select r.role_id, s.id, r.nivel::skill_level
from (values
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'Bases de datos',    'intermedio'),
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'Análisis de datos', 'avanzado'),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'Frontend',          'intermedio'),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'Visualización',     'basico'),
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'UX/UI',             'intermedio'),
  ('c0000000-0000-0000-0000-000000000004'::uuid, 'Redacción',         'basico'),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'Backend',           'intermedio'),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'Automatización',    'intermedio'),
  ('c0000000-0000-0000-0000-000000000006'::uuid, 'Análisis de datos', 'intermedio')
) as r(role_id, skill_nombre, nivel)
join public.skills s on s.nombre = r.skill_nombre
on conflict (project_role_id, skill_id) do nothing;
