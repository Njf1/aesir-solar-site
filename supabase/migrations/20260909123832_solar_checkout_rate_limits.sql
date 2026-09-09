-- Short-lived keyed digests, never raw IP addresses. Server-only admission.
create table public.solar_checkout_limits (
 bucket text not null check(bucket ~ '^[ie]:[a-f0-9]{64}$'),
 window_start timestamptz not null,
 attempts integer not null check(attempts > 0),
 primary key(bucket,window_start)
);
alter table public.solar_checkout_limits enable row level security;
revoke all on public.solar_checkout_limits from public,anon,authenticated;
grant select,insert,update,delete on public.solar_checkout_limits to service_role;
create policy service_only on public.solar_checkout_limits to service_role using(true) with check(true);
create function public.solar_prepare_limited(p_id uuid,p_token_hash text,p_payload_hash text,p_details jsonb,p_policy_version text,p_livemode boolean,p_origin text,p_ip_hash text,p_email_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare w timestamptz := date_trunc('hour',now()); n integer;
begin
 if p_ip_hash !~ '^[a-f0-9]{64}$' or p_email_hash !~ '^[a-f0-9]{64}$' or p_ip_hash is null or p_email_hash is null then
  raise exception 'invalid_rate_identity' using errcode='22023';
 end if;
 -- Identical retries are admitted without consuming new-application quota.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 if exists(select 1 from public.solar_applications where id=p_id) then
  return public.solar_prepare(p_id,p_token_hash,p_payload_hash,p_details,p_policy_version,p_livemode,p_origin);
 end if;
 delete from public.solar_checkout_limits where window_start < w-interval '24 hours';
 insert into public.solar_checkout_limits values('e:'||p_email_hash,w,1)
 on conflict(bucket,window_start) do update set attempts=solar_checkout_limits.attempts+1 returning attempts into n;
 if n>10 then raise exception 'checkout_rate_limited' using errcode='P0429'; end if;
 insert into public.solar_checkout_limits values('i:'||p_ip_hash,w,1)
 on conflict(bucket,window_start) do update set attempts=solar_checkout_limits.attempts+1 returning attempts into n;
 if n>30 then raise exception 'checkout_rate_limited' using errcode='P0429'; end if;
 return public.solar_prepare(p_id,p_token_hash,p_payload_hash,p_details,p_policy_version,p_livemode,p_origin);
end $$;
revoke execute on function public.solar_prepare_limited(uuid,text,text,jsonb,text,boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.solar_prepare_limited(uuid,text,text,jsonb,text,boolean,text,text,text) to service_role;
