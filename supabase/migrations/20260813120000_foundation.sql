-- FORT Competition — Fundament: Identität, Organisation, Ranges
-- Setzt docs/PHASE3_DATABASE_SCHEMA.md §5.1 um.
--
-- ABWEICHUNG vom Phase-3-Entwurf, bewusst entschieden (dort §7, letzter
-- offener Punkt): Der Entwurf koppelte `athlete_profiles.id = auth.users.id`
-- hart 1:1. Das hätte strukturell verhindert, dass ein Schütze existiert,
-- ohne vorher ein Konto anzulegen — und damit drei Dinge unmöglich gemacht,
-- die für dieses Produkt zentral sind:
--   1. Import bestehender Ergebnisse (z. B. aus PractiScore-Exporten),
--   2. Walk-up-Anmeldung durch den Match Director am Matchtag,
--   3. "Profil beanspruchen" (ROADMAP_EXTENSIONS.md Punkt 4).
-- Deshalb: eigene `shooters`-Entität mit NULLABLE `user_id`. Ein Schütze ist
-- die fachliche Person; ein Account ist optional und kommt ggf. später dazu.
-- Dasselbe Muster nutzt der Entwurf bereits bei `officials.user_id`.

-- gen_random_uuid() ist ab PG13 in pgcrypto/core vorhanden; Supabase liefert
-- es mit. Explizit sicherstellen, damit die Migration auch auf blanken
-- Postgres-Instanzen läuft.
create extension if not exists pgcrypto;

-- ── Organisationen ────────────────────────────────────────────────────
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  country     text,
  description text,
  logo_url    text,
  created_at  timestamptz not null default now()
);

comment on table organizations is
  'Veranstaltende Clubs/Verbände. Besitzen Ranges, Competitions und ggf. eigene Rulesets.';

-- ── Schützen (fachliche Person, Account optional) ─────────────────────
create table shooters (
  id           uuid primary key default gen_random_uuid(),

  -- NULLABLE und UNIQUE: höchstens ein Account pro Schütze, aber ein
  -- Schütze kann dauerhaft ohne Account existieren (Import/Walk-up).
  -- ON DELETE SET NULL statt CASCADE: wird der Account gelöscht, bleibt die
  -- Wettkampfhistorie strukturell erhalten und wird nur entpersonalisiert —
  -- Ranglisten anderer Teilnehmer dürfen dadurch nicht korrumpiert werden
  -- (Phase-3-Doku §6.2).
  user_id      uuid unique references auth.users (id) on delete set null,

  display_name text not null,
  country      text,
  locale       text,
  avatar_url   text,

  -- Wer hat diesen Schützen angelegt, solange er keinen Account hat?
  -- Relevant für RLS: der anlegende Club darf ihn bearbeiten, bis er
  -- beansprucht wurde.
  created_by_organization_id uuid references organizations (id) on delete set null,
  claimed_at   timestamptz,

  created_at   timestamptz not null default now()
);

comment on table shooters is
  'Fachliche Person eines Schützen. user_id ist bewusst nullable: erlaubt importierte und Walk-up-Schützen ohne Konto.';
comment on column shooters.claimed_at is
  'Gesetzt, sobald ein echter Account dieses zuvor kontolose Profil übernommen hat.';

-- Nur ein Index auf user_id ist nötig (UNIQUE erzeugt ihn bereits);
-- Namenssuche braucht einen eigenen, weil die Athletensuche darüber geht.
create index shooters_display_name_idx on shooters (lower(display_name));

-- ── Abgeleitete Statistiken (Cache) ───────────────────────────────────
-- Bewusst eigene Tabelle statt Spalten auf `shooters`: der Phase-3-Entwurf
-- listet neun *cache*-Felder direkt auf dem Profil. Getrennt gehalten, weil
-- sie einen anderen Lebenszyklus haben — sie werden von einem Recompute-Job
-- geschrieben, nie vom Nutzer, und dürfen per RLS anders behandelt werden
-- als die Stammdaten. Verhindert außerdem, dass ein versehentliches
-- Profil-UPDATE Statistiken überschreibt.
create table shooter_stats (
  shooter_id     uuid primary key references shooters (id) on delete cascade,
  matches_count  integer not null default 0,
  stages_count   integer not null default 0,
  podiums_count  integer not null default 0,
  wins_count     integer not null default 0,
  avg_match_pct  numeric(5,2),
  avg_stage_pct  numeric(5,2),
  avg_hit_factor numeric(6,4),
  a_zone_pct     numeric(5,2),
  penalty_rate   numeric(5,2),
  dnf_rate       numeric(5,2),
  calculated_at  timestamptz not null default now()
);

comment on table shooter_stats is
  'Reiner Cache, vollständig aus score_events/results neu berechenbar. Wird nur vom Recompute-Service geschrieben (Service-Role), nie vom Client.';

-- ── Organisationsmitgliedschaft ───────────────────────────────────────
create type organization_role as enum ('owner', 'admin', 'member');

create table organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            organization_role not null default 'member',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_idx on organization_members (user_id);

-- ── Ranges ────────────────────────────────────────────────────────────
create table ranges (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name            text not null,
  address         text,
  gps_lat         numeric(9,6),
  gps_lng         numeric(9,6),
  timezone        text not null default 'Europe/Berlin',
  bays            integer,
  facilities      jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index ranges_organization_idx on ranges (organization_id);

-- ── GDPR: Einwilligungen und Anträge ──────────────────────────────────
create type consent_type as enum ('terms', 'privacy', 'marketing');
create type gdpr_request_type as enum ('export', 'delete');
create type gdpr_request_status as enum ('pending', 'processing', 'completed', 'rejected');

-- Append-only: Einwilligungen werden nie gelöscht oder geändert, eine
-- zurückgezogene Einwilligung ist ein NEUER Datensatz. Sonst wäre der
-- Nachweis, worin jemand wann eingewilligt hat, nicht führbar.
create table consent_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       consent_type not null,
  version    text not null,
  granted    boolean not null default true,
  granted_at timestamptz not null default now()
);

create index consent_records_user_idx on consent_records (user_id, type);

create table gdpr_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         gdpr_request_type not null,
  status       gdpr_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index gdpr_requests_user_idx on gdpr_requests (user_id);

comment on table gdpr_requests is
  'Macht GDPR-Selfservice auditierbar (Spec §16). Ein delete-Antrag triggert den Anonymisierungsprozess aus Phase-3-Doku §6.2, kein Hard-Delete der Historie.';
