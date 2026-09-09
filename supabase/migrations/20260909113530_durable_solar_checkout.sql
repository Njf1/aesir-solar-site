-- Server-only intake. A Checkout redirect is never proof of payment.
create table public.solar_applications (
 id uuid primary key,
 token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
 payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
 details jsonb not null check (jsonb_typeof(details) = 'object'),
 policy_version text not null,
 livemode boolean not null,
 checkout_origin text not null,
 created_at timestamptz not null default now(),
 session_id text unique,
 payment_intent_id text unique,
 paid_at timestamptz,
 status text not null default 'saved' check (status in ('saved','awaiting_payment','expired','paid')),
 amount_pence integer not null default 30000 check(amount_pence = 30000),
 currency text not null default 'gbp' check(currency = 'gbp'),
 check ((status = 'paid') = (paid_at is not null))
);
create index solar_unpaid_created on public.solar_applications(created_at) where status in ('saved','awaiting_payment');
create table public.solar_work_items (
 application_id uuid primary key references public.solar_applications(id),
 created_at timestamptz not null default now(),
 status text not null default 'ready' check(status in ('ready','in_progress','awaiting_applicant','submitted','completed')),
 assigned_to text,
 operator_notes text not null default ''
);
create table public.solar_payment_events (
 event_id text primary key,
 application_id uuid not null references public.solar_applications(id),
 session_id text not null,
 received_at timestamptz not null default now()
);
create index solar_payment_events_application on public.solar_payment_events(application_id);
alter table public.solar_applications enable row level security;
alter table public.solar_work_items enable row level security;
alter table public.solar_payment_events enable row level security;
revoke all on public.solar_applications, public.solar_work_items, public.solar_payment_events from public, anon, authenticated;
grant select, insert, update, delete on public.solar_applications, public.solar_work_items, public.solar_payment_events to service_role;
create policy service_only on public.solar_applications to service_role using(true) with check(true);
create policy service_only on public.solar_work_items to service_role using(true) with check(true);
create policy service_only on public.solar_payment_events to service_role using(true) with check(true);

create function public.solar_prepare(p_id uuid, p_token_hash text, p_payload_hash text,
 p_details jsonb, p_policy_version text, p_livemode boolean, p_origin text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a public.solar_applications;
begin
 insert into public.solar_applications(id,token_hash,payload_hash,details,policy_version,livemode,checkout_origin)
 values(p_id,p_token_hash,p_payload_hash,p_details,p_policy_version,p_livemode,p_origin)
 on conflict(id) do nothing;
 select * into strict a from public.solar_applications where id=p_id for update;
 if a.token_hash <> p_token_hash or a.payload_hash <> p_payload_hash or a.livemode <> p_livemode then
  raise exception 'application_conflict' using errcode='22023';
 end if;
 return to_jsonb(a);
end $$;

create function public.solar_bind(p_id uuid, p_session_id text, p_livemode boolean)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a public.solar_applications;
begin
 select * into strict a from public.solar_applications where id=p_id for update;
 if a.livemode <> p_livemode or (a.session_id is not null and a.session_id <> p_session_id) then
  raise exception 'session_conflict' using errcode='22023';
 end if;
 update public.solar_applications set session_id=p_session_id,
 status=case when status='saved' then 'awaiting_payment' else status end where id=p_id returning * into a;
 return to_jsonb(a);
end $$;

-- One transaction locks intake, binds the verified payment and creates exactly
-- one job. No user input or unsigned webhook can call this function directly.
create function public.solar_record_payment(p_id uuid, p_session_id text, p_payment_intent_id text,
 p_livemode boolean, p_amount integer, p_currency text, p_event_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare a public.solar_applications;
begin
 select * into strict a from public.solar_applications where id=p_id for update;
 if a.livemode <> p_livemode or p_amount <> a.amount_pence or p_currency <> a.currency
 or (a.session_id is not null and a.session_id <> p_session_id)
 or (a.payment_intent_id is not null and a.payment_intent_id <> p_payment_intent_id)
 or p_session_id !~ '^cs_' or p_payment_intent_id !~ '^pi_' then
  raise exception 'payment_mismatch' using errcode='22023';
 end if;
 update public.solar_applications set session_id=p_session_id, payment_intent_id=p_payment_intent_id,
 status='paid', paid_at=coalesce(paid_at,now()) where id=p_id returning * into a;
 insert into public.solar_work_items(application_id) values(p_id) on conflict(application_id) do nothing;
 insert into public.solar_payment_events(event_id,application_id,session_id)
 values(p_event_id,p_id,p_session_id) on conflict(event_id) do nothing;
 if exists(select 1 from public.solar_payment_events where event_id=p_event_id and (application_id<>p_id or session_id<>p_session_id)) then
  raise exception 'event_conflict' using errcode='22023';
 end if;
 return jsonb_build_object('id',a.id,'status',a.status,'paid_at',a.paid_at);
end $$;

create view public.solar_operator_queue with (security_invoker=true) as
 select w.application_id, w.status as work_status, w.assigned_to, w.operator_notes,
 a.livemode, a.paid_at, a.amount_pence, a.currency, a.session_id, a.payment_intent_id,
 a.details, a.policy_version, a.created_at as submitted_at
 from public.solar_work_items w join public.solar_applications a on a.id=w.application_id;
revoke all on public.solar_operator_queue from public,anon,authenticated;
grant select on public.solar_operator_queue to service_role;
revoke execute on function public.solar_prepare(uuid,text,text,jsonb,text,boolean,text),
 public.solar_bind(uuid,text,boolean), public.solar_record_payment(uuid,text,text,boolean,integer,text,text)
 from public,anon,authenticated;
grant execute on function public.solar_prepare(uuid,text,text,jsonb,text,boolean,text),
 public.solar_bind(uuid,text,boolean), public.solar_record_payment(uuid,text,text,boolean,integer,text,text)
 to service_role;
