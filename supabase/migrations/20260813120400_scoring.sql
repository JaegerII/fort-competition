-- FORT Competition — Scoring, Sync, Ergebnisse, Audit
-- Setzt docs/PHASE3_DATABASE_SCHEMA.md §5.5 um.
--
-- Zentrale Garantie (Spec §7): Ein Score darf nie stillschweigend
-- verschwinden oder überschrieben werden. score_events ist deshalb ein
-- reines Append-only-Log; der aktuell gültige Score ist eine FUNKTION über
-- das Log, kein geschriebenes Feld. Eine Korrektur ist ein NEUES Event, das
-- per corrects_event_id auf das alte zeigt — nie ein UPDATE.

create type score_event_type as enum (
  'score_entered',
  'score_corrected',
  'score_confirmed',
  'score_flagged'
);

create type score_confirmation_method as enum ('pin', 'signature', 'qr', 'button');
create type sync_status as enum ('uploaded', 'processed', 'conflict');
create type result_scope as enum ('overall', 'division', 'category', 'stage', 'squad');

-- ── Geräte ────────────────────────────────────────────────────────────
create table devices (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id) on delete cascade,
  official_id    uuid references officials (id) on delete set null,
  label          text not null,
  last_seen_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index devices_competition_idx on devices (competition_id);

-- ── Score-Events (append-only) ────────────────────────────────────────
create table score_events (
  -- CLIENT-generiertes UUID, nicht server-vergeben: Das Gerät schreibt
  -- offline und kann keine Server-ID kennen. Gleichzeitig macht es den
  -- Upload idempotent — ein doppelt gesendeter Batch kollidiert auf dem PK
  -- statt Duplikate anzulegen.
  id                uuid primary key,

  competition_id    uuid not null references competitions (id) on delete cascade,
  registration_id   uuid not null references registrations (id) on delete cascade,
  stage_id          uuid not null references stages (id) on delete cascade,
  device_id         uuid references devices (id) on delete set null,
  official_id       uuid references officials (id) on delete set null,

  event_type        score_event_type not null,

  -- Treffer pro Ziel, Zeit, sonstige Rohdaten der Erfassung.
  payload           jsonb not null default '{}'::jsonb,

  -- Zeigt VOM NEUEN Event auf das alte (nicht umgekehrt): Ein
  -- superseded_by-Feld auf dem Original wäre eine nachträgliche Mutation
  -- der alten Zeile — genau das soll ausgeschlossen sein.
  corrects_event_id uuid references score_events (id) on delete restrict,

  client_created_at timestamptz not null,
  server_received_at timestamptz not null default now(),
  sequence          bigserial not null
);

create index score_events_competition_idx on score_events (competition_id, sequence);
create index score_events_registration_idx on score_events (registration_id, stage_id);
create index score_events_corrects_idx on score_events (corrects_event_id)
  where corrects_event_id is not null;

comment on table score_events is
  'Append-only. UPDATE/DELETE sind per Trigger UND per REVOKE ausgeschlossen — siehe unten.';

-- Unveränderlichkeit hart erzwingen. Der Trigger ist die eigentliche
-- Garantie; das REVOKE in der RLS-Migration kommt zusätzlich dazu, damit
-- die Absicht beim Schema-Lesen sofort sichtbar ist (Phase-3-Doku §6.1).
create or replace function forbid_score_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'score_events ist append-only: % ist nicht erlaubt. Eine Korrektur wird als neues Event mit corrects_event_id angelegt.',
    tg_op
    using errcode = 'check_violation';
end;
$$;

create trigger score_events_no_update
  before update on score_events
  for each row
  execute function forbid_score_event_mutation();

create trigger score_events_no_delete
  before delete on score_events
  for each row
  execute function forbid_score_event_mutation();

-- Ein Korrektur-Event muss denselben Schützen und dieselbe Stage betreffen
-- wie das Event, das es korrigiert — sonst wäre der Log inkonsistent.
create or replace function validate_score_correction()
returns trigger
language plpgsql
as $$
declare
  corrected record;
begin
  if new.corrects_event_id is null then
    return new;
  end if;

  select registration_id, stage_id, competition_id
    into corrected
    from score_events
   where id = new.corrects_event_id;

  if not found then
    raise exception 'corrects_event_id % existiert nicht', new.corrects_event_id
      using errcode = 'foreign_key_violation';
  end if;

  if corrected.registration_id is distinct from new.registration_id
     or corrected.stage_id is distinct from new.stage_id
     or corrected.competition_id is distinct from new.competition_id then
    raise exception
      'Korrektur-Event muss dieselbe Registrierung/Stage/Competition betreffen wie das korrigierte Event'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger score_events_validate_correction
  before insert on score_events
  for each row
  execute function validate_score_correction();

-- ── Bestätigungen und Strafen ─────────────────────────────────────────
create table score_confirmations (
  id                          uuid primary key default gen_random_uuid(),
  score_event_id              uuid not null references score_events (id) on delete cascade,
  method                      score_confirmation_method not null,
  confirmed_by_registration_id uuid references registrations (id) on delete set null,
  signature_data              text,
  confirmed_at                timestamptz not null default now()
);

create index score_confirmations_event_idx on score_confirmations (score_event_id);

-- Normalisiert statt nur im payload-jsonb versteckt: die Penalty-Rate ist
-- eine der Analytics-Kennzahlen aus Spec §12 und muss direkt abfragbar sein.
create table penalties (
  id             uuid primary key default gen_random_uuid(),
  score_event_id uuid not null references score_events (id) on delete cascade,
  penalty_type   text not null,
  quantity       integer not null default 1,
  value          numeric(8,2) not null,
  constraint penalties_quantity_positive check (quantity > 0)
);

create index penalties_event_idx on penalties (score_event_id);

-- ── Sync-Beobachtbarkeit ──────────────────────────────────────────────
-- Bewusst getrennt vom fachlichen score_events-Log: hier geht es um den
-- Transportvorgang selbst (welcher Batch kam wann an, gab es Konflikte),
-- nicht um Wettkampfdaten.
create table sync_events (
  id          uuid primary key default gen_random_uuid(),
  device_id   uuid not null references devices (id) on delete cascade,
  batch_id    uuid not null,
  event_count integer not null default 0,
  status      sync_status not null default 'uploaded',
  received_at timestamptz not null default now()
);

create index sync_events_device_idx on sync_events (device_id, received_at desc);

-- ── Ergebnisse (Cache) ────────────────────────────────────────────────
create table results (
  id                 uuid primary key default gen_random_uuid(),
  competition_id     uuid not null references competitions (id) on delete cascade,
  scope              result_scope not null,
  -- Auf welche Division/Kategorie/Stage/Squad bezieht sich diese Wertung?
  -- NULL bei scope='overall'.
  scope_ref_id       uuid,
  registration_id    uuid not null references registrations (id) on delete cascade,
  rank               integer,
  points             numeric(10,4),
  percentage         numeric(6,3),
  hit_factor         numeric(8,4),
  -- Blockiert den Publish-Schritt, solange true (Phase-2-Erkenntnis).
  needs_review       boolean not null default false,
  ruleset_version_id uuid references ruleset_versions (id) on delete restrict,
  calculated_at      timestamptz not null default now(),

  unique (competition_id, scope, scope_ref_id, registration_id)
);

create index results_leaderboard_idx
  on results (competition_id, scope, scope_ref_id, rank);

comment on table results is
  'Reiner Cache — vollständig aus score_events + Ruleset neu berechenbar. Wird nur vom Recompute-Service geschrieben, nie durch Client-Writes.';

-- ── Audit-Log ─────────────────────────────────────────────────────────
create table audit_log (
  id               uuid primary key default gen_random_uuid(),
  actor_user_id    uuid references auth.users (id) on delete set null,
  actor_official_id uuid references officials (id) on delete set null,
  competition_id   uuid references competitions (id) on delete cascade,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  before           jsonb,
  after            jsonb,
  device_id        uuid references devices (id) on delete set null,
  created_at       timestamptz not null default now()
);

create index audit_log_competition_idx on audit_log (competition_id, created_at desc);
create index audit_log_entity_idx on audit_log (entity_type, entity_id);

comment on table audit_log is
  'Append-only, erfasst ALLE mutierenden Aktionen — nicht nur Scoring (Spec §10.1).';
