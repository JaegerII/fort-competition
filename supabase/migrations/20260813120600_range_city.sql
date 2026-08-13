-- ranges: Stadt und Land als eigene Spalten
--
-- `address` ist bewusst Freitext (Straße, Hausnummer, PLZ …) — daraus die
-- Stadt zu parsen wäre eine Krücke, die beim ersten mehrzeiligen oder
-- anders formatierten Eintrag bricht. Discovery filtert aber nach Land und
-- zeigt "Stadt, Land" an; das sind damit echte, eigenständige Attribute und
-- gehören in eigene Spalten.
alter table ranges
  add column city text,
  add column country text;

-- Für die Länderfilterung auf der Discovery-Seite.
create index ranges_country_idx on ranges (country);
