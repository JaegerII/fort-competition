-- FORT Competition — Seed für die lokale Entwicklung
--
-- Bildet die bisherigen Mock-Daten aus apps/web/src/lib/mock-data.ts als
-- echte DB-Zeilen ab, damit die UI beim Umstieg auf Supabase exakt dasselbe
-- zeigt wie vorher. So ist beim Vergleichen sofort sichtbar, ob die
-- Anbindung stimmt — statt "leer" gegen "irgendwas".
--
-- Alle Schützen hier haben BEWUSST kein user_id: sie belegen im Alltag,
-- dass die Entkopplung Schütze/Account trägt (Import- und Walk-up-Fall).
-- Feste UUIDs statt gen_random_uuid(), damit Seeds reproduzierbar sind und
-- man Zeilen beim Debuggen wiedererkennt.

-- ── Organisation & Ranges ─────────────────────────────────────────────
insert into organizations (id, name, country, description) values
  ('04600000-0000-4000-8000-000000000001'::uuid, 'Shooting Club XYZ', 'Deutschland',
   'Beispielverein für den Prototyp.');

insert into ranges (id, organization_id, name, address, city, country, timezone) values
  ('4a4e0000-0000-4000-8000-000000000001'::uuid, '04600000-0000-4000-8000-000000000001'::uuid,
   'Schießsportanlage Saarbrücken', 'Saarbrücken, Deutschland',
   'Saarbrücken', 'Deutschland', 'Europe/Berlin'),
  ('4a4e0000-0000-4000-8000-000000000002'::uuid, '04600000-0000-4000-8000-000000000001'::uuid,
   'Schießsportanlage Dudweiler', 'Dudweiler, Deutschland',
   'Dudweiler', 'Deutschland', 'Europe/Berlin'),
  ('4a4e0000-0000-4000-8000-000000000003'::uuid, '04600000-0000-4000-8000-000000000001'::uuid,
   'Schießsportanlage Mainz', 'Mainz, Deutschland',
   'Mainz', 'Deutschland', 'Europe/Berlin');

-- ── Disziplinen, Zieltypen, Regelwerke ────────────────────────────────
insert into disciplines (id, code, name) values
  ('d15c0000-0000-4000-8000-000000000001'::uuid, 'ipsc_handgun', 'IPSC Handgun'),
  ('d15c0000-0000-4000-8000-000000000002'::uuid, 'ipsc_pcc', 'IPSC PCC'),
  ('d15c0000-0000-4000-8000-000000000003'::uuid, 'custom', 'Custom / Club Match');

-- Zonen inkl. Major/Minor: genau der Unterschied, den die vereinfachte
-- Prototyp-Formel (A=5/C=3/D=1) noch nicht kennt.
insert into target_types (id, code, name, zones) values
  ('7a49e700-0000-4000-8000-000000000001'::uuid, 'ipsc_metric', 'IPSC Metric Target',
   '{"A": {"major": 5, "minor": 5},
     "C": {"major": 4, "minor": 3},
     "D": {"major": 2, "minor": 1},
     "M": {"major": -10, "minor": -10},
     "NS": {"major": -10, "minor": -10}}'::jsonb);

insert into rulesets (id, discipline_id, organization_id, name, scoring_type) values
  ('4001e700-0000-4000-8000-000000000001'::uuid, 'd15c0000-0000-4000-8000-000000000001'::uuid,
   null, 'IPSC Handgun', 'hit_factor'),
  ('4001e700-0000-4000-8000-000000000002'::uuid, 'd15c0000-0000-4000-8000-000000000002'::uuid,
   null, 'IPSC PCC', 'hit_factor'),
  ('4001e700-0000-4000-8000-000000000003'::uuid, 'd15c0000-0000-4000-8000-000000000003'::uuid,
   '04600000-0000-4000-8000-000000000001'::uuid, 'Club Match Regelwerk', 'hit_factor');

insert into ruleset_versions (id, ruleset_id, version, status, definition, published_at) values
  ('7e751000-0000-4000-8000-000000000001'::uuid, '4001e700-0000-4000-8000-000000000001'::uuid,
   '2024.1.0', 'published',
   '{"divisions": ["Production Optics", "Production", "Standard", "Open", "Classic"],
     "categories": ["Lady", "Junior", "Senior", "Super Senior", "Law Enforcement"],
     "powerFactors": ["major", "minor"]}'::jsonb, now()),
  ('7e751000-0000-4000-8000-000000000002'::uuid, '4001e700-0000-4000-8000-000000000002'::uuid,
   '2024.1.0', 'published',
   '{"divisions": ["PCC Optics"], "categories": ["Lady", "Senior"]}'::jsonb, now()),
  ('7e751000-0000-4000-8000-000000000003'::uuid, '4001e700-0000-4000-8000-000000000003'::uuid,
   '1.0.0', 'published',
   '{"divisions": ["Open", "Standard"], "categories": []}'::jsonb, now());

-- ── Competitions (entsprechen den drei Mock-Matches) ──────────────────
insert into competitions (
  id, organization_id, range_id, ruleset_version_id, name, slug, level,
  starts_at, ends_at, status, visibility, currency, registration_fee, capacity
) values
  ('c0a10000-0000-4000-8000-000000000001'::uuid,
   '04600000-0000-4000-8000-000000000001'::uuid,
   '4a4e0000-0000-4000-8000-000000000001'::uuid,
   '7e751000-0000-4000-8000-000000000001'::uuid,
   'IPSC Saarland Open 2027', 'saarland-open-2027', 'Level III',
   '2027-04-18 08:00+02', '2027-04-19 18:00+02',
   'in_progress', 'public', 'EUR', 95, 120),

  ('c0a10000-0000-4000-8000-000000000002'::uuid,
   '04600000-0000-4000-8000-000000000001'::uuid,
   '4a4e0000-0000-4000-8000-000000000002'::uuid,
   '7e751000-0000-4000-8000-000000000003'::uuid,
   'Dudweiler Feierabendmatch #14', 'dudweiler-feierabendmatch-14', 'Club',
   '2026-09-12 17:00+02', '2026-09-12 21:00+02',
   'registration_open', 'public', 'EUR', 20, 60),

  ('c0a10000-0000-4000-8000-000000000003'::uuid,
   '04600000-0000-4000-8000-000000000001'::uuid,
   '4a4e0000-0000-4000-8000-000000000003'::uuid,
   '7e751000-0000-4000-8000-000000000002'::uuid,
   'Rheinland-Pfalz Cup 2026', 'rheinland-pfalz-cup-2026', 'Level II',
   '2026-07-05 08:00+02', '2026-07-06 18:00+02',
   'completed', 'public', 'EUR', 65, 95);

-- ── Divisionen ────────────────────────────────────────────────────────
insert into divisions (id, competition_id, code, name, sort_order) values
  ('d1010000-0000-4000-8000-000000000001'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   'production_optics', 'Production Optics', 1),
  ('d1010000-0000-4000-8000-000000000002'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   'open', 'Open', 2),
  ('d1010000-0000-4000-8000-000000000003'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   'standard', 'Standard', 3);

insert into categories (competition_id, code, name, sort_order) values
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'lady', 'Lady', 1),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'senior', 'Senior', 2),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'junior', 'Junior', 3);

-- ── Stages ────────────────────────────────────────────────────────────
-- Saarland Open: 12 Stages, davon 8 erfasst (entspricht stagesDone im Mock).
insert into stages (competition_id, number, name, published)
select 'c0a10000-0000-4000-8000-000000000001'::uuid, n,
       case n when 4 then 'Stage 04 — Speed Chaos' else 'Stage ' || lpad(n::text, 2, '0') end,
       true
  from generate_series(1, 12) as n;

insert into stages (competition_id, number, name, published)
select 'c0a10000-0000-4000-8000-000000000002'::uuid, n, 'Stage ' || lpad(n::text, 2, '0'), true
  from generate_series(1, 6) as n;

insert into stages (competition_id, number, name, published)
select 'c0a10000-0000-4000-8000-000000000003'::uuid, n, 'Stage ' || lpad(n::text, 2, '0'), true
  from generate_series(1, 10) as n;

-- ── Squads ────────────────────────────────────────────────────────────
insert into squads (competition_id, name, capacity, scheduled_start, sort_order) values
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'Squad 3', 4, '2027-04-18 09:00+02', 3),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'Squad 4', 4, '2027-04-18 10:30+02', 4);

insert into squads (competition_id, name, capacity, scheduled_start, sort_order) values
  ('c0a10000-0000-4000-8000-000000000002'::uuid, 'Squad 1', 10, '2026-09-12 17:00+02', 1),
  ('c0a10000-0000-4000-8000-000000000002'::uuid, 'Squad 2', 10, '2026-09-12 18:00+02', 2),
  ('c0a10000-0000-4000-8000-000000000002'::uuid, 'Squad 3', 10, '2026-09-12 19:00+02', 3);

-- ── Schützen (alle OHNE Account — s. Kopfkommentar) ───────────────────
insert into shooters (id, display_name, country) values
  ('5400e700-0000-4000-8000-000000000001'::uuid, 'Lena Hoffmann',  'DE'),
  ('5400e700-0000-4000-8000-000000000002'::uuid, 'Jonas Keller',   'DE'),
  ('5400e700-0000-4000-8000-000000000003'::uuid, 'Mia Schneider',  'AT'),
  ('5400e700-0000-4000-8000-000000000004'::uuid, 'Paul Richter',   'CH'),
  ('5400e700-0000-4000-8000-000000000005'::uuid, 'Anna Novak',     'CZ'),
  ('5400e700-0000-4000-8000-000000000006'::uuid, 'Sven Weber',     'DE'),
  ('5400e700-0000-4000-8000-000000000007'::uuid, 'Tomas Dubois',   'FR'),
  ('5400e700-0000-4000-8000-000000000008'::uuid, 'Karol Nowak',    'PL');

-- Statistiken nur für Lena, wie im Mock: die übrigen Profile haben bewusst
-- keine ausgedachte Historie (Spec §13 — kein erfundener Insight).
insert into shooter_stats (
  shooter_id, matches_count, stages_count, podiums_count, wins_count,
  avg_match_pct, avg_stage_pct, avg_hit_factor, a_zone_pct, penalty_rate, dnf_rate
) values
  ('5400e700-0000-4000-8000-000000000001'::uuid, 34, 287, 6, 2, 91.40, 88.90, 7.4200, 82.30, 3.10, 0.00);

-- ── Registrierungen für das laufende Match ────────────────────────────
insert into registrations (id, competition_id, shooter_id, division_id, status) values
  ('4e600000-0000-4000-8000-000000000001'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000001'::uuid, 'd1010000-0000-4000-8000-000000000001'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000002'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000002'::uuid, 'd1010000-0000-4000-8000-000000000002'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000003'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000003'::uuid, 'd1010000-0000-4000-8000-000000000003'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000004'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000004'::uuid, 'd1010000-0000-4000-8000-000000000001'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000005'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000005'::uuid, 'd1010000-0000-4000-8000-000000000002'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000006'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000006'::uuid, 'd1010000-0000-4000-8000-000000000001'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000007'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000007'::uuid, 'd1010000-0000-4000-8000-000000000003'::uuid, 'confirmed'),
  ('4e600000-0000-4000-8000-000000000008'::uuid, 'c0a10000-0000-4000-8000-000000000001'::uuid,
   '5400e700-0000-4000-8000-000000000008'::uuid, 'd1010000-0000-4000-8000-000000000002'::uuid, 'confirmed');

-- ── Ergebnisse (entsprechen leaderboard.Overall im Mock) ──────────────
-- results ist ein Cache: hier vorbefüllt, weil die Rules Engine, die ihn
-- normalerweise berechnet, noch nicht existiert. Deshalb ruleset_version_id
-- mitgeschrieben — damit später nachvollziehbar ist, womit gerechnet wurde.
insert into results (
  competition_id, scope, scope_ref_id, registration_id, rank, points, percentage,
  hit_factor, ruleset_version_id
) values
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000001'::uuid, 1, 642.38, 100.000, 7.9214, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000002'::uuid, 2, 628.11,  97.780, 7.7103, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000003'::uuid, 3, 601.54,  93.640, 7.3820, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000004'::uuid, 4, 588.02,  91.530, 7.2189, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000005'::uuid, 5, 579.65,  90.230, 7.1160, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000006'::uuid, 6, 561.40,  87.390, 6.8933, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000007'::uuid, 7, 549.87,  85.600, 6.7515, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'overall', null, '4e600000-0000-4000-8000-000000000008'::uuid, 8, 533.10,  83.000, 6.5457, '7e751000-0000-4000-8000-000000000001'::uuid);

-- Divisionswertungen (Prozente sind je Division auf den Divisionsbesten
-- normiert — deshalb hat der Erste jeder Division 100 %, nicht seinen
-- Overall-Prozentwert).
insert into results (
  competition_id, scope, scope_ref_id, registration_id, rank, points, percentage,
  hit_factor, ruleset_version_id
) values
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000001'::uuid, '4e600000-0000-4000-8000-000000000001'::uuid, 1, 642.38, 100.000, 7.9214, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000001'::uuid, '4e600000-0000-4000-8000-000000000004'::uuid, 2, 588.02,  91.530, 7.2189, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000001'::uuid, '4e600000-0000-4000-8000-000000000006'::uuid, 3, 561.40,  87.390, 6.8933, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000002'::uuid, '4e600000-0000-4000-8000-000000000002'::uuid, 1, 628.11, 100.000, 7.7103, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000002'::uuid, '4e600000-0000-4000-8000-000000000005'::uuid, 2, 579.65,  92.290, 7.1160, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000002'::uuid, '4e600000-0000-4000-8000-000000000008'::uuid, 3, 533.10,  84.870, 6.5457, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000003'::uuid, '4e600000-0000-4000-8000-000000000003'::uuid, 1, 601.54, 100.000, 7.3820, '7e751000-0000-4000-8000-000000000001'::uuid),
  ('c0a10000-0000-4000-8000-000000000001'::uuid, 'division', 'd1010000-0000-4000-8000-000000000003'::uuid, '4e600000-0000-4000-8000-000000000007'::uuid, 2, 549.87,  91.410, 6.7515, '7e751000-0000-4000-8000-000000000001'::uuid);
