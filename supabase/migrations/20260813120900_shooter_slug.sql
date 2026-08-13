-- shooters: stabiler URL-Slug
--
-- Athletenprofile werden öffentlich unter /athletes/<slug> verlinkt (aus der
-- Rangliste heraus). Die UUID dafür zu verwenden wäre aus zwei Gründen
-- schlecht: unlesbare URLs, und vor allem ist die UUID ein internes
-- Datenbankdetail, das dann in jeder geteilten Ranglisten-URL steckt.
-- competitions hat aus demselben Grund bereits einen slug.
--
-- Nullable, weil ein frisch importierter oder am Matchtag nachgetragener
-- Schütze noch keinen bekommen haben muss — die Profilseite ist dann
-- schlicht (noch) nicht verlinkt.
alter table shooters
  add column slug text unique;

create index shooters_slug_idx on shooters (slug) where slug is not null;
