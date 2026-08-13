-- Athletenprofile: Wettkampfhistorie und abgeleiteter Insight
--
-- Zwei Lücken, die beim Anbinden der Profilseite auffielen.
--
-- 1) HISTORIE. Ein Profil zeigt "an welchen Matches war ich, auf welchem
--    Platz". Der Weg vom Schützen zu seinen Ergebnissen führt über
--    registrations — geschützt, für anonyme Besucher also leer. Statt eine
--    vierte View zu bauen, wird public_leaderboard erweitert: sie enthält
--    shooter_slug bereits, ihr fehlten nur die Match-Angaben. Damit bedient
--    dieselbe View beide Richtungen — "alle Ergebnisse EINES Matches"
--    (Rangliste) und "alle Ergebnisse EINES Schützen" (Profil).
--
-- 2) INSIGHT. Spec §13 verlangt, dass ein Insight aus echten Wettkampfdaten
--    abgeleitet ist, nie generisch erzeugt. Er gehört damit zu den
--    berechneten Werten und liegt bei shooter_stats — also dort, wo der
--    Recompute-Job schreibt und der Nutzer nie. Nullable, weil die meisten
--    Profile (noch) keinen haben: lieber kein Insight als ein erfundener.

-- DROP + CREATE statt CREATE OR REPLACE: Letzteres darf Spalten
-- ausschließlich HINTEN anhängen. Die Match-Angaben gehören logisch neben
-- competition_id, und der Versuch scheiterte entsprechend mit
-- "cannot change name of view column" (SQLSTATE 42P16). Die View hat keine
-- abhängigen Objekte, ein Drop ist hier also folgenlos.
drop view if exists public_leaderboard;

create view public_leaderboard
with (security_invoker = off) as
select
  res.competition_id,
  c.slug           as competition_slug,
  c.name           as competition_name,
  c.starts_at      as competition_starts_at,
  c.ends_at        as competition_ends_at,
  res.scope,
  res.scope_ref_id,
  res.rank,
  res.points,
  res.percentage,
  res.hit_factor,
  sh.slug          as shooter_slug,
  sh.display_name  as shooter_name,
  sh.country       as shooter_country,
  div.name         as division_name
from results res
join competitions c   on c.id = res.competition_id
join registrations rg on rg.id = res.registration_id
join shooters sh      on sh.id = rg.shooter_id
left join divisions div on div.id = rg.division_id
where c.visibility = 'public'
  and c.status in ('in_progress', 'completed', 'archived');

comment on view public_leaderboard is
  'Öffentliche Ranglisten-Projektion, in beide Richtungen nutzbar: nach competition_id gefiltert ergibt sie die Rangliste eines Matches, nach shooter_slug gefiltert die Wettkampfhistorie eines Athleten. Bewusst RLS-umgehend (security_invoker = off), dafür auf öffentliche, laufende/beendete Matches und auf genau die Felder beschränkt, die eine Rangliste ohnehin zeigt.';

grant select on public_leaderboard to anon, authenticated;

alter table shooter_stats
  add column insight text;

comment on column shooter_stats.insight is
  'Aus echten Wettkampfdaten abgeleiteter Hinweis (Spec §13) — nie generisch erzeugt. Nullable: lieber kein Insight als ein erfundener.';
