-- Turnout database schema (v1)
-- Paste this whole file into Supabase → SQL Editor → Run.

create extension if not exists pgcrypto;

-- 1. EVENTS: one row per event a host creates
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,             -- the link: turnout.in/e/<slug>
  host_id      uuid not null references auth.users(id) on delete cascade,
  host_name    text not null,
  title        text not null,
  description  text,
  venue        text not null,
  starts_at    timestamptz not null,
  capacity     int not null check (capacity > 0),
  created_at   timestamptz not null default now()
);

-- 2. RSVPS: one row per person who signs up
create table if not exists rsvps (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references events(id) on delete cascade,
  name           text not null,
  email          text not null,
  phone          text,
  status         text not null check (status in ('confirmed','waitlisted','cancelled','checked_in')),
  ticket_code    text unique not null default encode(gen_random_bytes(9), 'hex'),
  created_at     timestamptz not null default now(),
  checked_in_at  timestamptz,
  unique (event_id, email)
);

create index if not exists rsvps_event_status on rsvps(event_id, status, created_at);

-- SECURITY (Row Level Security): who can read/write what
alter table events enable row level security;
alter table rsvps  enable row level security;

drop policy if exists "anyone can view events" on events;
create policy "anyone can view events" on events for select using (true);

drop policy if exists "hosts create own events" on events;
create policy "hosts create own events" on events for insert with check (auth.uid() = host_id);

drop policy if exists "hosts edit own events" on events;
create policy "hosts edit own events" on events for update using (auth.uid() = host_id);

drop policy if exists "hosts see own attendees" on rsvps;
create policy "hosts see own attendees" on rsvps for select
  using (exists (select 1 from events e where e.id = rsvps.event_id and e.host_id = auth.uid()));
-- Attendees never touch the rsvps table directly; they go through the functions below.

-- How many seats are taken (confirmed + checked in)
create or replace function seats_taken(p_event uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from rsvps where event_id = p_event and status in ('confirmed','checked_in');
$$;

-- RSVP: confirmed if seats left, otherwise waitlisted
create or replace function rsvp(p_event uuid, p_name text, p_email text, p_phone text)
returns table (ticket_code text, status text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_cap int; v_existing rsvps%rowtype; v_status text;
begin
  select capacity into v_cap from events where id = p_event for update;  -- lock: no double-booking
  if v_cap is null then raise exception 'Event not found'; end if;

  select * into v_existing from rsvps r where r.event_id = p_event and lower(r.email) = lower(trim(p_email));
  if found and v_existing.status <> 'cancelled' then
    return query select v_existing.ticket_code, v_existing.status; return;
  end if;

  v_status := case when seats_taken(p_event) < v_cap then 'confirmed' else 'waitlisted' end;

  if found then
    update rsvps set status = v_status, name = trim(p_name), phone = p_phone, created_at = now()
      where id = v_existing.id;
    return query select v_existing.ticket_code, v_status; return;
  end if;

  return query
    insert into rsvps (event_id, name, email, phone, status)
    values (p_event, trim(p_name), lower(trim(p_email)), p_phone, v_status)
    returning rsvps.ticket_code, rsvps.status;
end $$;

-- Ticket lookup (attendee opens their ticket link)
create or replace function get_ticket(p_code text)
returns table (name text, status text, ticket_code text, event_slug text, event_title text,
               venue text, starts_at timestamptz, waitlist_position int)
language sql stable security definer set search_path = public as $$
  select r.name, r.status, r.ticket_code, e.slug, e.title, e.venue, e.starts_at,
    case when r.status = 'waitlisted' then
      (select count(*)::int from rsvps w where w.event_id = r.event_id and w.status = 'waitlisted'
         and w.created_at <= r.created_at) end
  from rsvps r join events e on e.id = r.event_id
  where r.ticket_code = p_code;
$$;

-- Cancel: frees the seat and AUTOMATICALLY promotes the first person on the waitlist
create or replace function cancel_rsvp(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare v_event uuid; v_status text; v_cap int;
begin
  select event_id, status into v_event, v_status from rsvps where ticket_code = p_code;
  if v_event is null then raise exception 'Ticket not found'; end if;
  if v_status in ('cancelled','checked_in') then return v_status; end if;

  select capacity into v_cap from events where id = v_event for update;
  update rsvps set status = 'cancelled' where ticket_code = p_code;

  if v_status = 'confirmed' and seats_taken(v_event) < v_cap then
    update rsvps set status = 'confirmed'
      where id = (select id from rsvps where event_id = v_event and status = 'waitlisted'
                  order by created_at limit 1);
  end if;
  return 'cancelled';
end $$;

-- Check-in: only the event's host can do this (when they scan the QR)
create or replace function check_in(p_code text)
returns table (name text, status text, already boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare v_r rsvps%rowtype; v_host uuid;
begin
  select * into v_r from rsvps where ticket_code = p_code;
  if not found then raise exception 'Ticket not found'; end if;
  select host_id into v_host from events where id = v_r.event_id;
  if v_host is distinct from auth.uid() then raise exception 'Only the host can check people in'; end if;

  if v_r.status = 'checked_in' then
    return query select v_r.name, v_r.status, true; return;
  end if;
  if v_r.status <> 'confirmed' then
    return query select v_r.name, v_r.status, false; return;
  end if;
  update rsvps set status = 'checked_in', checked_in_at = now() where id = v_r.id;
  return query select v_r.name, 'checked_in'::text, false;
end $$;

revoke all on function rsvp(uuid,text,text,text), get_ticket(text), cancel_rsvp(text), check_in(text), seats_taken(uuid) from public;
grant execute on function rsvp(uuid,text,text,text), get_ticket(text), cancel_rsvp(text), seats_taken(uuid) to anon, authenticated;
grant execute on function check_in(text) to authenticated;
