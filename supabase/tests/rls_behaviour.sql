-- Prüft das RLS-VERHALTEN als eingeschränkte Rolle (anon).
-- Zwei Fehlerklassen, die nur hier auffallen:
--   1. Endlosrekursion in den Policy-Hilfsfunktionen (Query hängt/knallt),
--   2. Policies, die zu viel oder zu wenig durchlassen.

\set ON_ERROR_STOP on
\pset pager off

begin;

insert into organizations (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Testclub');

-- Ein öffentliches, laufendes Match …
insert into competitions (id, organization_id, name, slug, status, visibility)
values ('66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        'Öffentliches Match', 'oeffentlich', 'in_progress', 'public');

-- … und eines, das noch im Entwurf steckt und NICHT sichtbar sein darf.
insert into competitions (id, organization_id, name, slug, status, visibility)
values ('77777777-7777-7777-7777-777777777777',
        '11111111-1111-1111-1111-111111111111',
        'Geheimer Entwurf', 'entwurf', 'draft', 'public');

-- Ein privates Match — ebenfalls unsichtbar für Fremde.
insert into competitions (id, organization_id, name, slug, status, visibility)
values ('88888888-8888-8888-8888-888888888888',
        '11111111-1111-1111-1111-111111111111',
        'Privates Match', 'privat', 'in_progress', 'private');

-- Stages: eine veröffentlicht, eine nicht (Stage-Design-Leak-Schutz)
insert into stages (competition_id, number, name, published)
values ('66666666-6666-6666-6666-666666666666', 1, 'Sichtbare Stage', true),
       ('66666666-6666-6666-6666-666666666666', 2, 'Unveröffentlichte Stage', false);

-- ── Ab hier als anon (nicht eingeloggter Besucher) ────────────────────
set local role anon;

select 'anon sieht öffentliches laufendes Match' as test,
       case when exists (
         select 1 from competitions where id = '66666666-6666-6666-6666-666666666666'
       ) then 'PASS' else 'FAIL' end as ergebnis;

select 'anon sieht KEINEN Entwurf' as test,
       case when not exists (
         select 1 from competitions where id = '77777777-7777-7777-7777-777777777777'
       ) then 'PASS' else 'FAIL' end as ergebnis;

select 'anon sieht KEIN privates Match' as test,
       case when not exists (
         select 1 from competitions where id = '88888888-8888-8888-8888-888888888888'
       ) then 'PASS' else 'FAIL' end as ergebnis;

select 'anon sieht veröffentlichte Stage' as test,
       case when exists (
         select 1 from stages where name = 'Sichtbare Stage'
       ) then 'PASS' else 'FAIL' end as ergebnis;

select 'anon sieht KEINE unveröffentlichte Stage' as test,
       case when not exists (
         select 1 from stages where name = 'Unveröffentlichte Stage'
       ) then 'PASS' else 'FAIL' end as ergebnis;

-- Regelwerk-Tabellen als anon LESEN — nicht nur Policies zählen, sondern
-- tatsächlich abfragen. Genau hier lag eine Endlosrekursion zwischen den
-- Policies von rulesets und ruleset_versions (42P17), die beim Anlegen der
-- Migration nicht auffiel, weil sie erst zur Abfragezeit auftritt. Ein Test,
-- der nur pg_policies inspiziert, hätte sie nie gefunden.
select 'anon kann rulesets abfragen (keine RLS-Rekursion)' as test,
       case when (select count(*) >= 0 from rulesets) then 'PASS' else 'FAIL' end as ergebnis;

select 'anon kann ruleset_versions abfragen (keine RLS-Rekursion)' as test,
       case when (select count(*) >= 0 from ruleset_versions) then 'PASS' else 'FAIL' end as ergebnis;

-- Der Join, den die Discovery-Seite tatsächlich fährt: Competition ->
-- Ruleset-Version -> Ruleset. Erst diese Kombination hat den Fehler ausgelöst.
select 'anon kann Discovery-Join fahren (competitions -> ruleset)' as test,
       case when (
         select count(*) >= 0
           from competitions c
           left join ruleset_versions rv on rv.id = c.ruleset_version_id
           left join rulesets rs on rs.id = rv.ruleset_id
       ) then 'PASS' else 'FAIL' end as ergebnis;

-- Schreibversuche als anon müssen scheitern.
select 'anon kann kein Match anlegen' as test,
       case when not exists (
         select 1 from pg_policies
          where tablename = 'competitions'
            and cmd = 'INSERT'
            and 'anon' = any (roles)
       ) then 'PASS' else 'FAIL' end as ergebnis;

-- score_events: UPDATE/DELETE sind zusätzlich per REVOKE entzogen.
select 'anon hat kein UPDATE-Recht auf score_events' as test,
       case when not has_table_privilege('anon', 'score_events', 'UPDATE')
       then 'PASS' else 'FAIL' end as ergebnis;

select 'authenticated hat kein UPDATE-Recht auf score_events' as test,
       case when not has_table_privilege('authenticated', 'score_events', 'UPDATE')
       then 'PASS' else 'FAIL' end as ergebnis;

select 'authenticated hat kein DELETE-Recht auf score_events' as test,
       case when not has_table_privilege('authenticated', 'score_events', 'DELETE')
       then 'PASS' else 'FAIL' end as ergebnis;

-- payments/results: bewusst KEINE Write-Policy für Clients.
select 'payments hat keine Client-Write-Policy' as test,
       case when not exists (
         select 1 from pg_policies
          where tablename = 'payments' and cmd in ('INSERT', 'UPDATE', 'ALL')
       ) then 'PASS' else 'FAIL' end as ergebnis;

select 'results hat keine Client-Write-Policy' as test,
       case when not exists (
         select 1 from pg_policies
          where tablename = 'results' and cmd in ('INSERT', 'UPDATE', 'ALL')
       ) then 'PASS' else 'FAIL' end as ergebnis;

reset role;
rollback;
