-- Payment/work creation and alert enqueue share one transaction. SMTP delivery
-- is retryable; it is not part of the financial transaction.
create table public.solar_alerts (
 application_id uuid primary key references public.solar_work_items(application_id),
 created_at timestamptz not null default now(),
 state text not null default 'pending' check(state in ('pending','sending','sent')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 lease_token uuid,
 lease_until timestamptz,
 sent_at timestamptz,
 last_error text check(last_error in ('delivery_failed','delivery_uncertain')),
 check((state='sent')=(sent_at is not null))
);
create index solar_alerts_due on public.solar_alerts(next_attempt_at) where state <> 'sent';
alter table public.solar_alerts enable row level security;
revoke all on public.solar_alerts from public,anon,authenticated;
grant all on public.solar_alerts to service_role;

create function public.solar_enqueue_alert() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 insert into public.solar_alerts(application_id) values(new.application_id) on conflict do nothing;
 return new;
end $$;
revoke execute on function public.solar_enqueue_alert() from public,anon,authenticated;
grant execute on function public.solar_enqueue_alert() to service_role;
create trigger solar_paid_work_alert after insert on public.solar_work_items
 for each row execute function public.solar_enqueue_alert();

create function public.solar_claim_alert(p_livemode boolean,p_id uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare chosen uuid; token uuid:=gen_random_uuid(); result jsonb;
begin
 select n.application_id into chosen from public.solar_alerts n
 join public.solar_applications a on a.id=n.application_id
 where a.status='paid' and a.livemode=p_livemode and n.state<>'sent'
 and n.next_attempt_at<=now() and (n.lease_until is null or n.lease_until<now())
 and (p_id is null or n.application_id=p_id)
 order by n.next_attempt_at,n.application_id for update of n skip locked limit 1;
 if chosen is null then return null; end if;
 update public.solar_alerts set state='sending',lease_token=token,
 lease_until=now()+interval '5 minutes',attempts=attempts+1 where application_id=chosen;
 select jsonb_build_object('application_id',a.id,'lease_token',token,'livemode',a.livemode,
 'amount_pence',a.amount_pence,'paid_at',a.paid_at,'details',a.details) into result
 from public.solar_applications a where a.id=chosen;
 return result;
end $$;
create function public.solar_finish_alert(p_id uuid,p_token uuid,p_sent boolean,p_uncertain boolean default false)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.solar_alerts set state=case when p_sent then 'sent' else 'pending' end,
 sent_at=case when p_sent then now() else null end,
 next_attempt_at=now()+make_interval(secs=>least(21600,60*power(2,least(attempts,8)))::integer),
 last_error=case when p_sent then null when p_uncertain then 'delivery_uncertain' else 'delivery_failed' end,
 lease_token=null,lease_until=null
 where application_id=p_id and lease_token=p_token and state='sending';
 return found;
end $$;
revoke execute on function public.solar_claim_alert(boolean,uuid),public.solar_finish_alert(uuid,uuid,boolean,boolean) from public,anon,authenticated;
grant execute on function public.solar_claim_alert(boolean,uuid),public.solar_finish_alert(uuid,uuid,boolean,boolean) to service_role;

-- Durable cursor prevents an old unresolved checkout from starving newer ones.
create table public.solar_operations (
 name text primary key,
 cursor jsonb,
 cutoff timestamptz,
 lease_token uuid,
 lease_until timestamptz,
 last_success_at timestamptz
);
alter table public.solar_operations enable row level security;
revoke all on public.solar_operations from public,anon,authenticated;
grant all on public.solar_operations to service_role;
create function public.solar_claim_operation(p_name text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result public.solar_operations;
begin
 if p_name not in ('recovery-live','recovery-test','backup') then raise exception 'invalid operation' using errcode='22023'; end if;
 insert into public.solar_operations(name) values(p_name) on conflict do nothing;
 update public.solar_operations set lease_token=gen_random_uuid(),lease_until=now()+interval '6 minutes',cutoff=coalesce(cutoff,now())
 where name=p_name and (lease_until is null or lease_until<now()) returning * into result;
 return to_jsonb(result);
end $$;
create function public.solar_finish_operation(p_name text,p_token uuid,p_cursor jsonb,p_complete boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.solar_operations set cursor=p_cursor,cutoff=case when p_complete then null else cutoff end,
 last_success_at=now(),lease_token=null,lease_until=null where name=p_name and lease_token=p_token;
 return found;
end $$;
revoke execute on function public.solar_claim_operation(text),public.solar_finish_operation(text,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.solar_claim_operation(text),public.solar_finish_operation(text,uuid,jsonb,boolean) to service_role;
