# Janet v2 Deploy Command (Post-UI-Fix)

## Status
- Build: ✅ CLEAN — `npx next build` static export succeeded
- Tests: ✅ 27/27 green
- Changes: Prominent "All 5 Picks" card grid + numbered badges + strategy labels
- Brisbane: Fixed `rydges-south-bank` (removed `beachfront`, added `cityViews`)

## Deploy Command (run from Mac)

```bash
ssh erosium-vps "docker cp \$(docker ps -q -f name=openclaw):/data/.openclaw/workspace/PROJECTS/gc-holiday-builder/dist/. /var/www/janet/ && docker restart janet"
```

## After Deploy

1. **Hard refresh** in browser — old static assets are cached
2. Verify at `https://janet.erosium.com.au`
3. Check all 5 destinations show "🏨 All 5 Picks for [Strategy]" cards under each featured hotel
