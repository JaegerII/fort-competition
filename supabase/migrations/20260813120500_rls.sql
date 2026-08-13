-- FORT Competition — Row Level Security
-- Setzt docs/PHASE3_DATABASE_SCHEMA.md §6 um.
--
-- Grundprinzip (Spec §10.2): DIE DATENBANK ist die Autorisierungsgrenze,
-- nicht die API. Jede Policy hier gilt unabhängig davon, welcher Client
-- schreibt — auch wenn jemand mit dem anon-Key direkt gegen PostgREST geht.

-- ══════════════════════════════════════════════════════════════════════
-- Hilfsfunktionen
-- ══════════════════════════════════════════════════════════════════════
-- SECURITY DEFINER, damit die Funktionen selbst nicht wieder durch RLS der
-- abgefragten Tabellen laufen (sonst Endlosrekursion: die
-- organization_members-Policy bräuchte is_org_member, das wiederum
-- organization_members liest).
-- search_path explizit gesetzt — ohne das wäre die Funktion anfällig für
-- Shadowing eigener Tabellen über einen manipulierten search_path.

create or replace function auth_org_role(target_org uuid)
returns organization_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
    from organization_members
   where organization_id = target_org
     and user_id = auth.uid()
   limit 1;
$$;

comment on function auth_org_role is
  'Rolle des aktuellen Users in der Organisation, oder NULL. SECURITY DEFINER, um RLS-Rekursion zu vermeiden.';

create or replace function is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth_org_role(target_org) in ('owner', 'admin');
$$;

-- Rolle des aktuellen Users als Official einer Competition.
create or replace function auth_official_role(target_competition uuid)
returns official_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
    from officials
   where competition_id = target_competition
     and user_id = auth.uid()
   limit 1;
$$;

-- Darf der aktuelle User dieses Match verwalten? Entweder als zugewiesener
-- Match Director/Admin, ODER als Org-Admin der veranstaltenden Organisation
-- (sonst könnte ein Club-Owner sein eigenes Match nicht mehr reparieren,
-- wenn der eingetragene MD ausfällt).
create or replace function can_manage_competition(target_competition uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce(auth_official_role(target_competition) in ('match_director', 'admin'), false)
    or exists (
      select 1
        from competitions c
       where c.id = target_competition
         and is_org_admin(c.organization_id)
    );
$$;

-- Gehört der User zum Match-Staff (beliebige Official-Rolle)?
create or replace function is_competition_staff(target_competition uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    auth_official_role(target_competition) is not null
    or can_manage_competition(target_competition);
$$;

-- Ist dieses Match öffentlich sichtbar? Kapselt die Bedingung, die in
-- mehreren Policies gebraucht wird (Match-Seite, Stages, Ergebnisse).
create or replace function is_competition_public(target_competition uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from competitions c
     where c.id = target_competition
       and c.visibility = 'public'
       and c.status <> 'draft'
  );
$$;

-- shooters.id des aktuellen Users (NULL, wenn kein Profil verknüpft ist).
create or replace function auth_shooter_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from shooters where user_id = auth.uid() limit 1;
$$;

-- ══════════════════════════════════════════════════════════════════════
-- RLS aktivieren
-- ══════════════════════════════════════════════════════════════════════
alter table organizations          enable row level security;
alter table organization_members   enable row level security;
alter table ranges                 enable row level security;
alter table shooters               enable row level security;
alter table shooter_stats          enable row level security;
alter table consent_records        enable row level security;
alter table gdpr_requests          enable row level security;
alter table disciplines            enable row level security;
alter table target_types           enable row level security;
alter table rulesets               enable row level security;
alter table ruleset_versions       enable row level security;
alter table competitions           enable row level security;
alter table divisions              enable row level security;
alter table categories             enable row level security;
alter table stages                 enable row level security;
alter table target_definitions     enable row level security;
alter table officials              enable row level security;
alter table registrations          enable row level security;
alter table registration_categories enable row level security;
alter table squads                 enable row level security;
alter table squad_members          enable row level security;
alter table payments               enable row level security;
alter table waitlist_promotions    enable row level security;
alter table devices                enable row level security;
alter table score_events           enable row level security;
alter table score_confirmations    enable row level security;
alter table penalties              enable row level security;
alter table sync_events            enable row level security;
alter table results                enable row level security;
alter table audit_log              enable row level security;

-- ══════════════════════════════════════════════════════════════════════
-- Referenzdaten: für alle lesbar, nur Service-Role schreibt
-- ══════════════════════════════════════════════════════════════════════
create policy disciplines_public_read on disciplines
  for select to anon, authenticated using (true);

create policy target_types_public_read on target_types
  for select to anon, authenticated using (true);

-- ══════════════════════════════════════════════════════════════════════
-- Organisationen & Ranges
-- ══════════════════════════════════════════════════════════════════════
-- Öffentlich lesbar: Discovery und Match-Seiten brauchen Club-/Range-Infos.
create policy organizations_public_read on organizations
  for select to anon, authenticated using (true);

create policy organizations_admin_write on organizations
  for update to authenticated using (is_org_admin(id)) with check (is_org_admin(id));

create policy ranges_public_read on ranges
  for select to anon, authenticated using (true);

create policy ranges_admin_write on ranges
  for all to authenticated
  using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id));

create policy organization_members_read on organization_members
  for select to authenticated
  using (user_id = auth.uid() or auth_org_role(organization_id) is not null);

create policy organization_members_admin_write on organization_members
  for all to authenticated
  using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id));

-- ══════════════════════════════════════════════════════════════════════
-- Schützen
-- ══════════════════════════════════════════════════════════════════════
-- Profile sind öffentlich (Spec §10: Ranglisten und Athletenprofile ohne
-- Login einsehbar). Sensible Felder liegen bewusst nicht in dieser Tabelle.
create policy shooters_public_read on shooters
  for select to anon, authenticated using (true);

-- Eigenes Profil bearbeiten …
create policy shooters_owner_update on shooters
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- … oder: der anlegende Club darf ein noch UNBEANSPRUCHTES Profil pflegen
-- (Walk-up/Import). Sobald claimed_at gesetzt ist, endet dieses Recht.
create policy shooters_org_manage_unclaimed on shooters
  for update to authenticated
  using (
    claimed_at is null
    and created_by_organization_id is not null
    and is_org_admin(created_by_organization_id)
  )
  with check (
    claimed_at is null
    and created_by_organization_id is not null
    and is_org_admin(created_by_organization_id)
  );

create policy shooters_self_insert on shooters
  for insert to authenticated with check (user_id = auth.uid());

create policy shooter_stats_public_read on shooter_stats
  for select to anon, authenticated using (true);

-- ══════════════════════════════════════════════════════════════════════
-- GDPR
-- ══════════════════════════════════════════════════════════════════════
create policy consent_records_own on consent_records
  for select to authenticated using (user_id = auth.uid());

create policy consent_records_insert_own on consent_records
  for insert to authenticated with check (user_id = auth.uid());

create policy gdpr_requests_own on gdpr_requests
  for select to authenticated using (user_id = auth.uid());

create policy gdpr_requests_insert_own on gdpr_requests
  for insert to authenticated with check (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════
-- Rulesets
-- ══════════════════════════════════════════════════════════════════════
-- Offizielle Rulesets (organization_id IS NULL) immer lesbar; Club-eigene
-- nur für Org-Mitglieder — bis eine Version veröffentlicht ist, dann
-- ebenfalls öffentlich (andere Clubs sollen veröffentlichte Custom-Rulesets
-- übernehmen können, Phase-3-Doku §6).
create policy rulesets_read on rulesets
  for select to anon, authenticated
  using (
    organization_id is null
    or auth_org_role(organization_id) is not null
    or exists (
      select 1 from ruleset_versions rv
       where rv.ruleset_id = rulesets.id
         and rv.status = 'published'
    )
  );

create policy rulesets_org_write on rulesets
  for all to authenticated
  using (organization_id is not null and is_org_admin(organization_id))
  with check (organization_id is not null and is_org_admin(organization_id));

create policy ruleset_versions_read on ruleset_versions
  for select to anon, authenticated
  using (
    status = 'published'
    or exists (
      select 1 from rulesets r
       where r.id = ruleset_versions.ruleset_id
         and (r.organization_id is null or auth_org_role(r.organization_id) is not null)
    )
  );

create policy ruleset_versions_org_write on ruleset_versions
  for all to authenticated
  using (
    exists (
      select 1 from rulesets r
       where r.id = ruleset_versions.ruleset_id
         and r.organization_id is not null
         and is_org_admin(r.organization_id)
    )
  )
  with check (
    exists (
      select 1 from rulesets r
       where r.id = ruleset_versions.ruleset_id
         and r.organization_id is not null
         and is_org_admin(r.organization_id)
    )
  );

-- ══════════════════════════════════════════════════════════════════════
-- Competitions und Konfiguration
-- ══════════════════════════════════════════════════════════════════════
create policy competitions_read on competitions
  for select to anon, authenticated
  using (
    (visibility = 'public' and status <> 'draft')
    or is_competition_staff(id)
    or is_org_admin(organization_id)
  );

create policy competitions_manager_insert on competitions
  for insert to authenticated
  with check (is_org_admin(organization_id));

create policy competitions_manager_update on competitions
  for update to authenticated
  using (can_manage_competition(id))
  with check (can_manage_competition(id));

-- divisions/categories/squads folgen der Sichtbarkeit des Matches.
create policy divisions_read on divisions
  for select to anon, authenticated
  using (is_competition_public(competition_id) or is_competition_staff(competition_id));

create policy divisions_manage on divisions
  for all to authenticated
  using (can_manage_competition(competition_id))
  with check (can_manage_competition(competition_id));

create policy categories_read on categories
  for select to anon, authenticated
  using (is_competition_public(competition_id) or is_competition_staff(competition_id));

create policy categories_manage on categories
  for all to authenticated
  using (can_manage_competition(competition_id))
  with check (can_manage_competition(competition_id));

-- Unveröffentlichte Stages sind vor dem Match NUR für Staff sichtbar —
-- sonst wären Stage-Designs vorab einsehbar (Wettbewerbsvorteil).
create policy stages_read on stages
  for select to anon, authenticated
  using (
    (published and is_competition_public(competition_id))
    or is_competition_staff(competition_id)
  );

create policy stages_manage on stages
  for all to authenticated
  using (can_manage_competition(competition_id))
  with check (can_manage_competition(competition_id));

create policy target_definitions_read on target_definitions
  for select to anon, authenticated
  using (
    exists (
      select 1 from stages s
       where s.id = target_definitions.stage_id
         and (
           (s.published and is_competition_public(s.competition_id))
           or is_competition_staff(s.competition_id)
         )
    )
  );

create policy target_definitions_manage on target_definitions
  for all to authenticated
  using (
    exists (
      select 1 from stages s
       where s.id = target_definitions.stage_id
         and can_manage_competition(s.competition_id)
    )
  )
  with check (
    exists (
      select 1 from stages s
       where s.id = target_definitions.stage_id
         and can_manage_competition(s.competition_id)
    )
  );

create policy officials_read on officials
  for select to authenticated
  using (user_id = auth.uid() or is_competition_staff(competition_id));

create policy officials_manage on officials
  for all to authenticated
  using (can_manage_competition(competition_id))
  with check (can_manage_competition(competition_id));

-- ══════════════════════════════════════════════════════════════════════
-- Registrierungen
-- ══════════════════════════════════════════════════════════════════════
create policy registrations_read on registrations
  for select to authenticated
  using (shooter_id = auth_shooter_id() or is_competition_staff(competition_id));

-- Athlet registriert sich selbst; Staff darf für andere eintragen (Walk-up).
create policy registrations_insert on registrations
  for insert to authenticated
  with check (shooter_id = auth_shooter_id() or can_manage_competition(competition_id));

create policy registrations_update on registrations
  for update to authenticated
  using (shooter_id = auth_shooter_id() or can_manage_competition(competition_id))
  with check (shooter_id = auth_shooter_id() or can_manage_competition(competition_id));

create policy registration_categories_read on registration_categories
  for select to authenticated
  using (
    exists (
      select 1 from registrations r
       where r.id = registration_categories.registration_id
         and (r.shooter_id = auth_shooter_id() or is_competition_staff(r.competition_id))
    )
  );

create policy registration_categories_write on registration_categories
  for all to authenticated
  using (
    exists (
      select 1 from registrations r
       where r.id = registration_categories.registration_id
         and (r.shooter_id = auth_shooter_id() or can_manage_competition(r.competition_id))
    )
  )
  with check (
    exists (
      select 1 from registrations r
       where r.id = registration_categories.registration_id
         and (r.shooter_id = auth_shooter_id() or can_manage_competition(r.competition_id))
    )
  );

create policy squads_read on squads
  for select to anon, authenticated
  using (is_competition_public(competition_id) or is_competition_staff(competition_id));

create policy squads_manage on squads
  for all to authenticated
  using (can_manage_competition(competition_id))
  with check (can_manage_competition(competition_id));

create policy squad_members_read on squad_members
  for select to authenticated
  using (
    exists (
      select 1 from registrations r
       where r.id = squad_members.registration_id
         and (r.shooter_id = auth_shooter_id() or is_competition_staff(r.competition_id))
    )
  );

create policy squad_members_write on squad_members
  for all to authenticated
  using (
    exists (
      select 1 from registrations r
       where r.id = squad_members.registration_id
         and (r.shooter_id = auth_shooter_id() or can_manage_competition(r.competition_id))
    )
  )
  with check (
    exists (
      select 1 from registrations r
       where r.id = squad_members.registration_id
         and (r.shooter_id = auth_shooter_id() or can_manage_competition(r.competition_id))
    )
  );

-- Zahlungen: lesbar für Betroffene und Match-Leitung, aber NIEMAND schreibt
-- vom Client aus. Es gibt bewusst KEINE insert/update-Policy — schreiben
-- kann nur die Service-Role (Stripe-Webhook), die RLS umgeht.
create policy payments_read on payments
  for select to authenticated
  using (
    exists (
      select 1 from registrations r
       where r.id = payments.registration_id
         and (r.shooter_id = auth_shooter_id() or can_manage_competition(r.competition_id))
    )
  );

create policy waitlist_promotions_read on waitlist_promotions
  for select to authenticated
  using (is_competition_staff(competition_id));

-- ══════════════════════════════════════════════════════════════════════
-- Scoring
-- ══════════════════════════════════════════════════════════════════════
create policy devices_read on devices
  for select to authenticated using (is_competition_staff(competition_id));

create policy devices_manage on devices
  for all to authenticated
  using (can_manage_competition(competition_id))
  with check (can_manage_competition(competition_id));

-- Athlet sieht die eigenen Score-Events, Staff alle des Matches.
create policy score_events_read on score_events
  for select to authenticated
  using (
    is_competition_staff(competition_id)
    or exists (
      select 1 from registrations r
       where r.id = score_events.registration_id
         and r.shooter_id = auth_shooter_id()
    )
  );

-- INSERT nur durch scoring-berechtigte Officials, und NUR für Squads, für
-- die sie zugewiesen sind (squad_scope). Ein RO einer anderen Squad kann
-- keine fremden Scores erfassen.
create policy score_events_official_insert on score_events
  for insert to authenticated
  with check (
    exists (
      select 1
        from officials o
       where o.competition_id = score_events.competition_id
         and o.user_id = auth.uid()
         and o.role in ('ro', 'cro', 'scorekeeper', 'match_director', 'admin')
         and (
           o.squad_scope is null
           or exists (
             select 1
               from squad_members sm
              where sm.registration_id = score_events.registration_id
                and sm.squad_id = any (o.squad_scope)
           )
         )
    )
  );

-- KEINE update/delete-Policy: In Postgres bedeutet das bereits "niemand
-- darf". Der zusätzliche REVOKE unten macht die Unveränderlichkeit beim
-- Schema-Lesen explizit sichtbar, statt sie aus einer fehlenden Policy
-- erschließen zu müssen (Phase-3-Doku §6.1).
revoke update, delete on score_events from anon, authenticated;

create policy score_confirmations_read on score_confirmations
  for select to authenticated
  using (
    exists (
      select 1 from score_events se
       where se.id = score_confirmations.score_event_id
         and (
           is_competition_staff(se.competition_id)
           or exists (
             select 1 from registrations r
              where r.id = se.registration_id and r.shooter_id = auth_shooter_id()
           )
         )
    )
  );

create policy score_confirmations_insert on score_confirmations
  for insert to authenticated
  with check (
    exists (
      select 1 from score_events se
       where se.id = score_confirmations.score_event_id
         and (
           is_competition_staff(se.competition_id)
           or exists (
             select 1 from registrations r
              where r.id = se.registration_id and r.shooter_id = auth_shooter_id()
           )
         )
    )
  );

create policy penalties_read on penalties
  for select to authenticated
  using (
    exists (
      select 1 from score_events se
       where se.id = penalties.score_event_id
         and (
           is_competition_staff(se.competition_id)
           or exists (
             select 1 from registrations r
              where r.id = se.registration_id and r.shooter_id = auth_shooter_id()
           )
         )
    )
  );

create policy penalties_insert on penalties
  for insert to authenticated
  with check (
    exists (
      select 1 from score_events se
       where se.id = penalties.score_event_id
         and is_competition_staff(se.competition_id)
    )
  );

create policy sync_events_read on sync_events
  for select to authenticated
  using (
    exists (
      select 1 from devices d
       where d.id = sync_events.device_id
         and is_competition_staff(d.competition_id)
    )
  );

-- ══════════════════════════════════════════════════════════════════════
-- Ergebnisse und Audit
-- ══════════════════════════════════════════════════════════════════════
-- Das ist die Live-Leaderboard-Anforderung: Ergebnisse sind öffentlich,
-- sobald das Match läuft oder abgeschlossen ist — ohne Login.
create policy results_public_read on results
  for select to anon, authenticated
  using (
    exists (
      select 1 from competitions c
       where c.id = results.competition_id
         and c.visibility = 'public'
         and c.status in ('in_progress', 'completed', 'archived')
    )
    or is_competition_staff(competition_id)
  );

-- Kein Client-Write auf results: nur der Recompute-Service (Service-Role).

create policy audit_log_read on audit_log
  for select to authenticated
  using (
    competition_id is not null and can_manage_competition(competition_id)
  );
