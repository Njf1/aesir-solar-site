-- Run as the migration owner on the dedicated Solar database. All fixtures
-- roll back within the exception subtransaction, even when assertions fail.
do $$
declare a jsonb; jobs integer;
begin
 begin
  a := public.solar_prepare('f0000000-0000-4000-8000-000000000001',repeat('a',64),repeat('b',64),jsonb_build_object('contact','SCHEMA FIXTURE','notes',repeat('full notes ',100),'agree',true,'privacy',true),'fixture',false,'http://127.0.0.1:4180');
  if a->>'status' <> 'saved' or length(a->'details'->>'notes') <> 1100 then raise exception 'intake assertion failed'; end if;
  perform public.solar_bind('f0000000-0000-4000-8000-000000000001','cs_test_schemafixture',false);
  begin
   perform public.solar_record_payment('f0000000-0000-4000-8000-000000000001','cs_test_schemafixture','pi_schemafixture',false,1,'gbp','evt_bad');
   raise exception 'wrong amount accepted';
  exception when invalid_parameter_value then null; end;
  perform public.solar_record_payment('f0000000-0000-4000-8000-000000000001','cs_test_schemafixture','pi_schemafixture',false,30000,'gbp','evt_schemafixture');
  perform public.solar_record_payment('f0000000-0000-4000-8000-000000000001','cs_test_schemafixture','pi_schemafixture',false,30000,'gbp','evt_schemafixture');
  perform public.solar_record_payment('f0000000-0000-4000-8000-000000000001','cs_test_schemafixture','pi_schemafixture',false,30000,'gbp','evt_schemafixture2');
  select count(*) into jobs from public.solar_work_items where application_id='f0000000-0000-4000-8000-000000000001';
  if jobs<>1 then raise exception 'duplicate work items'; end if;
  begin
   perform public.solar_prepare('f0000000-0000-4000-8000-000000000001',repeat('c',64),repeat('b',64),'{}','fixture',false,'http://127.0.0.1:4180');
   raise exception 'reference takeover accepted';
  exception when invalid_parameter_value then null; end;
  if has_table_privilege('anon','public.solar_applications','SELECT') or has_table_privilege('authenticated','public.solar_work_items','SELECT') or has_function_privilege('anon','public.solar_prepare(uuid,text,text,jsonb,text,boolean,text)','EXECUTE') then raise exception 'public access leaked'; end if;
  raise exception 'rollback successful fixture' using errcode='PT001';
 exception when sqlstate 'PT001' then null;
 end;
 if exists(select 1 from public.solar_applications where id='f0000000-0000-4000-8000-000000000001') then raise exception 'fixture not rolled back'; end if;
end $$;
