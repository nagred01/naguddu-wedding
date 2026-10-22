/**
 * Backend for the Bhavitha & Nagender wedding website. One web app handles:
 *   - RSVPs        -> rows in the "RSVPs" tab of this Sheet
 *   - Guest photos -> files in a private Google Drive folder
 *   - Assistant    -> answers from Claude, grounded in WEDDING_FACTS below
 *
 * Paste into the Apps Script editor of the private RSVP Google Sheet (Extensions > Apps Script)
 * and deploy as a web app. See SETUP.md.
 */

var SHEET_NAME = 'RSVPs';
var HEADERS = ['Submitted at', 'Reply ID', 'Name', 'Event', 'Attending', 'Guests', 'Meal', 'Language'];
var EVENTS = ['Haldi', 'Mehendi', 'Pellikuthuru / Pellikoduku', 'Wedding', 'Cocktail'];
var MEALS = ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Jain', ''];

var PHOTO_FOLDER_NAME = 'Wedding guest photos';
var PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
var PHOTO_MAX_BYTES = 15 * 1024 * 1024;

var CLAUDE_MODEL = 'claude-haiku-5-5';
var CHAT_PER_GUEST = 30;     // questions per guest every 6 hours
var CHAT_PER_HOUR = 300;     // questions from everyone per hour
var CHAT_MAX_CHARS = 600;
var CHAT_MAX_TURNS = 10;

// Everything the assistant knows. Edit this when details change, then redeploy (new version).
var WEDDING_FACTS = [
  'Couple: Bhavitha (bride) and Nagender (groom). Wedding hashtag: #NaGuddu. All times are US Central time, Texas.',
  '',
  'EVENTS',
  '1. Haldi (Pasupu): Tuesday, December 1, 2026, 9:30 AM. Serengeti Events (Airbnb), 6147 FM 455, Anna, TX 75409. Turmeric, laughter and the first blessings of the wedding week. Followed by lunch. Dress code: shades of yellow.',
  '2. Mehendi: Tuesday, December 1, 2026, 4:00 PM. Serengeti Events (Airbnb), 6147 FM 455, Anna, TX 75409. Henna, music and an evening with family and friends. Followed by dinner. Dress code: green or colorful Indian wear.',
  '3. Pellikuthuru / Pellikoduku: Wednesday, December 2, 2026, 10:00 AM. Serengeti Events (Airbnb), 6147 FM 455, Anna, TX 75409. The traditional blessing ceremony for the bride and groom before the wedding, with turmeric, oil and the elders\' blessings. Followed by lunch. Dress code: traditional wear, your finest Indian traditional outfits.',
  '4. Wedding: Thursday, December 3, 2026, 9:00 AM Muhurtham. Bella Cavalli Events, 1651 W Sherman Dr, Aubrey, TX 76227. Seven steps, one promise, and your blessings. Followed by lunch. Dress code: traditional, South Indian style: silk sarees, dhoti or kurta.',
  '5. Cocktail party, "A Night under the Stars": Friday, December 4, 2026, 6:00 PM. The Meridian Venue, 351 Southwind Ln, Fairview, TX 75069. Drinks and dinner to celebrate the newlyweds. Dress code: formal or Indian festive wear; statement lehengas, sharp suits, bring on the Desi bling.',
  '',
  'GETTING THERE',
  '- Every venue has plenty of on-site parking.',
  '- Each event page on the website has an "Open in Maps" button.',
  '- McKinney, TX sits between all three venues and is the easiest place to stay.',
  '',
  'RECOMMENDED HOTELS (no group rate or booking code yet; guests book on their own)',
  '- Sheraton McKinney Hotel, 1900 Gateway Blvd, McKinney, TX 75069. Closest to the Cocktail venue.',
  '- Hampton Inn & Suites McKinney, 2008 N Central Expy, McKinney, TX 75069. On US-75, easy drive to Anna.',
  '- Fairfield Inn & Suites Dallas McKinney, 1600 Hardin Blvd, McKinney, TX 75071. North McKinney, toward Anna.',
  '- Holiday Inn Express & Suites McKinney - Frisco East, 6601 Henneman Way, McKinney, TX 75070. West McKinney, toward Aubrey.',
  '- Holiday Inn Express & Suites Prosper, 1100 Mahard Pkwy, Prosper, TX 75078. Closest to the Wedding venue.',
  '',
  'ON THE WEBSITE',
  '- RSVP: tap RSVP in the top bar, enter your name, answer for each event (with number of guests and meal choice), and tap Send RSVP. Sending again updates your reply.',
  '- Photos: the Photos page lets guests upload pictures from the celebrations. Only the couple can see them.'
].join('\n');

var SYSTEM_PROMPT = [
  'You are the friendly assistant on the wedding website of Bhavitha and Nagender. Guests ask you about the wedding events.',
  'Answer only from the facts below. If something is not covered (for example meal menus, gifts, or anything not listed), say you are not sure and suggest asking the family directly. Never guess times, places, prices or names.',
  'Only help with questions about this wedding, the events, travel to them and staying nearby. Politely decline anything else.',
  'Reply in the language the guest writes in (Telugu or English). Keep answers short and warm: usually two to four sentences, with addresses written out in full when relevant. Use plain text, no markdown headings or tables.',
  '',
  '<wedding_facts>',
  WEDDING_FACTS,
  '</wedding_facts>'
].join('\n');

// Opening the web app URL in a browser shows this, so you can check the deployment works.
function doGet() {
  return ContentService.createTextOutput('Wedding backend is running. RSVPs, photos and assistant questions arrive through the website.');
}

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return reply_({ ok: true }); // Hidden field only bots fill in.
    if (data.type === 'photo') return reply_(savePhoto_(data));
    if (data.type === 'chat') return reply_(chat_(data));
    return reply_(saveRsvp_(data));
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: 'server' });
  }
}

// ---------- RSVPs ----------

function saveRsvp_(data) {
  var name = clean_(data.name, 80);
  if (!name) return { ok: false, error: 'name' };
  var responses = Array.isArray(data.responses) ? data.responses.slice(0, EVENTS.length) : [];
  var rows = [];
  var now = new Date();
  var id = Utilities.getUuid().slice(0, 8);
  var lang = data.lang === 'te' ? 'Telugu' : 'English';
  responses.forEach(function (r) {
    if (!r || EVENTS.indexOf(r.event) < 0) return;
    var yes = r.attending === 'yes';
    var guests = yes ? Math.max(1, Math.min(10, parseInt(r.guests, 10) || 1)) : 0;
    var meal = yes && MEALS.indexOf(r.meal) >= 0 ? r.meal : '';
    rows.push([now, id, name, r.event, yes ? 'Yes' : 'No', guests, meal, lang]);
  });
  if (!rows.length) return { ok: false, error: 'events' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = sheet_();
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, id: id };
}

function sheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// ---------- Photos ----------

function savePhoto_(data) {
  var type = String(data.mimeType || '').toLowerCase();
  if (PHOTO_TYPES.indexOf(type) < 0) return { ok: false, error: 'type' };
  var bytes = Utilities.base64Decode(String(data.data || ''));
  if (!bytes.length || bytes.length > PHOTO_MAX_BYTES) return { ok: false, error: 'size' };
  var who = clean_(data.name, 60) || 'Guest';
  var original = clean_(data.filename, 80).replace(/[\\\/:*?"<>|]/g, '') || 'photo';
  var stamp = Utilities.formatDate(new Date(), 'America/Chicago', 'yyyy-MM-dd HHmmss');
  var blob = Utilities.newBlob(bytes, type, stamp + ' ' + who + ' - ' + original);
  var file = photoFolder_().createFile(blob);
  file.setDescription('Uploaded by ' + who + ' from the wedding website');
  return { ok: true };
}

function photoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (err) { /* folder was deleted: make a new one */ }
  }
  var folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

// ---------- Assistant ----------

function chat_(data) {
  var key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, error: 'off' };

  var guest = clean_(data.guest, 40) || 'anon';
  if (!allow_('g:' + guest, CHAT_PER_GUEST, 21600) || !allow_('all:' + new Date().getHours(), CHAT_PER_HOUR, 3600)) {
    return { ok: false, error: 'limit' };
  }

  var messages = (Array.isArray(data.messages) ? data.messages : []).slice(-CHAT_MAX_TURNS * 2).map(function (m) {
    return { role: m && m.role === 'assistant' ? 'assistant' : 'user', content: String((m && m.content) || '').slice(0, CHAT_MAX_CHARS) };
  }).filter(function (m) { return m.content.trim(); });
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return { ok: false, error: 'input' };

  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: messages
    })
  });
  if (res.getResponseCode() !== 200) {
    console.error('Claude API ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 500));
    return { ok: false, error: 'upstream' };
  }
  var body = JSON.parse(res.getContentText());
  if (body.stop_reason === 'refusal') return { ok: true, answer: 'Sorry, I can only help with questions about the wedding events.' };
  var answer = (body.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n').trim();
  return answer ? { ok: true, answer: answer } : { ok: false, error: 'empty' };
}

// Counts requests per key in a time window; false once the limit is reached.
function allow_(key, limit, seconds) {
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var n = Number(cache.get(key) || 0);
    if (n >= limit) return false;
    cache.put(key, String(n + 1), seconds);
    return true;
  } finally {
    lock.releaseLock();
  }
}

// ---------- Helpers ----------

// Strips characters that would make a cell run as a formula in Sheets.
function clean_(value, max) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').trim().replace(/^[=+\-@]+/, '').slice(0, max);
}

function reply_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
