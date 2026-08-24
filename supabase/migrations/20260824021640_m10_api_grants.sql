-- ============================================================================
-- M10 · Privilegios de tabla para los roles de la API (anon / authenticated)
-- La RLS gobierna QUÉ filas ve cada rol, pero Postgres además exige privilegio
-- de tabla (GRANT) para poder consultarla. Sin esto PostgREST devuelve
-- "permission denied" aunque la RLS lo permitiría. Se otorga el privilegio base
-- y la RLS sigue filtrando las filas → seguridad en dos capas.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- anon: solo lectura (catálogo público). La RLS lo limita a las filas públicas.
grant select on all tables in schema public to anon;

-- authenticated: lectura y escritura; la RLS decide sobre qué filas puede operar.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Funciones helper usadas dentro de las políticas / expuestas como RPC.
grant execute on all functions in schema public to anon, authenticated;

-- Que los privilegios apliquen también a las tablas y funciones que se creen
-- en migraciones futuras (evita repetir el grant en cada tabla nueva).
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant execute on functions to anon, authenticated;
