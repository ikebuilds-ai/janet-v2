> 🔑 Keywords: `Janet v2`, `build plan v2`, `multi-destination`, `date selection`, `seasonal pricing`, `Sunshine Coast`, `Brisbane`, `Noosa`, `hinterland`, `transport legs`, `implementation plan`, `model routing`

# JANET V2 BUILD PLAN — Dates, Seasons, New Regions, Multi-Destination
**Planned by:** Fable 5 (Eros) — 2026-07-12 12:04 AEST
**Implements on:** cheap lanes (/coder, /quickcode, /daily) per phase routing below
**Baseline:** Janet v1 LIVE at https://janet.erosium.com.au (checkpoint CHECKPOINT_PHASE4_JANET_DEPLOYED_2026-07-12.md)

---

## 0. Design Principles (unchanged from v1 — sacred)

1. **Budget correctness is sacred** — every package total ≤ family budget, verified by tests
2. **Deterministic** — same input = same output, always
3. **No AI pricing hallucination** — all prices from JSON, seasonal multipliers from JSON
4. **Static export** — no backend, no DB, shareable URLs
5. **Curated data** — estimates clearly labelled with generated-on date

---

## 1. Feature Breakdown

### F1 — Date Selection + Seasonal Pricing
**What:** User picks a travel start date (+ nights, already exists). Prices adjust by season band.

**Data model (new file `data/seasons.json`):**
```json
{
  "generatedOn": "2026-07-12",
  "bands": [
    { "id": "peak",     "label": "Peak (school holidays / events)", "accomMultiplier": 1.35, "activityMultiplier": 1.0 },
    { "id": "shoulder", "label": "Shoulder", "accomMultiplier": 1.10, "activityMultiplier": 1.0 },
    { "id": "offpeak",  "label": "Off-peak", "accomMultiplier": 0.90, "activityMultiplier": 1.0 }
  ],
  "calendar": [
    { "from": "2026-06-27", "to": "2026-07-12", "band": "peak",     "reason": "QLD winter school holidays" },
    { "from": "2026-09-19", "to": "2026-10-05", "band": "peak",     "reason": "QLD spring school holidays" },
    { "from": "2026-12-12", "to": "2027-01-26", "band": "peak",     "reason": "Summer/Christmas holidays" },
    { "from": "2027-04-01", "to": "2027-04-19", "band": "peak",     "reason": "Easter + autumn holidays" },
    { "from": "2026-07-13", "to": "2026-08-31", "band": "offpeak",  "reason": "Winter term time" },
    { "from": "2026-10-26", "to": "2026-12-11", "band": "shoulder", "reason": "Pre-Christmas term" }
  ],
  "defaultBand": "shoulder"
}
```
- Rule: date lookup → band → multiply nightly accommodation rate. Activities stay flat (theme park tickets don't really change), transport flat.
- QLD school holiday dates are public and stable — curate 18 months ahead.
- If date outside calendar entries → `defaultBand` (shoulder) + warning string in output.
- Engine already returns `warnings[]` — reuse it: "Prices estimated at shoulder-season rates."
- **UI:** date input (native `<input type="date">`, mobile-friendly), band shown on results ("Peak season pricing applied — school holidays").
- **No date = allowed.** Date optional; fallback shoulder band keeps v1 behaviour intact.

### F2 — New Regions (Sunshine Coast, Brisbane, Noosa, Hinterland)
**What:** Same catalogue structure, 4 new destination datasets.

**Data restructure:** move from flat GC files to per-destination folders:
```
data/
  seasons.json
  transport-legs.json
  destinations/
    gold-coast/        (existing 5 files move here)
      accommodation.json activities.json dining.json region.json supermarkets.json
    sunshine-coast/    (NEW — ~12 accom, 20 activities, 20 dining, 12 supermarkets)
    brisbane/          (NEW — ~12 accom, 20 activities, 20 dining, 12 supermarkets)
    noosa/             (NEW — ~8 accom, 12 activities, 15 dining, 8 supermarkets)
    hinterland/        (NEW — Maleny/Montville/Mapleton — ~8 accom, 12 activities, 12 dining, 6 supermarkets)
```
- Noosa is technically Sunshine Coast but families treat it as its own destination — keep separate (matches how Ike/Leanne think).
- Hinterland = Sunshine Coast hinterland (Maleny, Montville, Glass House Mountains). Distinct vibe: cabins, lookouts, food trails.
- Each destination's `region.json` gains `destinationId`, `displayName`, `heroTagline`.
- **Curation effort is the long pole:** ~180 new entries. Research done by cheap models with the same quality bar as v1 (real venues, estimate prices, price bands, generated-on date).

### F3 — Multi-Destination Trips (max 2 legs for v2)
**What:** Optional second destination. Trip = leg 1 (dest + nights) + leg 2 (dest + nights) + transport between.

**Input model change:**
```ts
interface TripLeg { destinationId: string; nights: number; }
interface BuilderInput {
  legs: TripLeg[];            // 1 or 2 legs (v2 cap: 2)
  startDate?: string;          // ISO date, optional (F1)
  // ...existing: budget, adults, kids, kidAges, prefs...
}
```

**New file `data/transport-legs.json`** — curated inter-destination transport:
```json
{
  "legs": [
    { "from": "gold-coast", "to": "brisbane",
      "options": [
        { "mode": "own-car", "costEstimate": 25, "durationMin": 75, "note": "Fuel + tolls, M1 north" },
        { "mode": "train", "costEstimate": 40, "perPerson": true, "kidDiscount": 0.5, "durationMin": 95, "note": "G:link + Gold Coast line" },
        { "mode": "bus", "costEstimate": 30, "perPerson": true, "kidDiscount": 0.5, "durationMin": 110, "note": "Coach/TransLink connector" }
      ] },
    { "from": "gold-coast", "to": "sunshine-coast", "options": [ ... ] },
    { "from": "brisbane", "to": "noosa", "options": [ ... ] },
    ...all pairs among 5 destinations (10 pairs, symmetric costs)...
  ]
}
```

**Engine changes (`budget-engine.ts`):**
1. `buildPackages(input)` becomes leg-aware:
   - Split effective budget across legs **proportionally by nights** (5 nights GC + 3 nights BNE = 62.5%/37.5%) after reserving the inter-leg transport cost off the top.
   - Run existing single-destination allocation per leg with its share.
   - Merge: `HolidayPackage` gains `legs: PackageLeg[]` where each leg = { destination, accommodation, days, dining, supermarkets } plus a `transfer` block between legs.
   - Strategy consistency: Best Value picks cheapest transport option; Fun/Relax pick own-car by default (flexibility) unless family is flying in (then train/shuttle).
2. Seasonal multiplier applied at nightly-rate lookup (F1) — date advances across legs (leg 2 start = startDate + leg1 nights), so a trip straddling school-holiday boundaries prices each leg's nights correctly. **Per-night band resolution** (not per-leg) — accurate and still trivial in code.
3. Guarantee unchanged: sum of all legs + transfer ≤ totalBudget, by construction.
4. Single-leg input (legs.length === 1) must produce **identical results to v1** — regression tests lock this.

**UI changes:**
- Form: destination dropdown for leg 1 + nights; "+ Add a second stop" button reveals leg 2 (destination + nights). Date picker at top (F1).
- Results: itinerary shows Leg 1 days → "🚗 Travel day: Gold Coast → Brisbane (1h 15m, ~$25)" → Leg 2 days.
- Share URL: encode legs as `legs=gold-coast:5,brisbane:3&date=2026-09-22` — stays GET-param shareable.

---

## 2. What We Are NOT Doing in v2 (scope fence)

- ❌ 3+ legs (engine designed for N, UI capped at 2 — expansion is config, not rework)
- ❌ Live pricing APIs / scraping — still curated estimates
- ❌ Flights between legs (all 5 destinations are drivable; flying is only an arrival mode)
- ❌ Accounts, saved trips, feedback form (v3 candidates)
- ❌ Exact per-property seasonal rates — one multiplier per band, honest "estimate" labelling

---

## 3. Implementation Phases + Model Routing

**Total estimate: ~10–13 focused hours across phases. Fable 5 only plans/audits (this doc + final audit). All build work on cheap lanes.**

### Phase A — Data schema + seasons (2h) — `/quickcode` (kimi-k2.7-code)
1. Restructure `data/` into `destinations/gold-coast/` (move, no content change)
2. Write `seasons.json` (QLD school holiday calendar 2026-07 → 2027-12 — verify dates via web search first)
3. Write `transport-legs.json` (10 pairs, own-car + train/shuttle options, curated estimates)
4. Update `catalogue.ts` loader: `loadDestination(id)` + `loadSeasons()` + `loadTransport()`
5. **Gate:** `npx next build` still compiles; v1 tests still 20/20 green

### Phase B — Catalogue research: 4 new destinations (3–4h) — `/daily` (kimi-k2.6) with web search
1. Sunshine Coast: ~64 entries | 2. Brisbane: ~64 | 3. Noosa: ~43 | 4. Hinterland: ~38
2. Same quality bar as v1: real venues, current estimate prices, area tags, price bands
3. **Gate:** JSON validates against existing TS interfaces; spot-check 10 venues per destination are real

### Phase C — Engine v2 (3h) — `/coder` (gpt-5.3-codex — this is the hard one)
1. `TripLeg[]` input, budget split by nights after transport reservation
2. Per-night seasonal band resolution across leg boundaries
3. Transport option selection per strategy
4. Merged `HolidayPackage.legs[]` output shape
5. **Tests:** keep all 20 v1 tests passing on single-leg inputs (regression lock) + ~15 new tests: two-leg splits, budget guarantee with transfer, peak/off-peak boundary straddle, tiny budget two-leg infeasibility, determinism, date-less fallback
6. **Gate:** 35/35 tests green

### Phase D — UI v2 (2–3h) — `/quickcode`
1. Date picker + second-destination reveal on form
2. Legs + travel-day block on results; season band badge
3. Share-URL encode/decode for legs + date
4. **Gate:** build compiles; manual URL round-trip test; mobile check

### Phase E — Deploy + audit (1h) — `/daily` build+deploy, **Fable 5 one read-only audit**
1. `npx next build` → copy dist to `/var/www/janet/` via docker cp lane (now proven)
2. Container restart (config already mounted — no infra change needed)
3. Fable 5 audit: budget-guarantee code path, seasonal math, URL parsing edge cases
4. Ike + Leanne live test (the real QA department)
5. Checkpoint file + memory + keyword index

### Rollback safety
- v1 `dist/` backed up on host before Phase E copy (`/var/www/janet-v1-backup/`)
- Single-leg regression tests guarantee v1 behaviour survives inside v2

---

## 4. Cost Estimate (build)

| Phase | Model | Est. tokens | Est. cost |
|---|---|---|---|
| A | kimi-k2.7-code | ~150K | ~$0.15 |
| B | kimi-k2.6 + search | ~400K | ~$0.40 |
| C | gpt-5.3-codex | ~250K | ~$1.20 |
| D | kimi-k2.7-code | ~200K | ~$0.20 |
| E | kimi + Fable 5 audit | ~80K + 30K | ~$0.65 |
| **Total** | | | **~$2.60** |

Hosting cost delta: $0 (same container, same box).

---

## 5. Founder Answers — LOCKED 2026-07-12 12:09 AEST

1. **Leg cap:** 2 destinations max for v2 ✅
2. **Transport modes:** own-car + train + shuttle + **BUS** (Ike: bus links a lot of QLD train/shuttle together — required mode) ✅
3. **Date optional:** Option 2 approved — no date = mid-season (shoulder) estimate with visible note: "Prices are mid-season estimates — pick your dates for a sharper number." ✅
4. **Dropdown names:** "Sunshine Coast" and "Sunshine Coast Hinterland" as separate destinations ✅
