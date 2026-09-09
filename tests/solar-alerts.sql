do $$
declare fixture_id uuid:=gen_random_uuid(); a jsonb; c jsonb; n int;
begin
 begin
  perform public.solar_prepare(fixture_id,repeat('a',64),repeat('b',64),'{}','fixture',false,'http://127.0.0.1:4180');
  if public.solar_claim_alert(false,fixture_id) is not null then raise exception 'unpaid alert'; end if;
  perform public.solar_record_payment(fixture_id,'cs_test_alertfixture','pi_alertfixture',false,30000,'gbp','evt_alertfixture');
  perform public.solar_record_payment(fixture_id,'cs_test_alertfixture','pi_alertfixture',false,30000,'gbp','evt_alertfixture');
  select count(*) into n from public.solar_alerts where application_id=fixture_id;
  if n<>1 then raise exception 'duplicate alert'; end if;
  if public.solar_claim_alert(true,fixture_id) is not null then raise exception 'wrong mode claimed'; end if;
  a:=public.solar_claim_alert(false,fixture_id);
  if a is null or public.solar_claim_alert(false,fixture_id) is not null then raise exception 'claim overlap'; end if;
  if public.solar_finish_alert(fixture_id,gen_random_uuid(),true) then raise exception 'wrong lease acknowledged'; end if;
  perform public.solar_finish_alert(fixture_id,(a->>'lease_token')::uuid,false);
  if public.solar_claim_alert(false,fixture_id) is not null then raise exception 'retry has no backoff'; end if;
  update public.solar_alerts set next_attempt_at=now()-interval '1 minute' where application_id=fixture_id;
  a:=public.solar_claim_alert(false,fixture_id);
  if a is null then raise exception 'retry lost'; end if;
  update public.solar_alerts set lease_until=now()-interval '1 minute' where application_id=fixture_id;
  c:=public.solar_claim_alert(false,fixture_id);
  if c is null or c->>'lease_token'=a->>'lease_token' then raise exception 'expired lease not recovered'; end if;
  if public.solar_finish_alert(fixture_id,(a->>'lease_token')::uuid,true) then raise exception 'old worker acknowledged'; end if;
  perform public.solar_finish_alert(fixture_id,(c->>'lease_token')::uuid,true);
  if public.solar_claim_alert(false,fixture_id) is not null then raise exception 'sent alert reclaimed'; end if;
  a:=public.solar_claim_operation('recovery-test');
  if a->>'lease_token' is null or public.solar_claim_operation('recovery-test')->>'lease_token' is not null then raise exception 'operation overlap'; end if;
  perform public.solar_finish_operation('recovery-test',(a->>'lease_token')::uuid,jsonb_build_object('id',fixture_id,'created_at',now()),false);
  c:=public.solar_claim_operation('recovery-test');
  if c->'cursor'->>'id'<>fixture_id::text then raise exception 'cursor lost'; end if;
  if has_table_privilege('anon','public.solar_alerts','SELECT') or has_table_privilege('authenticated','public.solar_operations','SELECT') or has_function_privilege('anon','public.solar_claim_alert(boolean,uuid)','EXECUTE') then raise exception 'public access'; end if;
  raise exception 'rollback verified fixtures' using errcode='PT001';
 exception when sqlstate 'PT001' then null;
 end;
 if exists(select 1 from public.solar_applications where solar_applications.id=fixture_id) then raise exception 'fixture left behind'; end if;
end $$;
