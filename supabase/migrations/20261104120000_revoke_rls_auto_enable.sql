-- rls_auto_enable es un event trigger de Supabase que activa RLS en las tablas
-- nuevas de public; no debe poder llamarse vía /rest/v1/rpc. Los event
-- triggers no requieren privilegio EXECUTE de los roles de la API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
