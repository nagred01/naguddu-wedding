# Connect RSVPs, photo uploads and the AI assistant

One Google Apps Script handles all three. About 15 minutes, done once, in the Google account
that should own the replies and photos.

## 1. Create the Sheet
1. Go to sheets.google.com and create a blank spreadsheet named something like **Wedding RSVPs**.
2. Don't share it with anyone except whoever should see replies.

## 2. Add the script
1. In the Sheet: **Extensions → Apps Script**.
2. Delete the sample code, paste in everything from `apps-script/Code.gs`, and click **Save**.

## 3. Add the Claude API key (for the AI assistant)
1. Create a key at console.anthropic.com → **API keys**. While you're there, set a monthly
   spend limit under **Billing → Limits** (for example $10), so the cost can never run away.
2. In Apps Script: **Project Settings** (gear icon) → **Script properties** → **Add script property**.
   Property: `ANTHROPIC_API_KEY`. Value: your key. **Save**.
   The key stays in your Google account; it is never in the website.

Skip this step if you don't want the AI assistant: the quick-question buttons still work, and typed
questions get a polite "ask the family" reply.

## 4. Publish it as a web app
1. Click **Deploy → New deployment** → gear next to "Select type" → **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**.
   ("Anyone" only lets guests *send* things. They can't see the Sheet, the photos or each other.)
3. Click **Deploy**, then **Authorize access** and allow it. Google asks for Sheets, Drive and
   "connect to an external service" (that's the call to Claude).
   If Google warns the app isn't verified (it's your own script): **Advanced → Go to (project name)**.
4. Copy the **Web app URL**. It ends in `/exec`.

## 5. Put the URL in the website
1. Open `src/config.ts` and paste the URL between the quotes:
   `export const SCRIPT_URL = 'https://script.google.com/macros/s/…/exec';`
2. Rebuild: in this folder run `node build.mjs`, then publish the new `dist` folder.

## 6. Test from your phone
- **RSVP:** send one. A tab called **RSVPs** appears in the Sheet with one row per event.
- **Photos:** upload one. A folder called **Wedding guest photos** appears in your Google Drive.
  Files are named with the date and the guest's name.
- **Assistant:** ask "What should I wear to the wedding?" and check the answer.

Delete your test rows and photos afterwards.

## Good to know
- **Changed RSVPs:** sending again adds new rows. Rows from one send share a Reply ID; use the latest per name.
- **Guest totals:** for example `=SUMIFS(RSVPs!F:F, RSVPs!D:D, "Wedding", RSVPs!E:E, "Yes")`.
- **Photos:** resized on the guest's phone to 2560 px on the long side (good for prints), up to 30 per batch.
  Only photos, not videos.
- **Assistant cost:** it uses Claude Haiku 5.5 ($0.10 per million input tokens, $0.50 per million output).
  Each question costs a small fraction of a cent; even 1,000 questions stay under about $1.
  Limits built in: 30 questions per guest every 6 hours, 300 per hour in total.
- **What the assistant knows:** only the `WEDDING_FACTS` block at the top of `Code.gs`. If a detail
  changes (a time, a hotel, a booking code), edit it there.
- **After any change to `Code.gs`:** **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**,
  so the URL stays the same.
- **Spam:** forms have a hidden field that bots fill in, and those are skipped. Anyone with the link could
  still send a fake reply or photo, so glance over things before final counts.
