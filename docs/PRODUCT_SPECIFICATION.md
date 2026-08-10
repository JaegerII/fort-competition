# FORT Competition — Product & Software Specification (Phase 1 Deliverable)

Status: **Draft for review — no implementation code has been written.**
Scope: Response to the FORT Competition brief, sections 1–16. This is the artifact requested in brief §30 ("Your First Task") and should be reviewed/approved before Phase 2 (detailed user-flow diagrams) and Phase 6 (clickable prototypes) begin.

> Note on this folder: the existing `m2m-design/` directory in this workspace is an unrelated fitness-app ("M2Movement") design system — different color system, different product, different `localStorage` namespace. It is **not** reused here. FORT Competition gets its own visual identity per brief §24; any future decision to share tooling (not tokens) between the two would be a separate, explicit call.

---

## 0. Assumptions & Open Questions

The brief is unusually complete, but several decisions materially change the architecture. I'm stating my assumptions explicitly so they can be corrected before Phase 2–7 build on top of them.

| # | Assumption made | Why it matters | If wrong, what changes |
|---|---|---|---|
| A1 | FORT Performance (existing product) and FORT Competition are **separate codebases/deployments** sharing only an identity/data contract (FORT Athlete), not a monorepo with shared runtime. | Drives §12 tech stack and §1 architecture. | If they must share a runtime today, we'd design a single Next.js app with two route groups instead of two apps + a shared API. |
| A2 | No existing backend, auth provider, or database for FORT Performance is being reused — FORT Competition starts on its own Supabase/Postgres project, linked later via a federated identity contract. | Avoids blocking Phase 1 on details of a system I haven't seen. | If FORT Performance already has an auth/user table, FORT Athlete becomes "extend that table" not "new system," which changes §8 and §10. |
| A3 | Digital score confirmation (brief §9) needs to be **legally defensible but not necessarily a qualified e-signature** (eIDAS-qualified) at MVP. A PIN/tap confirmation with full audit trail is assumed sufficient for club/regional matches; federation-sanctioned matches may require more later. | Avoids over-engineering MVP with signature infrastructure most matches won't need. | If IPSC-sanctioned Level III+ matches require cryptographic signatures from day one, we need a signature capability (e.g., on-device drawn signature + hash, or a proper e-signature provider) in the MVP, not Phase 2. |
| A4 | "Offline-first" means the **scoring path only** (RO/scorer device) must fully function with zero connectivity for an entire match day. Match Director configuration, registration, and payments are assumed online-required (a Match Director building a match without internet is not a supported scenario at MVP). | Keeps offline engineering effort focused on the highest-value, highest-risk path instead of the whole app. | If MDs also need offline match setup (e.g., in a bunker range with zero signal even for setup), the sync engine's scope roughly doubles. |
| A5 | Payments at MVP means **registration fee collection via a hosted checkout (Stripe)**, not a full multi-party payout/marketplace system (clubs are paid out via Stripe Connect or similar in Phase 2+). | Keeps MVP payment surface small and PCI scope near-zero. | If clubs need instant payout or split payments at launch, Stripe Connect (or equivalent) has to be designed in from day one, not bolted on. |
| A6 | "Ruleset-independent architecture" for MVP means: the rules engine is generic, and **two rulesets ship** (IPSC Handgun, Custom/Club Match) — not that all Priority 0–2 rulesets ship simultaneously. | Matches brief §26 MVP list; avoids scope creep disguised as "architecture purity." | If IPSC PCC must also be in the MVP (brief lists it as Priority 0), add one more ruleset to the launch set — architecturally trivial, just more content/testing. |
| A7 | Primary backend direction is **Supabase (managed Postgres + Auth + Realtime + Storage)** hosted in an EU region, with the rules engine and sync-resolution logic kept as portable TypeScript, not vendor-specific Edge Functions only. | Balances "ship fast" against "don't lock the core IP into one vendor." Reasoning expanded in §12. | If there's an existing infra preference (self-hosted Postgres, AWS, a specific EU cloud for compliance reasons), swap the hosting layer; the domain/rules-engine layers are designed to survive that swap. |
| A8 | Native app wrappers (React Native / Capacitor) are **not** part of MVP; the Scoring surface ships as an installable PWA. Revisit only if a concrete blocker appears (see §12, §13). | Avoids maintaining two client codebases before we know the PWA can't do the job. | If Bluetooth chrono integration or iOS background-sync reliability turns out to be a hard blocker in testing, budget a native scoring app for Phase 2. |

These are working assumptions, not commitments — flag any that are wrong and I'll adjust the rest of the spec accordingly before Phase 2.

---

## 1. Product Architecture

### 1.1 Ecosystem level

```
                    ┌─────────────────────────┐
                    │      FORT ATHLETE        │   shared identity, profile,
                    │  (identity & data layer) │   cross-product statistics
                    └────────────┬─────────────┘
                     ┌───────────┴────────────┐
          ┌──────────▼─────────┐   ┌──────────▼──────────┐
          │   FORT Performance   │   │   FORT Competition    │
          │   (training, dry-fire)│   │  (matches, scoring,   │
          │                       │   │   live results)        │
          └───────────────────────┘   └────────────────────────┘
```

**Decision:** FORT Athlete is a *contract*, not a shared runtime, at this stage — a stable set of fields (identity, division/discipline preferences, cross-product stats) and an API/event boundary that both products read and write through. FORT Competition owns competition data; FORT Performance owns training data; neither reaches directly into the other's database.

**Why:** the two products have different operational profiles — Competition needs offline-first, high-integrity, audit-grade writes on match day; Performance is a training-log app with different scale and consistency needs. Coupling their databases now would force every future schema change through a cross-team negotiation. A contract-level integration (shared user/athlete ID, a small "athlete facts" API, and later an event bus for insights like "weak on transitions → suggest drill") gets the ecosystem vision in brief §14/§29 without a premature merge. It also means FORT Competition can ship and be evaluated on its own before the training linkage exists.

### 1.2 FORT Competition internal architecture — modular monolith

Rather than microservices, FORT Competition is built as a **modular monolith**: one deployable backend, internally organized into modules with hard boundaries (own tables, own service layer, communicate through defined interfaces, no reaching across module lines for convenience).

Modules:
1. **Identity & Athlete Profile** — accounts, athlete profiles, statistics rollups
2. **Organization & Range** — clubs, membership, ranges
3. **Ruleset Engine** — disciplines, rulesets, versions, scoring/ranking/tie-break calculators (a pure, dependency-free package — see §7)
4. **Match Configuration** — match, divisions, categories, stages, staff, schedule (the Match Builder)
5. **Registration & Payments** — registration, waitlist, fees, payment records
6. **Squadding** — squads, squad membership, scheduling constraints
7. **Scoring & Sync** — score events, confirmations, penalties, the offline sync protocol
8. **Results & Rankings** — derived, recomputable results, leaderboards
9. **Live & Public** — read-optimized public projections (match pages, leaderboards, athlete search)
10. **Analytics** — derived performance insights (read-only consumer of Results + Scoring)
11. **Notifications** — match updates, registration status, results published
12. **Audit & Compliance** — audit log, GDPR export/delete jobs

**Why modular monolith over microservices:** microservices buy independent scaling and deployment at the cost of distributed-systems complexity (network calls where function calls used to be, eventual consistency everywhere, more infra to operate). At MVP scale (a handful of matches running concurrently across Europe, not global hyperscale), that cost isn't justified and it slows the team down. A modular monolith with clean internal boundaries gets almost all the benefit — the boundaries make it easy to extract a module (most plausibly **Scoring & Sync** or **Live & Public**, the two with the most distinct load profile) into its own service later if a real scaling need appears, without a rewrite. This is the same reasoning that justifies avoiding a "big ball of mud": draw the seams now, pay the distribution tax only when there's evidence you need it.

**Why the Ruleset Engine specifically is isolated as a pure package (not just a monolith module):** it is the one piece of logic that must run in three different runtimes — the backend (source of truth), the Match Director's browser (live previews while configuring a match), and the RO's offline scoring device (must compute scores with zero network). A pure, side-effect-free TypeScript package with no framework or database dependency is the only way to guarantee those three environments compute identical results from identical inputs. This single decision is what makes "never approximate competition scores" (brief §5) and "offline-first" (brief §7) simultaneously achievable.

### 1.3 Client surfaces

Three distinct front-ends share a component library (§24) but are **not** the same layout scaled responsively (brief §25 is explicit about this):

| Surface | Primary users | Device class | Key property |
|---|---|---|---|
| **Public/Athlete Web App** | Athletes, spectators | Phone-first, responsive | Fast, mostly read-heavy, works logged-out |
| **Scoring PWA** | RO/Scorer | Tablet/phone, outdoors | Offline-first, huge touch targets, near-zero typing |
| **Match Director Console** | Match Director, staff | Desktop-first, tablet-capable | Dense, configuration-heavy, wizard-driven |

**Why three surfaces instead of one responsive app:** the brief's own device-mode analysis (§25) is correct — an RO scoring app and a Match Director's stage-builder have almost nothing in common in terms of information density, interaction pattern, or offline requirements. Forcing them into one responsive layout produces a mediocre experience on both ends (the classic failure mode of "legacy match-management software," which is exactly what brief §28 says to avoid). They share a design system and, where sensible, code (React component library, the ruleset engine, the API client), but each has its own route tree and UX rules tuned to its device and user.

---

## 2. User Roles

### 2.1 Primary roles (brief §2)
- **Athlete/Competitor** — the FORT Athlete identity holder
- **Range Officer/Scorer** — scores stages, may or may not have a full account (see below)
- **Match Director** — configures and runs matches, owns match-level permissions
- **Spectator** — anonymous, no account, read-only public data

### 2.2 Supporting roles (brief §20), modeled as **staff roles scoped to an organization or a specific match**, not separate account types
- Range Master
- Chief Range Officer (CRO)
- Scorekeeper
- Stats Officer
- Match Admin (delegate of Match Director with full match config rights)

### 2.3 Two roles the brief implies but doesn't name explicitly — flagging them as additions
- **Organization Owner/Admin** — distinct from Match Director. A club is a persistent entity that outlives any one match; someone needs rights over the *organization* (billing, member management, range definitions) that aren't automatically the same person running today's match. Modeled as an `OrganizationMember.role`.
- **Platform Admin (FORT staff)** — for support, dispute mediation, and abuse handling (e.g., a Match Director account compromised, or a match that needs to be taken down). Not mentioned in the brief but required for any multi-tenant platform; scoped extremely narrowly and fully audit-logged (§10).

### 2.4 A modeling decision worth flagging: RO accounts

**Decision:** an RO does not need a full FORT Athlete account to score. ROs authenticate as a **device-scoped operator** tied to a match (a short-lived PIN/code issued by the Match Director for that match day), optionally linked to a real user account if the RO also competes.

**Why:** many ROs at a local match are volunteers who show up for one day and will never come back. Forcing full account creation (email verification, profile setup) before someone can pick up a tablet and start scoring directly contradicts "extremely fast" and "minimal taps" (brief §1). It also matches reality: the same physical device is often handed between multiple ROs during a match day. The audit trail records *which RO code/device* scored, which is what matters for accountability — not that every RO maintains a long-term profile.

---

## 3. Complete Feature Map

Organized by module (§1.2), condensed to keep this scannable — each row maps to a named brief section.

| Module | Features | Brief ref |
|---|---|---|
| Identity & Athlete Profile | Registration/login, FORT Athlete profile, division/category preferences, competition history, statistics (matches, stages, podiums, wins, avg %, A-zone %, penalty rate, DNF rate, trend) | §12 |
| Organization & Range | Org profile, org dashboard (upcoming/past matches, members, officials, ranges, stats), range CRUD (address, GPS, timezone, bays/capacity/facilities) | §18, §19 |
| Ruleset Engine | Ruleset CRUD & versioning, discipline definitions, scoring method library (hit factor, time+, fixed time, points, steel time, %, custom), penalty definitions, target types, deterministic score/ranking/tie-break calculators | §4, §5 |
| Match Configuration | Guided match builder wizard (ruleset → info → divisions → categories → stages → registration → squads → officials → review → publish), stage definition & target layout, staff assignment | §3 (MD flow) |
| Custom Match Builder | No-code scoring-rule builder for clubs (targets, miss/no-shoot/procedural penalties, tie-break, "best time/most points wins") | §6 |
| Registration & Payments | Discovery & filtered search (map, country, distance, date, discipline, ruleset, division availability, status, level, club), registration flow, division/category selection, squad selection, waitlist, fee collection (Stripe, multi-currency, VAT-aware) | §15, §12 (fees) |
| Squadding | Squad creation, squad membership, capacity limits, schedule slots | §12 |
| Scoring & Sync | Squad→Shooter→Stage→Score→Review→Confirm→Next flow, stepper/numeric-keypad entry, penalty steppers, live points/time/hit-factor preview, digital confirmation (PIN/signature/QR/button), local-first storage, background sync, conflict surfacing, correction audit trail | §8, §9, §7 |
| Results & Rankings | Deterministic recomputation per ruleset, match/division/category/stage results, MD manual correction with audit trail, publish/unpublish, export (CSV/PDF) | §12 |
| Live & Public | Public match page (no login), live leaderboard w/ filters (overall/division/category/stage/squad), stage progress, personal match dashboard (rank, %, stage rank, hit factor, movement), athlete search | §10, §11 |
| Analytics | Strongest/weakest stage type, short/medium/long course averages, derived (not fabricated) textual insights, performance trend charts | §13 |
| Notifications | Registration confirmed/waitlisted, match info updates, schedule changes, results published, (later) "you've been overtaken" live pings | implied by §2, §10 |
| Audit & Compliance | Full audit log (who/what/when/device), GDPR data export & deletion, retention config, consent records | §21, §16 |
| Cross-ecosystem (future) | Weakness → FORT Performance drill link | §14 |

---

## 4. MVP vs Phase 2 vs Future

Refining brief §26 into three concrete tranches. Rule of thumb used: **MVP = the minimum needed to run one real IPSC club match end-to-end, offline, with a public live page** — everything else is deferred even if "easy," because every added surface is added risk before the core loop is validated.

### MVP ("run one real match")
- Auth (email + social), FORT Athlete profile (basic)
- Organizations & Ranges (create, single range per org is fine)
- Ruleset Engine core + **IPSC Handgun** ruleset + **Custom/Club Match** ruleset (validates the engine is genuinely generic, not hand-built for IPSC)
- Match Builder wizard (all steps in §3 flow)
- Stages, divisions, categories
- Registration (with fee collection), waitlist
- Squads (create, join, capacity)
- RO Scoring PWA: full scoring loop, offline storage, sync, digital confirmation (PIN/button — not signature)
- Deterministic results calculation + manual MD correction with audit trail
- Public live match page (leaderboard, stage progress, filters)
- Personal match dashboard for logged-in athletes
- Match Director dashboard (progress monitoring, publish results)
- German + English i18n
- GDPR basics: export, delete, consent, EU hosting

### Phase 2 ("multiple matches, multiple rulesets, real analytics")
- IPSC PCC, IPSC Rifle rulesets
- Athlete competition history & long-term statistics (beyond one match)
- Performance analytics (strongest/weakest stage type, trend insights)
- Match discovery/search (map, filters, distance) — MVP can launch with a simple list if match count is small; promote to full geo-search once there are enough matches to search
- Staff role management (Range Master, CRO, Scorekeeper, Stats Officer as distinct scoped roles — MVP can get by with Match Director + generic "Official")
- Multi-currency beyond EUR, VAT handling refinement
- Additional languages (FR, ES, IT, PL, CZ, ...)
- Signature-based digital confirmation (for federation-sanctioned matches)
- Athlete "follow" for spectators, ranking-movement notifications
- Multi-range organizations, recurring match templates
- Sync conflict inspection UI for Match Directors (MVP has conflict *detection + safe default*; Phase 2 adds the inspection/override UI)

### Future
- USPSA, IDPA, 2-Gun, 3-Gun, Steel Speed, national formats, PRS-style
- FORT Performance integration (weakness → drill linkage)
- Native app wrapper (if PWA limits are hit)
- Club payout/marketplace payments (Stripe Connect)
- Range/stage maps and in-venue navigation
- Federation-level certification/compliance features
- Public API for third-party stats tools

---

## 5. Information Architecture

### 5.1 Public/Athlete Web App (phone-first)
```
/ (discover matches)
/matches/:matchId                 → public match page (no auth)
  /leaderboard  /schedule  /stages/:stageId  /squads
/athletes/:athleteId              → public athlete profile
/login  /signup
/app (authenticated)
  /app/dashboard                  → "your matches" + FORT Athlete summary
  /app/profile                    → edit profile, stats, history
  /app/matches/:matchId           → personal match dashboard (rank, %, stage rank)
  /app/matches/:matchId/register  → registration flow
  /app/notifications
  /app/settings                   → privacy, data export/delete, language
```

### 5.2 Scoring PWA (tablet/phone, RO)
```
/score/login                      → match code + RO PIN (works offline once cached)
/score/squads                     → squad list for this match/stage assignment
/score/squads/:squadId/shooters   → shooter queue
/score/shooters/:id/stages/:id    → SCORE screen (the core loop, brief §8)
  → review → confirm → next shooter (no intermediate navigation)
/score/sync                       → sync status, pending events, conflicts (visible, not blocking)
```

### 5.3 Match Director Console (desktop-first)
```
/orgs/:orgId                      → org dashboard (matches, members, officials, ranges, stats)
/orgs/:orgId/ranges
/orgs/:orgId/matches/new          → guided match builder (§6.2 below)
/matches/:matchId/manage
  /overview                       → live progress monitor
  /divisions  /categories  /stages
  /registration  /waitlist  /fees
  /squads  /officials  /schedule
  /scoring/review                 → corrections, conflict inspection, audit trail
  /results                        → publish/unpublish, export
  /settings
```

**Why three separate IA trees instead of one nav shell with permission-based hiding:** each surface is optimized for a different job-to-be-done (brief §25 again). A single IA with conditional visibility tends to leak complexity across roles — an RO occasionally seeing MD-shaped navigation, or the MD console carrying scoring-loop constraints it doesn't need. Separate trees, sharing only the design system and API layer, keep each surface simple for its actual user.

---

## 6. Primary User Flows

### 6.1 Athlete: discover → register → compete → review
1. Browse/filter matches (public, no login required to *look*)
2. Open match page → view stages, fees, divisions, registration status
3. Log in / sign up (only required to act)
4. Select division + category → select/join squad → pay fee → registration = *pending* or *confirmed* depending on match settings
5. Receive match info & schedule as match approaches
6. Match day: follow live leaderboard, see own personal dashboard update stage-by-stage
7. Post-match: confirm/review own scores per stage as they're entered (if digital confirmation enabled for this match)
8. After match: results archived to competition history; statistics update

### 6.2 Match Director: create → run → publish
```
CREATE MATCH → RULESET → MATCH INFO → DIVISIONS → CATEGORIES → STAGES
→ REGISTRATION (fees, currency, open/close dates) → SQUADS → OFFICIALS
→ REVIEW → PUBLISH
```
Each step is independently saveable (draft state) — a Match Director does not lose a half-configured match by navigating away, and steps can be revisited non-linearly after the first pass (this deliberately breaks from being a rigid one-way wizard once the match exists as a draft).

During the match: **Overview** dashboard shows live progress (stages completed per squad, sync health across scoring devices, any flagged conflicts) — the MD's job during a live match is *monitoring*, not data entry, and the IA reflects that.

### 6.3 Range Officer: the scoring loop (verbatim from brief §8, this is intentionally rigid)
```
SQUAD → SHOOTER → STAGE → SCORE → REVIEW → SIGN/CONFIRM → NEXT SHOOTER
```
No menu navigation inside this loop. Back/undo is available (mis-taps happen), but there is no "home" button pulling the RO out of the loop mid-squad — leaving the loop is a deliberate action, not an accidental one.

### 6.4 Spectator: follow live, no account
1. Open match link (shared, or found via discovery) → immediately see live leaderboard, no gate
2. Filter by division/category/stage/squad
3. Search an athlete → see their live position and stage history for this match
4. (Phase 2) tap "follow" on an athlete → prompted to create an account only at that point (following requires persistence; watching doesn't)

**Why no-login is a hard requirement, not a nice-to-have:** brief §2/§10 both say this explicitly, and it's also a growth mechanic — a shared live-leaderboard link is the single biggest organic distribution channel a match has (family/friends sharing a link mid-match). Any login gate on that path directly reduces reach.

---

## 7. Rules-Engine Concept

### 7.1 Core abstraction

```typescript
interface Ruleset {
  id: string
  name: string
  version: string                 // semver; historical matches pin an exact version
  discipline: DisciplineId
  scoringType: ScoringMethod       // 'hit-factor' | 'time-plus' | 'fixed-time'
                                    // | 'points' | 'steel-time' | 'percentage' | 'custom'
  availableDivisions: DivisionDef[]
  availableCategories: CategoryDef[]
  targetTypes: TargetTypeDef[]
  penalties: PenaltyDef[]
  stageValidationRules: ValidationRule[]
  matchValidationRules: ValidationRule[]

  scoreCalculation(raw: RawStageScore, stage: StageDef): StageScore
  rankingCalculation(scores: StageScore[], scope: RankingScope): Ranking
  tieBreakerCalculation(tied: Ranking[]): Ranking
}
```

Each `scoringType` maps to a pure calculator function registered in a small internal registry — adding a new method (or a fully custom club-defined one, see §7.3) means adding a calculator, not touching UI or storage code.

### 7.2 Versioning — non-negotiable, and here's why

**Decision:** `Ruleset` is immutable once published; changes create a new `RulesetVersion`. A `Match` and every `Score`/`Result` derived within it store the exact `rulesetVersionId` used.

**Why:** federation rules genuinely change year to year (brief §4 says this explicitly), and match results are historical records — recomputing a 2026 match's standings under 2027's rules would silently rewrite history. This also solves a subtler problem: it lets the Match Director *test* a new ruleset version on a draft match without any risk of affecting any match already running or archived. Immutability + explicit versioning is what makes "never approximate competition scores" true over time, not just at a single point in time.

### 7.3 Custom Match Builder (brief §6)

Modeled as **club-authored `Ruleset` instances built through a configuration UI**, not a separate system. A club composes: scoring type (from the same enum above), target count, penalty values (miss/no-shoot/procedural in points or seconds), and a tie-break rule — the Match Builder simply writes a `Ruleset` + `RulesetVersion` row through the same engine IPSC uses.

**Why this matters architecturally:** if "custom rulesets" were a separate, simpler code path from "official IPSC rulesets," the engine wouldn't actually be ruleset-independent — it would be "IPSC-shaped, with a toy mode bolted on." Making club matches full citizens of the same engine is the real test of the "add rulesets without rewriting the core" requirement (brief §4), and it directly enables brief §6's example (FORT Speed Match) without any special-casing.

### 7.4 Where the engine runs

The engine ships as a standalone `@fort/rules-engine` TypeScript package with zero framework/DB dependencies. It is imported by:
- the backend (source of truth for official results),
- the Scoring PWA (compute score/hit-factor live, fully offline),
- the Match Director console (live preview while configuring a stage — "here's what a possible score would look like under this stage's config").

**Why one package, not reimplemented three times:** any divergence between the offline client's calculation and the server's calculation is a correctness bug that surfaces as "my hit factor was wrong on my phone during the match" — exactly the kind of trust-destroying failure a scoring platform cannot afford. A single, deterministically tested package eliminates the possibility of drift by construction rather than by discipline.

---

## 8. Database / Domain Model

Entity groups (relationships in prose below the list — a full ERD is Phase 3 per brief §27, this is the Phase-1-level shape):

**Identity**
`User` (auth identity) 1—1 `AthleteProfile` (competition-facing profile, stats cache)

**Organization**
`Organization` 1—N `OrganizationMember` (N—1 `User`, has `role`)
`Organization` 1—N `Range`

**Rules**
`Discipline` 1—N `Ruleset` 1—N `RulesetVersion` (immutable once published)

**Match**
`Organization` 1—N `Competition` (a "match"); `Competition` N—1 `RulesetVersion`, N—1 `Range`
`Competition` 1—N `Division`, 1—N `Category`, 1—N `Stage` (each `Stage` 1—N `TargetDefinition`)
`Competition` 1—N `Official` (N—1 `User` or device-scoped RO identity, has scoped `role`)

**Registration & Squadding**
`Competition` 1—N `Registration` (N—1 `AthleteProfile`, N—1 `Division`, N—1 `Category`, status: pending/waitlisted/confirmed/withdrawn)
`Registration` N—1 `Payment`
`Competition` 1—N `Squad` 1—N `SquadMember` (N—1 `Registration`)

**Scoring (event-sourced — see §9)**
`Stage` × `Registration` → conceptual "attempt", materialized through `ScoreEvent` (append-only, N—1 `Device`, N—1 `Official`)
`ScoreEvent` 1—N `Penalty` (embedded/linked)
`Score` = **derived**, latest-valid materialization of a `Registration`'s `ScoreEvent`s for a `Stage` (recomputable, not a second source of truth)
`Score` 1—N `ScoreConfirmation` (method, timestamp, confirming party)

**Results**
`Result` = derived per `(Competition, scope)` — recomputable from `Score` + `RulesetVersion.rankingCalculation()`. Stored as a cache for read performance, tagged with the `RulesetVersion` and calculation timestamp used to produce it, **not** hand-edited directly — corrections happen via a new `ScoreEvent` (correction type), never by mutating a stored `Result` row.

**Sync & Audit**
`Device` (registered per RO login), `SyncEvent` (upload batches, status), `AuditLog` (append-only, actor + action + before/after + timestamp, across all mutating operations — not just scoring)

### 8.1 The one modeling decision worth calling out explicitly: Score is derived, not stored-and-mutated

**Decision:** the durable, source-of-truth record is the **`ScoreEvent` log** (append-only). `Score` and `Result` are *materialized views* over that log, safe to recompute at any time.

**Why:** this is the direct consequence of two hard requirements in the brief that are in tension — "a score must never silently disappear or be overwritten" (§7) and "corrections must never silently replace the original score... maintain an audit trail" (§9). The only architecture that satisfies both simultaneously is event sourcing for scores: a correction is a *new event*, the old event is still there forever, and "what is the score right now" is a pure function over the event log. It also happens to be exactly what makes offline sync tractable (§9 below) — events are the natural unit to generate offline and merge later, whereas syncing mutable rows invites silent last-write-wins data loss, which is explicitly forbidden.

### 8.2 Avoiding duplicated derived values (brief §22 instruction)

Anything computable — `Result`, `AthleteProfile` statistics (avg %, A-zone %, etc.) — is treated as a cache with a clear recompute path, not hand-maintained in two places. The exception, made deliberately: **live leaderboard read models** in the Live & Public module are intentionally denormalized/precomputed for read speed during a live match (potentially thousands of concurrent spectator reads against a Realtime feed) — but they're regenerated from `Score`/`Result`, never independently edited. This is the one place "avoid duplicating derived values" is knowingly traded for read performance, and it's scoped narrowly on purpose.

---

## 9. Offline-First Synchronization Architecture

### 9.1 Model: local-first event log + append-only sync

1. Every scoring action on the RO device writes a `ScoreEvent` **immediately to local storage** (IndexedDB via a thin wrapper, or SQLite if a native/Capacitor shell is ever adopted) — the network is never in the critical path of "did the score save."
2. Each event carries: `eventId` (client-generated UUID, globally unique — never a server-assigned sequential ID, because the client can't know that until it's online), `deviceId`, `officialId`, `registrationId`, `stageId`, event type (`score_entered`, `score_corrected`, `score_confirmed`), payload, and a client timestamp.
3. A background sync process (Service Worker Background Sync where available, polling fallback otherwise) uploads queued events whenever connectivity exists — no user action required, but sync status is always visible on-screen (brief §7's "sync status indicators").
4. The server **appends** incoming events to the log; it never accepts an update-in-place. Two devices independently scoring the same shooter/stage (shouldn't happen operationally, but must not corrupt data if it does) both land as events; "what's the current score" is resolved by a deterministic rule (latest **confirmed** event wins by default; anything else is surfaced as a conflict).
5. Conflicts (e.g., two different confirmed scores for the same shooter/stage from two devices) are **never auto-discarded** — both events persist in the log; the derived `Score` is flagged `needsReview`, and the Match Director sees it in the conflict-inspection view (§4 promotes the full UI to Phase 2; MVP shows the flag and the two candidate values with a manual pick).

### 9.2 Why event sourcing rather than "sync the mutable row and resolve conflicts with a merge strategy"

A traditional offline-sync approach (e.g., last-write-wins on a mutable `scores` table, or CRDT merge of a score object) technically works for many domains, but fails the brief's explicit constraint that **a score must never silently disappear or be overwritten** and that corrections must be **auditable**. Last-write-wins, by definition, silently discards the losing write — precisely what's forbidden. A CRDT merge would need every field to have a sensible auto-merge semantic, which doesn't exist for "which of two different final hit-factor scores is correct" (that's a judgment call for a human, not a mergeable value). Event sourcing sidesteps the problem: nothing is ever overwritten, so there's no data-loss failure mode to design around — only a "which event is authoritative right now" question, which is explicitly surfaced rather than silently decided.

### 9.3 What ships at MVP vs Phase 2 (cross-ref §4)
- MVP: local-first write, background sync, append-only server log, deterministic default resolution (latest confirmed event), visible sync status, conflicts flagged and blocked from "official" publish until reviewed.
- Phase 2: full conflict-inspection UI for Match Directors, richer merge assistance (e.g., surfacing which RO/device entered which candidate value, side-by-side timeline).

---

## 10. Security & Permission Architecture

### 10.1 Layers
1. **Authentication** — Supabase Auth (or equivalent) issuing short-lived JWTs; RO device-scoped sessions are a separate, narrowly-scoped token type tied to a match + PIN, not a full user session (§2.4).
2. **Authorization — enforced at the database, not the client.** Postgres Row-Level Security (RLS) policies are the actual authorization boundary: every table's RLS policy encodes "who may read/write this row" based on `OrganizationMember.role`, match-scoped `Official.role`, and ownership (`AthleteProfile` owns its own `Registration`, etc.). The API/UI layer's role checks are a UX convenience (hide buttons the user can't use) — never the security boundary.
3. **Audit logging** — every mutating action on Organization, Match Config, Registration, Score, and Result tables writes an `AuditLog` row (actor, action, before/after, timestamp, device/IP where relevant). This is what makes score corrections and permission changes reviewable after the fact.
4. **Rate limiting** — on public endpoints (discovery, public match pages, athlete search) to prevent scraping/abuse without requiring login for legitimate spectators.
5. **Transport & storage** — TLS everywhere, encrypted at rest (default with managed Postgres), no plaintext credential storage (delegated entirely to the auth provider).

### 10.2 Why RLS specifically, and why "never trust client-side role checks" is enforced structurally, not just as a rule

Brief §21 states this as a principle; the concrete way to guarantee it (rather than hope every developer remembers it on every endpoint) is to make the database itself refuse unauthorized queries regardless of what the API layer does. With Postgres RLS, even a bug in application code that forgets a permission check cannot leak or corrupt data the requesting user isn't entitled to — the database is the last line of defense, not the API route. This is materially more robust than a purely application-level RBAC middleware, which fails silently if any single endpoint forgets to apply it.

### 10.3 Permission scopes (RBAC matrix, abbreviated)

| Role | Scope | Can do |
|---|---|---|
| Org Owner/Admin | Organization | Manage org, ranges, members, billing, create matches |
| Match Director | Match | Full match config, staff assignment, publish results, corrections |
| Range Master / CRO | Match | Monitor progress, resolve on-range disputes, limited config |
| Range Officer/Scorer | Match (device-scoped) | Enter/confirm scores for assigned squad/stage only |
| Stats Officer | Match | View/export results, no scoring or config rights |
| Athlete | Own data + public data | View/edit own profile & registrations, confirm own scores |
| Spectator | Public data only | Read-only, no account |
| Platform Admin | Platform (narrow, logged) | Support/abuse actions only, fully audited |

---

## 11. European Localization Considerations

- **Hosting & residency:** EU-region hosting (e.g., Supabase EU project / EU-based Postgres) to keep personal data in-region by default; matches brief §16.
- **GDPR mechanics as first-class features, not compliance afterthoughts:** self-service data export (JSON) and account deletion from `/app/settings`, configurable retention windows (e.g., how long device sync logs are kept), explicit consent capture at signup and at registration (fee payment involves a data controller relationship with the club, which needs its own clear consent).
- **i18n:** all UI strings externalized (ICU message format via `next-intl` or equivalent) from day one, even though only DE/EN ship at MVP — retrofitting i18n onto hard-coded strings later is expensive and error-prone, so the discipline starts now even for a two-language launch. English is the fallback locale everywhere, including for any as-yet-untranslated ruleset content (penalty names, division labels).
- **Formatting:** metric units, locale-aware date/time (day-month-year, 24h clock defaults for DE), per-organization timezone stored on `Range`/`Competition`, not inferred from the viewer.
- **Currency & VAT:** `Payment`/fee models carry an explicit currency (EUR/GBP/CHF/PLN/CZK/SEK/NOK/DKK at launch, extensible enum, not hard-coded) and a VAT-aware amount breakdown, because clubs across the EU/UK/CH have materially different VAT obligations on registration fees — building this in generically now avoids a fee-model rewrite when the first non-EUR club onboards.

---

## 12. Recommended Technology Stack

| Layer | Recommendation | Alternative considered |
|---|---|---|
| Frontend (all 3 surfaces) | TypeScript, React, Next.js (App Router) | — |
| Styling/design system | Tailwind + a dedicated FORT Competition component library (see §24) | — |
| Offline client storage | IndexedDB (via Dexie.js or similar) + Service Worker | SQLite via a native/Capacitor shell |
| Mobile scoring delivery | Installable PWA | React Native / Capacitor native wrapper |
| Backend | Supabase (managed Postgres + Auth + Realtime + Storage) | Self-hosted Postgres + custom API (Node/NestJS) |
| Rules engine | Standalone `@fort/rules-engine` TS package, framework-free | — |
| Live results transport | Supabase Realtime (Postgres logical replication → websocket) for leaderboard pushes | Polling; dedicated pub/sub (Redis/NATS) |
| Payments | Stripe (Checkout + multi-currency), EU VAT handling via Stripe Tax or equivalent | — |
| i18n | `next-intl` (ICU messages) | `react-i18next` |

### 12.1 PWA vs React Native — the evaluation the brief explicitly asked for

**Recommendation: PWA first, for the Scoring surface too.** Reasoning:
- The hard requirement is offline reliability + fast install + one codebase across phone/tablet. A modern PWA (Service Worker + IndexedDB + Background Sync API) meets this on Android and desktop Chrome/Edge cleanly.
- The real risk is **iOS Safari**, which has historically had weaker background sync support and more aggressive storage eviction for web apps not "installed" to the home screen. This is a genuine, named risk (§13) — not dismissed, but it doesn't yet justify a second codebase. Mitigations: require installation to home screen (which relaxes some Safari storage limits), keep the sync queue small and flush aggressively whenever the app is foregrounded (not solely relying on background sync), and pilot on real iOS hardware at real ranges before committing to MVP scope.
- A native/Capacitor wrapper becomes the right call the moment a *hardware* integration is required that the web platform genuinely can't do — the most likely trigger is **Bluetooth chrono/shot-timer integration** (brief §5 mentions chrono-related data), since Web Bluetooth support is inconsistent (notably absent on iOS Safari). That's a concrete, testable trigger condition, not a vague "native is more robust" preference — worth revisiting once chrono integration is actually scoped.

**Why not commit to React Native now "to be safe":** two codebases (web PWA for MD/athlete/spectator surfaces + RN for scoring) roughly doubles the frontend maintenance surface and splits the component library, for a benefit (native APIs) that isn't yet known to be necessary. Standard build-vs-buy-ahead-of-need trade-off — the brief itself says "evaluate whether... would provide meaningful advantages," and at this stage the honest answer is "not yet demonstrated, revisit if chrono/iOS testing proves otherwise."

### 12.2 Supabase — what it buys and what it risks

**Why Supabase for MVP:** it collapses auth, Postgres, row-level security, realtime subscriptions, and file storage into one operationally simple package — for a small team building a two-sided marketplace-shaped product (clubs + athletes) under real time pressure, this is a large speed advantage, and RLS specifically is *the* mechanism §10 depends on.

**The lock-in risk, and how the architecture avoids compounding it:** Supabase is "just Postgres" underneath, so the data layer is portable by construction. The risk is in *business logic* — if scoring/ranking/sync-resolution logic were written as Supabase Edge Functions, migrating off Supabase later would mean rewriting that logic, not just moving data. That's exactly why §7.4 insists the rules engine (and, similarly, the sync-resolution logic) live in a portable TypeScript service layer that merely *runs on* Supabase infrastructure (Edge Functions or a small Node service) rather than being written *in terms of* Supabase-specific APIs. This keeps the expensive-to-rebuild IP portable even though the operationally-convenient infra isn't.

---

## 13. Major Technical Risks

| Risk | Why it's real | Mitigation direction |
|---|---|---|
| **Offline sync correctness under real network conditions** | "Poor/no connectivity at ranges" is the normal case, not the edge case — this is the feature most likely to be under-tested until it fails on a real match day. | Event-sourced design (§9) removes the worst failure mode (silent overwrite) by construction; still needs extensive field testing with simulated flaky/zero connectivity before any sanctioned match relies on it. |
| **iOS Safari PWA limitations** | Background sync support and storage persistence are weaker/less predictable on iOS Safari than Android/Chrome. | Home-screen install requirement, aggressive foreground flush, real-device pilot before committing to PWA-only for iOS; native wrapper as fallback (§12.1). |
| **Deterministic scoring correctness across rulesets** | "Never approximate" is a hard requirement; a subtle bug in a tie-break or hit-factor calculation is a credibility-ending bug for a scoring platform. | Rules engine as isolated, pure, exhaustively unit-tested package (§7.4); golden-file tests against known real match results before launch. |
| **Realtime scale during live matches** | A popular match's public leaderboard could see a spike of concurrent spectators during peak stage completion. | Denormalized read models for the live leaderboard (§8.2), CDN/edge caching for public pages, load-test before first large (Level III+) match. |
| **Multi-tenant data isolation** | Many clubs, many matches, one database — a bug here isn't a UX bug, it's a data-leak incident. | RLS as the enforced boundary (§10.2), not just tested policy — plus automated tests that assert cross-tenant queries fail. |
| **Conflict resolution UX under real pressure** | A flagged score conflict during a live, time-pressured match is a stressful moment for a Match Director; a confusing resolution UI causes real harm (wrong result published). | MVP ships a conservative default (block publish, require manual pick) rather than a clever but unproven auto-merge; refine UX in Phase 2 with real MD feedback. |

## 14. Major Product Risks

| Risk | Why it's real | Mitigation direction |
|---|---|---|
| **Trust/liability for official results** | Once a club uses FORT Competition for a sanctioned match, "the software got the score wrong" is a real dispute scenario with real consequences (rankings, qualification). | Full audit trail + immutable event log means every dispute is answerable with data, not "we think it's right"; conservative rollout (unofficial/club matches first, sanctioned matches after track record). |
| **Two-sided adoption (clubs vs. athletes)** | A match platform is worthless to athletes with no matches on it, and worthless to clubs with no athletes using it — classic chicken-and-egg. | Launch by directly onboarding a small number of design-partner clubs (white-glove), not a self-serve cold launch; the public/no-login live page (brief §10) is deliberately the growth lever — spectators become athletes/clubs without ever needing an account first. |
| **Displacing an entrenched, free incumbent (PractiScore)** | PractiScore is free, known, and "good enough" for many ROs who are resistant to change on match day specifically — the worst place to introduce friction. | Differentiate on what PractiScore structurally can't easily match (modern UX, live spectator experience, cross-match athlete analytics, ecosystem tie-in — §15 below) rather than competing on feature parity alone. |
| **Federation/sanctioning requirements outpacing the product** | IPSC/national federations may have specific certification or signature requirements for official results that aren't fully known yet. | Assumption A3 flags this explicitly; keep confirmation/signature mechanism pluggable per match rather than hard-coded, so a stricter mode can be turned on per federation without a redesign. |
| **RO change resistance / training cost** | ROs are volunteers under time pressure; a new tool that's even slightly slower than muscle-memory PractiScore workflows will be rejected on the range regardless of other merits. | The rigid, no-menu scoring loop (§6.3) is designed specifically to beat PractiScore on speed, not just aesthetics — validate this with real ROs (usability testing with a stopwatch) before broad rollout. |

---

## 15. Where FORT Competition Can Meaningfully Outperform PractiScore

Not "nicer UI" — structural advantages:

1. **Live spectator experience as a first-class product**, not an afterthought export — no-login live pages, personal match dashboards, ranking-movement feedback (brief §10/§11) turn a match into something friends/family actually follow, which PractiScore's results-export model doesn't provide.
2. **Cross-match athlete identity and analytics** — PractiScore results live per-match; FORT Athlete accumulates statistics, trends, and derived (real, not fabricated) insights across a competitor's whole career (brief §12/§13).
3. **A genuinely generic, versioned rules engine** with a no-code custom match builder — clubs can invent a scoring format without anyone writing code, and every ruleset (official or custom) gets the same offline/sync/audit guarantees, not a second-class path.
4. **Offline sync built around an immutable audit trail from day one**, not bolted on — "a score must never silently disappear" is a design constraint baked into the data model (event sourcing), not a policy someone has to remember to follow.
5. **Ecosystem connection to training (FORT Performance)** — turning a competition weakness into a concrete next training action is something no existing competition platform offers, because none of them are part of a training ecosystem.
6. **Mobile-first, tap-minimized UX** purpose-built for outdoor tablet use, evaluated against modern consumer sports-app UX bars (Strava, Garmin, F1 timing) rather than legacy desktop match-management software conventions.

---

## 16. Recommended Development Sequence

Maps the brief's §27 phases to concrete milestones. Each phase gates the next — no phase starts before the prior is reviewed, per brief §27/§30.

1. **Phase 1 (this document)** — product spec, domain model, rules-engine concept, sync strategy, permission model. *→ awaiting review before proceeding.*
2. **Phase 2 — User flows.** Detailed flow diagrams (not just the text flows in §6) for Athlete, RO, Match Director, Spectator, including error/edge paths (registration full, payment failure, sync conflict, score correction after confirmation).
3. **Phase 3 — Database schema.** Full ERD and migration plan from the domain model in §8, including RLS policy design per table.
4. **Phase 4 — Application architecture.** Concrete module boundaries in code, API contracts between modules, the `@fort/rules-engine` package interface finalized and unit-test plan written before implementation.
5. **Phase 5 — Design system.** Component library per brief §24 (tokens, buttons, cards, score controls, leaderboards, etc.), built and reviewed across the three device modes (§25) before any full screens are built on top of it.
6. **Phase 6 — Clickable prototypes.** High-fidelity, non-functional screens for the four core flows (§6), specifically usability-tested for the RO scoring loop (speed is the metric that matters most here) before real implementation begins.
7. **Phase 7 — MVP implementation, incremental.** Suggested internal sequence (not a rigid waterfall — modules can parallelize once schema/API contracts from Phase 3–4 are fixed):
   1. Identity/Org/Range (foundation everything else depends on)
   2. Rules engine + IPSC Handgun + Custom ruleset (the highest-risk, highest-value module — validate it early)
   3. Match Builder (depends on rules engine)
   4. Registration/Squadding/Payments
   5. Scoring PWA + offline sync (start early in parallel with #3/#4 once the rules engine is stable — this is the longest-pole item given field-testing needs)
   6. Results calculation + Match Director monitoring
   7. Public live pages + personal dashboard
   8. i18n pass (DE/EN), GDPR flows
   9. Field pilot with a real design-partner club match before broader rollout

**Why this order specifically:** the rules engine and the offline scoring path are simultaneously the riskiest and most differentiating pieces of the whole product (per §13/§15) — sequencing them early, in parallel with the more conventional CRUD modules (org/registration/squadding), means the two things most likely to reveal a fundamental design problem get tested against reality well before the team is deep into building everything downstream of them.

---

## Summary — what needs a decision before Phase 2

Everything in §0 (Assumptions), but especially:
- **A3** (signature/legal confirmation requirements) — affects whether Phase 7's scoring module needs signature capture at MVP or Phase 2.
- **A6** (which rulesets ship at MVP — Handgun + Custom only, or also PCC) — affects rules-engine test scope.
- **A7/A8** (Supabase + PWA-first) — affects the entire Phase 4 architecture; worth explicit sign-off since it's the costliest thing to reverse later.

Happy to go deeper on any single section (e.g., a full ERD, or the detailed RO-flow diagrams for Phase 2) once you've had a chance to react to this.
