-- Öffentliche Teilnehmerzahl pro Match, ohne einzelne Registrierungen zu leaken.
--
-- Das Problem, das erst beim echten Query auffiel: Die Discovery-Seite zeigt
-- "42 / 60 Teilnehmer" — eine öffentliche Angabe. WER registriert ist, ist
-- dagegen privat: die registrations-Policy gibt einem anonymen Besucher
-- korrekterweise null Zeilen zurück. Die Zahl durch Zählen der Zeilen zu
-- ermitteln funktioniert damit nicht (und SOLL es auch nicht) — der Client
-- sah immer 0.
--
-- Lösung: eine View, die ausschließlich das Aggregat veröffentlicht. Views
-- laufen in Postgres standardmäßig mit den Rechten ihres Eigentümers
-- (security_invoker = off), umgehen also die RLS der zugrunde liegenden
-- Tabellen. Damit das kein Leck wird, filtert die View selbst strikt auf
-- öffentliche, nicht-Entwurf-Matches und gibt NUR Zahlen heraus, nie
-- Identitäten.
create view public_competition_stats
with (security_invoker = off) as
select
  c.id as competition_id,
  count(r.id) filter (
    where r.status in ('confirmed', 'pending_payment', 'pending_approval')
  ) as registered_count,
  count(r.id) filter (where r.status = 'waitlisted') as waitlisted_count
from competitions c
left join registrations r on r.competition_id = c.id
where c.visibility = 'public'
  and c.status <> 'draft'
group by c.id;

comment on view public_competition_stats is
  'Nur Aggregate, keine Identitäten. Bewusst RLS-umgehend (security_invoker = off), dafür intern auf öffentliche Matches eingeschränkt.';

grant select on public_competition_stats to anon, authenticated;
