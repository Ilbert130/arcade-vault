-- handle_new_user solo debe ejecutarse desde el trigger on_auth_user_created,
-- no vía /rest/v1/rpc. Los triggers no requieren privilegio EXECUTE.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
