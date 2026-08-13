-- Neuer Account -> automatisch ein Schützenprofil
--
-- Die Entkopplung Schütze/Account (Migration 20260813120000) erlaubt
-- Schützen OHNE Account. Der umgekehrte Fall darf aber nicht auftreten: ein
-- Account ohne Schützenprofil könnte sich nirgends registrieren, weil die
-- registrations-Policy über auth_shooter_id() geht und die dann NULL liefert.
--
-- Deshalb als Datenbank-Trigger und nicht als Client-Aufruf nach der
-- Anmeldung: ein Client kann abstürzen, offline gehen oder den zweiten
-- Aufruf schlicht nicht machen. Dann existierte ein Account ohne Profil, und
-- der Fehler fiele erst viel später auf. Der Trigger kann nicht übersprungen
-- werden.

-- Erzeugt einen URL-tauglichen, eindeutigen Slug aus dem Anzeigenamen.
-- Ohne Slug wäre das Profil des Nutzers nicht verlinkbar (die Athletenliste
-- filtert Einträge ohne Slug heraus).
create or replace function generate_shooter_slug(display_name text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_slug text;
  candidate text;
  suffix    integer := 0;
begin
  -- Umlaute vor dem Entfernen der Nicht-ASCII-Zeichen sinnvoll ersetzen,
  -- sonst würde aus "Jörg Müller" ein "j-rg-m-ller".
  base_slug := lower(display_name);
  base_slug := replace(base_slug, 'ä', 'ae');
  base_slug := replace(base_slug, 'ö', 'oe');
  base_slug := replace(base_slug, 'ü', 'ue');
  base_slug := replace(base_slug, 'ß', 'ss');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' then
    base_slug := 'athlet';
  end if;

  candidate := base_slug;
  while exists (select 1 from shooters where slug = candidate) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  return candidate;
end;
$$;

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  name text;
begin
  -- Anzeigename aus den Registrierungsdaten, sonst der lokale Teil der
  -- E-Mail. Nie die volle E-Mail: die ist personenbezogen und shooters ist
  -- eine öffentlich lesbare Tabelle.
  name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.shooters (user_id, display_name, slug, claimed_at)
  values (new.id, name, generate_shooter_slug(name), now());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_auth_user();
