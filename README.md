# Bhavitha & Nagender wedding website (#NaGuddu)

Wedding events website: Haldi, Mehendi, Pellikuthuru / Pellikoduku (Dec 1–2, Anna, TX), Wedding (Dec 3, Aubrey, TX) and Cocktail party (Dec 4, Fairview, TX). English and Telugu.

## What's in it
- **Pages:** invitation home page with countdown, one page per event (date, time, venue, dress code, Open in Maps), All Events itinerary, RSVP, photo uploads.
- **RSVP:** per-event replies with guest count and meal choice, saved to a private Google Sheet.
- **Photos:** guests upload pictures to a private Google Drive folder.
- **Wedding assistant:** quick answers plus free-form questions answered by Claude Haiku from the facts in `apps-script/Code.gs`.
- **Style:** Cinzel for titles, labels and buttons; Georgia for reading text; Telugu uses a Telugu serif.

RSVPs, photos and the assistant all go through one Google Apps Script (`apps-script/Code.gs`). Its web app URL is set in `src/config.ts`; setup steps are in `apps-script/SETUP.md`. The Claude API key is stored only in the script's properties, never in this repository.

## Build and preview
Requires Node.js 20 or newer.

```bash
npm ci
node build.mjs
```

The site is built into `dist/` (serve it with any static server). The build also writes `Wedding-Invitation.html`, a single-file offline copy with embedded media.

## Publishing
Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).

## Editing common details
- Event dates, times, venues, addresses, dress codes, hotels: `src/i18n.ts`
- What the assistant knows: `WEDDING_FACTS` in `apps-script/Code.gs` (then redeploy the script as a new version)
- Hotel notes: `hotels.md`
