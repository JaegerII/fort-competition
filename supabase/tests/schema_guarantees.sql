-- Prüft die Integritätsgarantien des Schemas gegen eine echte Datenbank.
-- Syntax-Checks können das nicht: hier geht es darum, ob die Trigger und
-- Constraints tatsächlich FEUERN — die Garantien sind der eigentliche Wert
-- des Schemas, nicht die Tabellen.
--
-- Lauf:  docker exec -i supabase_db_fort-competition \
--          psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f - < schema_guarantees.sql
--
-- Erwartete Ausgabe: nur "PASS"-Zeilen. Jedes FAIL ist ein echter Defekt.

\set ON_ERROR_STOP on
\pset pager off

create or replace function assert_fails(stmt text, label text)
returns text
language plpgsql
as $$
begin
  execute stmt;
  return 'FAIL  ' || label || ' — wurde erlaubt, hätte scheitern müssen';
exception
  when others then
    return 'PASS  ' || label;
end;
$$;

create or replace function assert_ok(stmt text, label text)
returns text
language plpgsql
as $$
begin
  execute stmt;
  return 'PASS  ' || label;
exception
  when others then
    return 'FAIL  ' || label || ' — ' || sqlerrm;
end;
$$;

-- ── Testdaten aufbauen ────────────────────────────────────────────────
begin;

insert into organizations (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Testclub');

insert into disciplines (id, code, name)
values ('22222222-2222-2222-2222-222222222222', 'ipsc_handgun', 'IPSC Handgun');

insert into target_types (id, code, name, zones)
values ('33333333-3333-3333-3333-333333333333', 'ipsc_metric', 'IPSC Metric',
        '{"A": {"major": 5, "minor": 5}}'::jsonb);

insert into rulesets (id, discipline_id, name, scoring_type)
values ('44444444-4444-4444-4444-444444444444',
        '22222222-2222-2222-2222-222222222222', 'IPSC Handgun', 'hit_factor');

insert into ruleset_versions (id, ruleset_id, version, status, definition)
values ('55555555-5555-5555-5555-555555555555',
        '44444444-4444-4444-4444-444444444444', '1.0.0', 'draft',
        '{"divisions": ["Open"]}'::jsonb);

insert into competitions (id, organization_id, ruleset_version_id, name, slug, status, visibility)
values ('66666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555555',
        'Testmatch', 'testmatch', 'in_progress', 'public');

insert into stages (id, competition_id, number, name, published)
values ('77777777-7777-7777-7777-777777777777',
        '66666666-6666-6666-6666-666666666666', 1, 'Stage 1', true);

-- Schütze OHNE Account — das ist die Entkopplung, die wir bewusst gewählt
-- haben. Wenn das hier scheitert, ist der Import-/Walk-up-Weg zu.
insert into shooters (id, display_name, country)
values ('88888888-8888-8888-8888-888888888888', 'Test Schütze', 'DE');

insert into registrations (id, competition_id, shooter_id, status)
values ('99999999-9999-9999-9999-999999999999',
        '66666666-6666-6666-6666-666666666666',
        '88888888-8888-8888-8888-888888888888', 'confirmed');

insert into score_events (id, competition_id, registration_id, stage_id, event_type, payload, client_created_at)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '66666666-6666-6666-6666-666666666666',
        '99999999-9999-9999-9999-999999999999',
        '77777777-7777-7777-7777-777777777777',
        'score_entered', '{"time": 7.3}'::jsonb, now());

-- ── Die eigentlichen Prüfungen ────────────────────────────────────────
select 'Schütze ohne Account anlegbar (Entkopplung)' as test,
       case when exists (
         select 1 from shooters
          where id = '88888888-8888-8888-8888-888888888888' and user_id is null
       ) then 'PASS' else 'FAIL' end as ergebnis;

select assert_fails(
  $$update score_events set payload = '{"time": 1.0}'::jsonb
     where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'score_events: UPDATE blockiert (append-only)'
);

select assert_fails(
  $$delete from score_events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'score_events: DELETE blockiert (append-only)'
);

-- Eine Korrektur ist ein NEUES Event, das aufs alte zeigt — das muss gehen.
select assert_ok(
  $$insert into score_events
      (id, competition_id, registration_id, stage_id, event_type, payload,
       corrects_event_id, client_created_at)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            '66666666-6666-6666-6666-666666666666',
            '99999999-9999-9999-9999-999999999999',
            '77777777-7777-7777-7777-777777777777',
            'score_corrected', '{"time": 7.5}'::jsonb,
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now())$$,
  'score_events: Korrektur als neues Event erlaubt'
);

-- Eine "Korrektur", die einen anderen Schützen betrifft, muss scheitern.
insert into shooters (id, display_name)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Anderer Schütze');
insert into registrations (id, competition_id, shooter_id, status)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
        '66666666-6666-6666-6666-666666666666',
        'cccccccc-cccc-cccc-cccc-cccccccccccc', 'confirmed');

select assert_fails(
  $$insert into score_events
      (id, competition_id, registration_id, stage_id, event_type, payload,
       corrects_event_id, client_created_at)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
            '66666666-6666-6666-6666-666666666666',
            'dddddddd-dddd-dddd-dddd-dddddddddddd',
            '77777777-7777-7777-7777-777777777777',
            'score_corrected', '{}'::jsonb,
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now())$$,
  'score_events: Korrektur mit fremder Registrierung blockiert'
);

-- Ruleset-Unveränderlichkeit nach Publish
update ruleset_versions set status = 'published'
 where id = '55555555-5555-5555-5555-555555555555';

select 'ruleset_versions: published_at automatisch gesetzt' as test,
       case when (select published_at is not null from ruleset_versions
                   where id = '55555555-5555-5555-5555-555555555555')
       then 'PASS' else 'FAIL' end as ergebnis;

select assert_fails(
  $$update ruleset_versions set definition = '{"divisions": ["Manipuliert"]}'::jsonb
     where id = '55555555-5555-5555-5555-555555555555'$$,
  'ruleset_versions: definition nach Publish unveränderlich'
);

select assert_fails(
  $$update ruleset_versions set status = 'draft'
     where id = '55555555-5555-5555-5555-555555555555'$$,
  'ruleset_versions: Rückfall published -> draft blockiert'
);

select assert_ok(
  $$update ruleset_versions set status = 'deprecated'
     where id = '55555555-5555-5555-5555-555555555555'$$,
  'ruleset_versions: published -> deprecated erlaubt'
);

-- CHECK-Constraints, die im Prototyp nur UI-Warnungen waren
select assert_fails(
  $$update competitions
       set starts_at = '2027-06-01', ends_at = '2027-01-01'
     where id = '66666666-6666-6666-6666-666666666666'$$,
  'competitions: Enddatum vor Startdatum blockiert'
);

select assert_fails(
  $$update competitions set registration_fee = -50
     where id = '66666666-6666-6666-6666-666666666666'$$,
  'competitions: negative Gebühr blockiert'
);

select assert_fails(
  $$update competitions set capacity = 0
     where id = '66666666-6666-6666-6666-666666666666'$$,
  'competitions: Kapazität 0 blockiert'
);

-- Ein Schütze darf sich pro Match nur einmal registrieren
select assert_fails(
  $$insert into registrations (competition_id, shooter_id, status)
    values ('66666666-6666-6666-6666-666666666666',
            '88888888-8888-8888-8888-888888888888', 'confirmed')$$,
  'registrations: Doppelregistrierung blockiert'
);

-- Ein Official ohne jede Identifikation darf nicht existieren
select assert_fails(
  $$insert into officials (competition_id, display_name, role)
    values ('66666666-6666-6666-6666-666666666666', 'Niemand', 'ro')$$,
  'officials: ohne user_id UND ohne Gerätecode blockiert'
);

rollback;

drop function assert_fails(text, text);
drop function assert_ok(text, text);
