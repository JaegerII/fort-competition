# FORT Competition — Roadmap Extensions: Shooter-Centric Platform & Multi-Source Data

Status: **Reference document, not a build plan.** Captures a set of long-term
directional points, reconciled against [PRODUCT_SPECIFICATION.md](./PRODUCT_SPECIFICATION.md),
[PHASE3_DATABASE_SCHEMA.md](./PHASE3_DATABASE_SCHEMA.md), and the current
prototype codebase (`apps/web/`). Nothing here is scheduled or implemented —
this is what future us should check before making a decision that's hard to
walk back later. Revisit when any of these items actually comes up for
prioritization.

For each point: what we already have and where it lives, whether it's
redundant/new/needs generalizing, and what to keep in mind — no code, no
schema changes, no rebuilding of working areas.

---

## 1. Think from the shooter outward

**Already have:** the Athlete Profile (spec §12, built as `/athletes/[id]`,
data shape in `apps/web/src/lib/mock-data.ts`'s `AthleteProfile`) already
covers stats, analytics, insight, and history. The Personal Match Dashboard
(spec §11, `PersonalMatchCard` component) covers the *current-match* view.

**Gap:** these are two separate views today — the profile shows only *past*
results (`AthleteProfile.history`), nothing upcoming/registered/live. The
brief's ask ("Upcoming / Registered / Live / Past Matches" on one profile) is
a real gap, not something we solved differently.

**Assessment:** extend, don't rebuild. `AthleteProfile.history` already has
the right shape for "Past" — the natural extension is a
`upcomingRegistrations` (or similar) list on the same profile, sourced from
`registrations` (already modeled in [PHASE3_DATABASE_SCHEMA.md §5.4](./PHASE3_DATABASE_SCHEMA.md))
filtered by athlete + status/date. No new entity needed, just a query shape
we haven't built yet.

**Also flagged, not yet modeled:**
- **Achievements / Personal Bests** — natural extension of the existing
  analytics block (spec §13), not a new system. A "best hit factor ever" is
  just a MAX() over the same `results` rows we already compute averages from.
- **Equipment** — genuinely new, no current model. Low priority; would be an
  optional profile sub-section, not core to anything else.
- **Divisions/Categories on the profile** — today `AthleteProfile.primaryDivision`
  is a single field, but a real career spans multiple divisions over time.
  The per-match `AthleteHistoryEntry.place` already encodes division context
  per entry, which is the right level — `primaryDivision` should stay a
  display-convenience field (a career "most-competed" division), not the
  source of truth for what divisions someone has actually shot.

---

## 2. External data via an adapter layer, never driving the UI directly

**Already have this exact principle**, just not yet applied to external
competition data. It's the same reasoning already used for the Ruleset
Engine (spec §7.4 — one pure package, framework-free, never lets any single
source dictate the domain model) and for score events (spec §8.1 — FORT owns
its own event log regardless of where a device's data originated). This
point doesn't introduce a new idea, it extends an idea we already committed
to into a domain we haven't touched (external match/result sources).

**Nothing in the current schema or code conflicts with this** — no import
path exists yet, so there's nothing to reconcile. Worth remembering
alongside point 12 (Data Provenance) once an import path gets designed: same
`External Source → Adapter → FORT Data Model → App` shape, same "FORT's
internal tables are the only thing the UI ever reads."

---

## 3. External Identities (IPSC/PractiScore/USPSA/etc. IDs on a profile)

**Not modeled.** Purely additive when it happens: an `external_identities`
table (`athlete_profile_id`, `provider`, `external_id`, `verified_at`) hangs
off the existing `athlete_profiles` table without touching it. No conflict,
no redundant structure to avoid — just not built yet, correctly deferred.

---

## 4. External/unclaimed shooters + "Claim this profile" — the one point worth real attention now

**This is the one item in the whole list where a decision we've already
made could actually block the feature later**, per your own evaluation
question #5 — flagging it clearly rather than burying it.

**Current state:** [PHASE3_DATABASE_SCHEMA.md §5.1](./PHASE3_DATABASE_SCHEMA.md)
defines `athlete_profiles.id` as *literally equal to* `auth.users.id` — a
hard 1:1 tie between "has a FORT account" and "exists as a competitor in our
data." Under that design, a shooter whose results we want to show (public
match result, imported data, a Match Director typing in a walk-up
competitor's name) *cannot exist* without first creating a login-capable
user account. That directly blocks "claim your profile later."

**We've already solved this exact shape of problem once.** `officials` in
the same schema doc (§5.3) already has `user_id` **nullable** plus a
device-scoped code, specifically so a volunteer RO can operate without a
full account. The same pattern generalizes directly to shooters: a
`Competitor`/`Shooter` entity that can exist with `user_id = null`, and a
`registrations` row that points at a competitor, not necessarily a logged-in
user. "Claim this profile" becomes: set `user_id` on an existing competitor
row once someone signs up and confirms it's them — additive, no data
migration story needed if we get the shape right from the start.

**Why this is worth remembering *before* Phase 3's real implementation
(not just "someday"):** it's also directly useful for the *current* MVP —
Match Directors entering walk-up competitors who don't have the app yet is
an everyday real-world scenario, not just a future external-data feature.
Worth reconsidering the `athlete_profiles` ↔ `auth.users` relationship when
Phase 4 (real schema implementation) happens, even before external imports
exist. Noted directly in [PHASE3_DATABASE_SCHEMA.md §7](./PHASE3_DATABASE_SCHEMA.md#7-offene-punkte-für-phase-4-applikationsarchitektur)
so it isn't only sitting in this document.

---

## 5. External Match vs. FORT Managed Match

**Not modeled** — `competitions` currently assumes every match is fully
FORT-managed. Natural, additive extension when needed: a `source` field
(`fort_managed` | `external`) plus optional `external_source`/`external_id`
fields (ties to point 12). No redundancy, no conflict — just not yet needed
since there's no import path.

---

## 6. Following shooters → activity feed

**Partially already planned, not new.** [PRODUCT_SPECIFICATION.md §4](./PRODUCT_SPECIFICATION.md#4-mvp-vs-phase-2-vs-future)
(Phase 2 tranche) already lists "Athlete 'follow' for spectators,
ranking-movement notifications," and the spectator flow in
[PHASE2_USER_FLOWS.md §4](./PHASE2_USER_FLOWS.md) already ends on a "follow"
tap. What's new in this ask is the richer **feed** framing (match updates,
live performance, new PR, podium, ranking change) rather than just a binary
follow toggle. This is an enrichment of an existing roadmap item, not a
second concept — when Phase 2 "follow" gets built, build it as a feed
source from the start rather than a bare boolean, since notifications
(already in the feature map) are the same underlying event stream.

---

## 7. Live Match Experience for every user, not just officials — already the plan, already prototyped

**This is already what we built.** Spec §10 (Live Match Experience) and
§11 (Personal Match Dashboard) are this exact idea, and the prototype
already implements both: the public live match page
(`/matches/[id]`, no login required) and `PersonalMatchCard` (stage rank,
match rank, hit factor, movement) are functionally the "Flashscore for
competition shooting" experience the brief describes, field-for-field
close to the example given (stage time, hit factor, stage rank, match
rank).

**Actual gap:** today it's a static snapshot (mock data), not a live
stream. This isn't a new concept to design — the architecture for it
already exists on paper: the event-sourced score log
([PRODUCT_SPECIFICATION.md §8.1](./PRODUCT_SPECIFICATION.md#81-the-one-modeling-decision-worth-calling-out-explicitly-score-is-derived-not-stored-and-mutated))
plus Realtime as the recommended transport
([§12](./PRODUCT_SPECIFICATION.md#12-recommended-technology-stack)) were
chosen specifically so this would work once there's a real backend. Nothing
to change now — just confirming the "flashscore" framing matches a decision
already made, not a new direction.

---

## 8. Performance Analytics — extend the existing block, don't replace it

**Already have the shape**, missing some fields. Current
`AthleteProfile` (mock-data.ts) has `avgMatchPct`, `avgStagePct`,
`avgHitFactor`, `aZonePct`, `penaltyRate`, `dnfRate` — the same category of
metric spec §13 already calls for. What's asked here and not yet present:

- Charlie%/Delta%/Miss% as their own fields (today only A-zone% exists;
  the others are implied but not broken out)
- Stage Wins / Match Wins as explicit counters (we have `wins`/`podiums` at
  match level, not stage-level win counts)
- Season-based comparison — **new dimension**, no `season`/`year` grouping
  exists anywhere in the current schema. Would likely be derived from match
  date rather than a stored field, but worth a conscious decision rather
  than an afterthought when the real analytics queries get built.

None of this conflicts with anything current — it's the same analytics
block, more granular. Straightforward to add fields later; nothing here
needs restructuring today.

---

## 9. FORT Performance Rating — new concept, doesn't conflict with anything

**Genuinely new** — no equivalent exists yet. Philosophically consistent
with a principle we already committed to for insights (spec §13: "avoid
fake AI insights... every insight must be derived from actual competition
data") — a FORT Rating would be the same discipline applied to a ranking
number instead of a sentence: computed, transparent, explicitly **not**
labeled as an official federation ranking.

**No blockers found.** The inputs it would need — match level, participant
count, result recency, opponent strength — are all things the current
schema already carries or could easily carry (`competitions.level` already
exists; `results.calculated_at` already gives recency;
`registrations`/`squad` counts already give field size). Algorithm
explicitly out of scope for now, per your instruction — just noting the
data model doesn't need to change to make it *possible* later.

---

## 10. Stay generic, don't hard-code to IPSC — already the architecture's whole point

**Already the central thesis of the Rules Engine**
([PRODUCT_SPECIFICATION.md §4](./PRODUCT_SPECIFICATION.md#4-mvp-vs-phase-2-vs-future),
[§7](./PRODUCT_SPECIFICATION.md#7-rules-engine-concept),
[PHASE3_DATABASE_SCHEMA.md §5.2](./PHASE3_DATABASE_SCHEMA.md)) — `Discipline`,
`Ruleset`, `RulesetVersion`, `Division`, `Category` are already
IPSC-agnostic by design, IPSC is just the first data set loaded into a
generic structure. This point doesn't ask for anything new; it's a "stay
the course" note, not a gap.

**One dimension genuinely missing:** `Sanctioning Body` (IPSC, USPSA, DVSSF,
a national federation) as its own concept, distinct from `Discipline`
(Handgun, Rifle, PCC — federation-agnostic categories of shooting). Right
now a discipline code like `ipsc_handgun` quietly bakes the federation into
the discipline name. Worth a conscious split (`discipline` = weapon/format
category, `sanctioning_body` = which federation's rules apply) whenever a
second federation's ruleset actually gets built — not urgent, nothing
currently depends on the conflation in a way that would make splitting it
later hard.

---

## 11. Duplicate Detection / Identity Resolution

**Not applicable yet** — no multi-source data exists, so nothing to
resolve. Directly downstream of points 2 and 4 (external data + unclaimed
shooters): once those exist, this becomes necessary. Your stated preference
— explicit confirmed links over automatic fuzzy merging — matches how we
already treat every other ambiguous-authority situation in this system (RLS
over client trust, event log over silent overwrite, explicit `dynamicParams`
over implicit fallbacks). Worth designing as a `pending`/`confirmed` link
table rather than a merge-in-place operation, consistent with that pattern,
when the time comes.

---

## 12. Data Provenance

**Not modeled**, purely additive when needed: `source`, `external_id`,
`external_ref_url`, `imported_at`, `last_synced_at` on whichever tables
start accepting external data (`competitions`, competitor/shooter records,
`results`). Same instinct already reflected in the existing `audit_log`
design ([PHASE3_DATABASE_SCHEMA.md §5.5](./PHASE3_DATABASE_SCHEMA.md)) — this
system already treats traceability as a first-class concern, provenance
fields are that same principle applied to *imported* rather than
*internally mutated* data.

---

## 13. Product vision: "Strava + Flashscore + competition management"

**Sharpens, doesn't replace, the existing framing.** Brief §28 and
[PRODUCT_SPECIFICATION.md §15](./PRODUCT_SPECIFICATION.md#15-where-fort-competition-can-meaningfully-outperform-practiscore)
already reject "PractiScore with a nicer UI" in favor of "a modern operating
system for competitive shooting," with Strava/Garmin/F1-timing already
named as the UX bar to clear (brief §1). "Strava + Flashscore" is a crisper,
more concrete restatement of the same vision, not a new one — worth
adopting as the go-to soundbite going forward since it names the two
concrete product feelings (career/social + live) that the existing spec
described more abstractly.

---

## What to actually do with this document

Nothing right now, by design. When any of these come up for real
prioritization:

1. Check this document first — most of it maps onto something we already
   half-built or already decided; re-deriving it from scratch would be
   wasted effort.
2. **The one item that deserves attention before, not after, Phase 4's
   real schema lands: the `athlete_profiles` ↔ `auth.users` 1:1 tie
   (point 4).** Everything else here is purely additive and safe to defer
   indefinitely; this one is the one place an early decision could force a
   migration later. Already cross-referenced in
   [PHASE3_DATABASE_SCHEMA.md §7](./PHASE3_DATABASE_SCHEMA.md#7-offene-punkte-für-phase-4-applikationsarchitektur).
3. Everything else: extend the existing model when the time comes, don't
   stand up a parallel structure next to it.
