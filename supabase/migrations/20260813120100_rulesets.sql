-- FORT Competition — Regelwerk (Rules Engine)
-- Setzt docs/PHASE3_DATABASE_SCHEMA.md §5.2 um.
--
-- Kernidee (Spec §7.2/§7.3): Offizielle Rulesets (IPSC) und Club-eigene
-- Custom-Rulesets liegen in DERSELBEN Tabelle, unterschieden nur durch
-- `organization_id IS NULL`. Kein Sonderpfad, kein zweites Schema — der
-- Custom Match Builder erzeugt exakt dieselbe Struktur wie ein offizielles
-- Regelwerk.

create type ruleset_scoring_type as enum (
  'hit_factor',   -- IPSC Comstock: Punkte / Zeit
  'time_plus',    -- Zeit + Strafsekunden (z. B. Steel Challenge)
  'points_only',  -- reine Punktwertung ohne Zeit
  'custom'
);

create type ruleset_version_status as enum ('draft', 'published', 'deprecated');

-- ── Disziplinen ───────────────────────────────────────────────────────
create table disciplines (
  id   uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

comment on table disciplines is
  'Referenzdaten, z. B. ipsc_handgun, ipsc_pcc, custom.';

-- ── Zieltypen ─────────────────────────────────────────────────────────
-- Eigene Referenztabelle statt pro Ruleset dupliziert: dasselbe
-- IPSC-Metric-Target wird von Handgun UND PCC verwendet.
create table target_types (
  id    uuid primary key default gen_random_uuid(),
  code  text not null unique,
  name  text not null,
  -- zones beschreibt die Trefferzonen und ihre Punktwerte je Power Factor,
  -- z. B. {"A": {"major": 5, "minor": 5}, "C": {"major": 4, "minor": 3}, ...}
  zones jsonb not null
);

-- ── Rulesets ──────────────────────────────────────────────────────────
create table rulesets (
  id              uuid primary key default gen_random_uuid(),
  discipline_id   uuid not null references disciplines (id) on delete restrict,
  -- NULL = offizielles/globales Ruleset; gesetzt = Club-eigenes Ruleset
  organization_id uuid references organizations (id) on delete cascade,
  name            text not null,
  scoring_type    ruleset_scoring_type not null,
  created_at      timestamptz not null default now()
);

create index rulesets_discipline_idx on rulesets (discipline_id);
create index rulesets_organization_idx on rulesets (organization_id);

-- ── Ruleset-Versionen ─────────────────────────────────────────────────
create table ruleset_versions (
  id           uuid primary key default gen_random_uuid(),
  ruleset_id   uuid not null references rulesets (id) on delete cascade,
  version      text not null,
  status       ruleset_version_status not null default 'draft',
  -- definition enthält Divisionen, Kategorien, Target-Typen, Strafen,
  -- Validierungsregeln und Kalkulator-Konfiguration. Das exakte Format
  -- validiert Phase 4 per Zod-Schema (Phase-3-Doku §7).
  definition   jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (ruleset_id, version)
);

create index ruleset_versions_ruleset_idx on ruleset_versions (ruleset_id, status);

comment on table ruleset_versions is
  'Versionierte Regelwerk-Definition. Eine veröffentlichte Version ist unveränderlich (siehe Trigger unten) — historische Matches müssen exakt nachrechenbar bleiben.';

-- ── Unveränderlichkeit veröffentlichter Versionen ─────────────────────
-- Der Phase-3-Entwurf verlangt das ausdrücklich als DB-Trigger, nicht nur
-- als RLS-Policy: sobald status='published', darf `definition` nie wieder
-- geändert werden. Sonst würde sich das Ergebnis eines vergangenen Matches
-- rückwirkend ändern können — genau das, was Spec §7.2 ausschließt.
create or replace function forbid_published_ruleset_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' then
    if new.definition is distinct from old.definition then
      raise exception
        'ruleset_versions.definition ist nach dem Publish unveränderlich (Version %, Ruleset %)',
        old.version, old.ruleset_id
        using errcode = 'check_violation';
    end if;

    -- Erlaubter Statusübergang nach published ist ausschließlich deprecated.
    if new.status not in ('published', 'deprecated') then
      raise exception
        'Ungültiger Statusübergang % -> % für ruleset_versions',
        old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger ruleset_versions_immutable_after_publish
  before update on ruleset_versions
  for each row
  execute function forbid_published_ruleset_mutation();

-- published_at automatisch setzen, damit es nicht vom Client kommen muss
create or replace function set_ruleset_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger ruleset_versions_set_published_at
  before update on ruleset_versions
  for each row
  execute function set_ruleset_published_at();
