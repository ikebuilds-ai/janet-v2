# Janet v2 — Queensland Family Holiday Budget Builder

> 🔑 Keywords: `Janet`, `Janet v2`, `holiday builder`, `family holiday`, `Queensland`, `budget builder`, `travel agent`, `deterministic engine`, `Next.js`, `static export`

## What It Is

Janet is a **dead-simple, deterministic family holiday budget builder** for Queensland, Australia. No AI hallucination, no dynamic pricing, no accounts, no backend.

- Family enters: budget, dates, crew size, transport mode, destination(s)
- Janet returns: **3 complete holiday packages** (Best Value, Maximum Fun, Resort & Relax)
- Each package shows: accommodation, activities, day-by-day itinerary, dining suggestions, supermarkets, total cost with buffer
- **5 hotels per strategy** — 1 featured + 4 alternatives with numbered cards
- **Shareable URLs** — copy and paste into family group chat

## Tagline

**"Don't stress, darl — Janet's on it."**

## Live URL

`https://janet.erosium.com.au`

## Tech Stack

- **Next.js 15** + TypeScript + Tailwind CSS
- **Static export** — pure HTML/JS, no server needed
- **Deterministic engine** — same input always produces identical output
- **No AI pricing** — all prices from JSON data, never invented
- **No backend** — budget engine runs client-side, URLs encode plan in query params

## Data Coverage

| Destination | Properties | Activities |
|---|---|---|
| Gold Coast | 27 | 30+ |
| Sunshine Coast | 18 | 30+ |
| Brisbane | 17 | 20+ |
| Noosa | 11 | 15+ |
| Sunshine Coast Hinterland | 9 | 10+ |

## Fork Janet For Your Own City

Janet is designed to be forked.

Add your own accommodation, activities, dining, supermarket, season, and transport data in `/data`. The engine will generate holiday packages from your local catalogue.

The key idea is simple: keep the recommendations deterministic and human-checkable. No invented hotel prices, no fake live availability, no backend required.

## Architecture

```
Form (page.tsx) → GET redirect → Results (results/page.tsx)
                              ↓
                     BudgetEngine.buildPackagesV2(input)
                              ↓
                     3 deterministic HolidayPackage objects
                              ↓
                     Render with AccommodationAlternatives grid
```

All prices are estimates as at July 2026. Users tap hotel/activity names to check live prices.

## Deployment

Static export to `dist/` → served by nginx container on Hostinger VPS (`janet.erosium.com.au`).

See `DEPLOY_v2_UI_FIX.md` for current deploy command.

## Project Origin

Built in a single focused session on 2026-07-12 by Ike + Erosium. Started as an experimental side project, proved functional and fun. Kept as a standalone mini-app under Erosium.

---
