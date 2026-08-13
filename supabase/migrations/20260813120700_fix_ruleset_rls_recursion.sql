-- Behebt eine Endlosrekursion zwischen den RLS-Policies von `rulesets` und
-- `ruleset_versions` (Postgres-Fehler 42P17).
--
-- Der Zyklus in 20260813120500_rls.sql:
--   rulesets_read          liest ruleset_versions (gibt es eine published?)
--   ruleset_versions_read  liest rulesets          (ist das Ruleset sichtbar?)
-- Jede Policy löst beim Prüfen die jeweils andere aus. Postgres bricht das
-- mit "infinite recursion detected in policy for relation rulesets" ab —
-- und zwar erst zur ABFRAGEZEIT, nicht beim Anlegen. Deshalb sind die
-- Migrations sauber durchgelaufen und der Fehler fiel erst auf, als die App
-- die erste echte Query gegen die Discovery-Seite gestellt hat.
--
-- Lösung: dieselbe Technik wie bei den Organisations-Hilfsfunktionen —
-- SECURITY DEFINER umgeht RLS der gelesenen Tabelle und durchbricht damit
-- den Zyklus. Die fachliche Regel bleibt unverändert.

create or replace function ruleset_has_published_version(target_ruleset uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from ruleset_versions
     where ruleset_id = target_ruleset
       and status = 'published'
  );
$$;

comment on function ruleset_has_published_version is
  'Liest ruleset_versions unter Umgehung von RLS. Nötig, damit die rulesets-Policy nicht die ruleset_versions-Policy auslöst (und umgekehrt).';

create or replace function ruleset_is_visible_to_caller(target_ruleset uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from rulesets r
     where r.id = target_ruleset
       and (r.organization_id is null or auth_org_role(r.organization_id) is not null)
  );
$$;

-- Policies neu aufsetzen, jetzt zyklusfrei.
drop policy if exists rulesets_read on rulesets;
create policy rulesets_read on rulesets
  for select to anon, authenticated
  using (
    organization_id is null
    or auth_org_role(organization_id) is not null
    or ruleset_has_published_version(id)
  );

drop policy if exists ruleset_versions_read on ruleset_versions;
create policy ruleset_versions_read on ruleset_versions
  for select to anon, authenticated
  using (
    status = 'published'
    or ruleset_is_visible_to_caller(ruleset_id)
  );
