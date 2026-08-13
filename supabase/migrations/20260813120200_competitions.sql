-- FORT Competition — Match-Konfiguration
-- Setzt docs/PHASE3_DATABASE_SCHEMA.md §5.3 um.

create type competition_status as enum (
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'archived'
);

create type competition_visibility as enum ('public', 'unlisted', 'private');

create type official_role as enum (
  'match_director',
  'range_master',
  'cro',
  'ro',
  'scorekeeper',
  'stats_officer',
  'admin'
);

-- ── Competitions ──────────────────────────────────────────────────────
create table competitions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references organizations (id) on delete cascade,
  range_id            uuid references ranges (id) on delete set null,

  -- Wird beim Publish fixiert und danach NIE geändert (Spec §7.2):
  -- historische Matches behalten ihre Ruleset-Version, damit ihre
  -- Ergebnisse exakt nachrechenbar bleiben. RESTRICT statt CASCADE, damit
  -- eine noch referenzierte Ruleset-Version nicht wegfallen kann.
  ruleset_version_id  uuid references ruleset_versions (id) on delete restrict,

  name                text not null,
  slug                text not null unique,
  level               text,
  description         text,
  starts_at           timestamptz,
  ends_at             timestamptz,
  timezone            text not null default 'Europe/Berlin',
  status              competition_status not null default 'draft',
  visibility          competition_visibility not null default 'public',
  currency            text not null default 'EUR',
  registration_fee    numeric(10,2),
  registration_opens_at  timestamptz,
  registration_closes_at timestamptz,
  capacity            integer,
  created_at          timestamptz not null default now(),

  -- Datums-Invarianten, die im Prototyp bisher nur als UI-Warnung existierten
  -- (manage/new: "Enddatum liegt vor dem Startdatum"). Auf DB-Ebene sind sie
  -- verlässlich, egal welcher Client schreibt.
  constraint competitions_dates_ordered
    check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint competitions_registration_window_ordered
    check (
      registration_closes_at is null
      or registration_opens_at is null
      or registration_closes_at >= registration_opens_at
    ),
  constraint competitions_capacity_positive
    check (capacity is null or capacity > 0),
  constraint competitions_fee_non_negative
    check (registration_fee is null or registration_fee >= 0)
);

create index competitions_organization_idx on competitions (organization_id);
create index competitions_status_idx on competitions (status, starts_at desc);

comment on column competitions.slug is
  'URL-Segment für /matches/[slug]. Unique, weil die öffentliche Match-URL darüber aufgelöst wird.';

-- ── Divisionen & Kategorien ───────────────────────────────────────────
-- Beide sind PRO COMPETITION, weil ein MD die im Ruleset verfügbaren
-- Divisionen für sein Match einschränken darf.
create table divisions (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  code           text not null,
  name           text not null,
  config         jsonb not null default '{}'::jsonb,
  sort_order     integer not null default 0,
  unique (competition_id, code)
);

create table categories (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  code           text not null,
  name           text not null,
  sort_order     integer not null default 0,
  unique (competition_id, code)
);

comment on table categories is
  'Überlappend, nicht exklusiv — ein Schütze kann gleichzeitig Lady und Senior sein. Zuordnung daher über die Join-Tabelle registration_categories.';

-- ── Stages & Ziele ────────────────────────────────────────────────────
create table stages (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  number         integer not null,
  name           text not null,
  description    text,
  max_points     integer,
  par_time       numeric(6,2),
  -- Unveröffentlichte Stages sind vor dem Match nur für Staff sichtbar
  -- (verhindert Stage-Design-Leaks, Phase-3-Doku §6).
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (competition_id, number)
);

create index stages_competition_idx on stages (competition_id);

create table target_definitions (
  id             uuid primary key default gen_random_uuid(),
  stage_id       uuid not null references stages (id) on delete cascade,
  label          text not null,
  target_type_id uuid not null references target_types (id) on delete restrict,
  required_hits  integer not null default 2,
  sort_order     integer not null default 0,
  constraint target_definitions_required_hits_positive check (required_hits > 0),
  unique (stage_id, label)
);

-- ── Officials ─────────────────────────────────────────────────────────
create table officials (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,

  -- NULLABLE: tagesbasierte RO-Anmeldung ohne volles Konto (Spec §2.4).
  -- Genau dasselbe Muster wie shooters.user_id.
  user_id        uuid references auth.users (id) on delete set null,
  device_scoped_code_hash text,

  display_name   text not null,
  role           official_role not null,

  -- Auf welche Squads ist dieser Official beschränkt? NULL = keine
  -- Einschränkung. Wird von der score_events-RLS-Policy ausgewertet.
  squad_scope    uuid[],

  created_at     timestamptz not null default now(),

  -- Entweder echter Account ODER Gerätecode — nie beides leer, sonst wäre
  -- der Official nicht authentifizierbar.
  constraint officials_identifiable
    check (user_id is not null or device_scoped_code_hash is not null)
);

create index officials_competition_idx on officials (competition_id);
create index officials_user_idx on officials (user_id);
