-- FORT Competition — Registrierung, Squadding, Zahlung
-- Setzt docs/PHASE3_DATABASE_SCHEMA.md §5.4 um.

create type registration_status as enum (
  'pending_payment',
  'pending_approval',
  'waitlisted',
  'confirmed',
  'withdrawn',
  'no_show'
);

create type squad_member_status as enum ('confirmed', 'waitlisted');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type waitlist_trigger as enum ('withdrawal', 'manual', 'capacity_increase');

-- ── Registrierungen ───────────────────────────────────────────────────
create table registrations (
  id                uuid primary key default gen_random_uuid(),
  competition_id    uuid not null references competitions (id) on delete cascade,

  -- Zeigt auf `shooters`, NICHT auf auth.users: damit kann ein Match
  -- Director am Matchtag jemanden ohne Konto nachtragen und ein Import
  -- historische Teilnahmen anlegen (siehe Kommentar in 20260813120000).
  shooter_id        uuid not null references shooters (id) on delete cascade,

  division_id       uuid references divisions (id) on delete set null,
  status            registration_status not null default 'pending_payment',
  waitlist_position integer,
  registered_at     timestamptz not null default now(),

  -- Ein Schütze kann sich pro Match nur einmal registrieren.
  unique (competition_id, shooter_id)
);

create index registrations_competition_idx on registrations (competition_id, status);
create index registrations_shooter_idx on registrations (shooter_id);

comment on column registrations.status is
  'pending_payment und waitlisted wurden in Phase 2 als fehlende Zustände identifiziert — eine Registrierung ist nicht binär offen/bestätigt.';

-- ── Kategorien pro Registrierung (many-to-many) ───────────────────────
-- Join-Tabelle statt 1:N, weil Kategorien überlappen: Lady UND Senior
-- gleichzeitig ist gültig (Phase-3-Doku, Änderung 1 gegenüber Phase 1).
create table registration_categories (
  registration_id uuid not null references registrations (id) on delete cascade,
  category_id     uuid not null references categories (id) on delete cascade,
  primary key (registration_id, category_id)
);

-- ── Squads ────────────────────────────────────────────────────────────
create table squads (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  name            text not null,
  capacity        integer not null,
  scheduled_start timestamptz,
  range_bay       text,
  sort_order      integer not null default 0,
  constraint squads_capacity_positive check (capacity > 0),
  unique (competition_id, name)
);

create index squads_competition_idx on squads (competition_id);

create table squad_members (
  id              uuid primary key default gen_random_uuid(),
  squad_id        uuid not null references squads (id) on delete cascade,

  -- UNIQUE: ein Athlet ist pro Competition genau EINER Squad zugeordnet.
  -- Die Eindeutigkeit über registration_id erzwingt das automatisch, weil
  -- registrations selbst schon pro (competition, shooter) eindeutig ist.
  registration_id uuid not null unique references registrations (id) on delete cascade,

  -- Squad-EIGENE Warteliste, unabhängig von der Match-Warteliste in
  -- registrations.status (Phase-2-Erkenntnis): eine volle Squad bei
  -- offenem Match ist ein anderer Zustand als ein volles Match.
  status          squad_member_status not null default 'confirmed',
  joined_at       timestamptz not null default now()
);

create index squad_members_squad_idx on squad_members (squad_id, status);

-- ── Zahlungen ─────────────────────────────────────────────────────────
create table payments (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations (id) on delete cascade,
  amount          numeric(10,2) not null,
  currency        text not null default 'EUR',
  vat_amount      numeric(10,2),
  vat_rate        numeric(5,2),
  provider        text not null default 'stripe',
  provider_ref    text,
  status          payment_status not null default 'pending',
  created_at      timestamptz not null default now(),
  constraint payments_amount_non_negative check (amount >= 0)
);

create index payments_registration_idx on payments (registration_id);

comment on table payments is
  'Schreibzugriff ausschließlich über den serverseitigen Stripe-Webhook (Service-Role). Kein Client — auch kein Match Director — schreibt hier direkt hinein (RLS siehe eigene Migration).';

-- ── Warteliste-Nachrücken (Audit) ─────────────────────────────────────
create table waitlist_promotions (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid not null references competitions (id) on delete cascade,
  registration_id uuid not null references registrations (id) on delete cascade,
  from_status     registration_status not null,
  to_status       registration_status not null,
  triggered_by    waitlist_trigger not null,
  promoted_at     timestamptz not null default now()
);

create index waitlist_promotions_competition_idx on waitlist_promotions (competition_id, promoted_at desc);

comment on table waitlist_promotions is
  'Audit-Trail für automatisches Nachrücken (Phase-2-Erkenntnis) — sonst wäre nicht nachvollziehbar, warum jemand plötzlich einen Platz hat.';
