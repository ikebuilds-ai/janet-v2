# Janet v2 Build — Post-Deploy UI Fix

> 🔑 Keywords: `Janet v2`, `UI fix`, `5 hotels`, `alternatives grid`, `deploy ready`, `2026-07-12`

**Date:** 2026-07-12 ~16:45 AEST
**Status:** ✅ Build clean | ✅ Tests green | ⏳ Deploy pending (run command from Mac)

## What Changed

### UI Fix — Prominent "All 5 Picks" Display (7 edits in `results/page.tsx`)
1. **Redesigned `AccommodationAlternatives`** — was subtle "Other great options" text list → now **bold card grid** with:
   - "🏨 All 5 Picks for [Strategy]" heading (ocean blue)
   - Numbered circle badges (2, 3, 4, 5) on each hotel
   - 2-column responsive grid on desktop, 1-column mobile
   - White cards with hover border effect
   - Hotel name as linked text (↗ external), area subtitle, price
   - `strategyLabel` prop passed through component chain

2. **Wired `strategyLabel` prop chain**:
   - `PackageCard` → extracts `strategyLabel` from `STRATEGY_LABELS[pkg.strategy]`
   - Passes to `AccommodationAlternatives` (single-leg path)
   - Passes to `LegSection` (multi-leg path, both legs)
   - `LegSection` → passes to its `AccommodationAlternatives`

### Brisbane Data Fix
- `rydges-south-bank`: removed incorrect `"beachfront"` (it's a city hotel on the river at South Bank), added `"cityViews"`

## Build Verification
```
npx next build                 ✅ Static export, 3 pages, ~2.2MB
node --test budget-engine      ✅ All 27 tests green
```

## Deploy Command (run from MacBook Air)

```bash
ssh erosium-vps "docker cp \$(docker ps -q -f name=openclaw):/data/.openclaw/workspace/PROJECTS/gc-holiday-builder/dist/. /var/www/janet/ && docker restart janet"
```

## After Deploy — Ike's QA Checklist
1. **Hard refresh** in browser (Ctrl+Shift+R or Cmd+Shift+R) — static assets cached
2. Open `https://janet.erosium.com.au`
3. Enter any budget (e.g. $3,000, 2 adults, 2 kids, 5 nights Gold Coast)
4. Click through all 3 strategy tabs
5. **Verify:** Under each featured hotel, you see "🏨 All 5 Picks for [Best Value / Maximum Fun / Resort & Relax]" with 4 numbered cards (hotels #2–#5)
6. Try a 2-destination trip (e.g. Gold Coast + Brisbane) — verify both legs show their 5 picks
7. **Test a Brisbane package** — confirm Rydges South Bank doesn't show "beachfront" tag

## Known Remaining Work
- **~47 broken URLs** across all 5 destinations (from earlier health scan). Not blocking deploy — links gracefully 404, and disclaimer already says "tap to check live prices." Batch fix next session.
- Noosa and Hinterland accommodation counts are light (11 and 9) — consider more properties if testing shows thin results

---
