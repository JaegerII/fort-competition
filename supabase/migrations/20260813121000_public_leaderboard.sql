-- Öffentliche Rangliste als eigene View.
--
-- Dasselbe Spannungsfeld wie bei public_competition_stats, nur andersherum
-- aufgelöst: results IST öffentlich (Live-Leaderboard, Spec §10), aber der
-- Weg von einem Ergebnis zum Namen führt über registrations — und die ist
-- korrekt geschützt, weil "wer hat sich angemeldet" nicht öffentlich ist.
-- Für anonyme Besucher brach der Join deshalb weg und die Rangliste blieb
-- leer.
--
-- Auflösung: Eine Rangliste NENNT naturgemäß ihre Teilnehmer — das ist ihr
-- Zweck, nicht ein Leck. Diese View veröffentlicht genau diese Projektion
-- (Platz, Name, Land, Division, Wertung) und nichts darüber hinaus: keine
-- E-Mail, kein Registrierungsstatus, keine Zahlungsinfo, keine
-- registration_id. Und sie ist strikt auf öffentliche Matches beschränkt,
-- die auch tatsächlich laufen oder gelaufen sind — für ein Match im Entwurf
-- gibt sie nichts heraus.
create view public_leaderboard
with (security_invoker = off) as
select
  res.competition_id,
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
  'Öffentliche Ranglisten-Projektion. Bewusst RLS-umgehend (security_invoker = off), dafür intern auf öffentliche, laufende/beendete Matches beschränkt und auf genau die Felder reduziert, die eine Rangliste ohnehin zeigt.';

grant select on public_leaderboard to anon, authenticated;
