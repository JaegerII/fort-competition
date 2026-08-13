import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Der anon-Key darf öffentlich im Bundle stehen — das ist kein Versehen,
// sondern das Sicherheitsmodell von Supabase: die Autorisierungsgrenze ist
// Row Level Security in der Datenbank, nicht die Geheimhaltung des Keys
// (Spec §10.2, RLS-Migration 20260813120500). Deshalb funktioniert die
// Anbindung auch aus einer statischen Seite heraus, ohne eigenen Server.
//
// Was NICHT hierher gehört: der service_role-Key. Der umgeht RLS komplett
// und darf nur serverseitig existieren (Stripe-Webhook, Recompute-Job).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Bewusst kein Throw bei fehlender Konfiguration: der Prototyp soll auch
// ohne Datenbank startfähig bleiben (GitHub-Pages-Demo, frischer Checkout
// ohne .env.local). Die aufrufenden Stellen prüfen isSupabaseConfigured und
// fallen auf die Mock-Daten zurück, statt mit einem Laufzeitfehler zu
// sterben.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!)
  : null;
