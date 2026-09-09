create policy service_only on public.solar_alerts to service_role using(true) with check(true);
create policy service_only on public.solar_operations to service_role using(true) with check(true);
-- Include alert state in coherent recovery snapshots; operational leases are
-- recreated empty during restore, so interrupted jobs are not held forever.
create or replace function public.solar_backup()
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('schema_version',2,'captured_at',now(),
 'applications',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at,a.id) from public.solar_applications a),'[]'::jsonb),
 'work_items',coalesce((select jsonb_agg(to_jsonb(w) order by w.application_id) from public.solar_work_items w),'[]'::jsonb),
 'payment_events',coalesce((select jsonb_agg(to_jsonb(e) order by e.event_id) from public.solar_payment_events e),'[]'::jsonb),
 'alerts',coalesce((select jsonb_agg(to_jsonb(n) order by n.application_id) from public.solar_alerts n),'[]'::jsonb));
$$;
revoke execute on function public.solar_backup() from public,anon,authenticated;
grant execute on function public.solar_backup() to service_role;
