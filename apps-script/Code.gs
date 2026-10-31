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
var HEADERS = ['Submitted at', 'Reply ID', 'Name', 'Event', 'Attending', 'Guests', 'Meal', 'Language', 'Email', 'Phone', 'Note'];
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
  '1. Haldi (Nalugu): Tuesday, December 1, 2026, from 9:30 AM. Serengeti Events (Airbnb), 6147 FM 455, Anna, TX 75409. A pre-wedding ceremony where turmeric paste is applied to the bride and groom for blessings and good luck. Followed by lunch. Dress code: please join us in your favorite hue of yellow.',
  '2. Mehendi: Tuesday, December 1, 2026, from 4:00 PM. Serengeti Events (Airbnb), 6147 FM 455, Anna, TX 75409. An intimate and joyous celebration where intricate henna designs adorn the bride\'s hands and feet, symbolizing love, promise, and new beginnings. Followed by dinner. Dress code: festive attire in shades of green.',
  '3. Pellikuthuru / Pellikoduku: Wednesday, December 2, 2026, from 10:00 AM. Serengeti Events (Airbnb), 6147 FM 455, Anna, TX 75409. The making of the bride and groom: a beautiful beginning to the wedding rituals, filled with turmeric hues, cherished customs, and heartfelt blessings. Followed by lunch. Dress code: dress up in your favorite traditional Indian attire.',
  '4. Wedding (Telugu Pelli): Thursday, December 3, 2026, from 9:00 AM (Muhurtham). Bella Cavalli Events, 1651 W Sherman Dr, Aubrey, TX 76227. The rites, in order: Kanyadaanam, Jeelakarra Bellam, Mangalya Dharanam (tying the Mangalasutram), Thalambralu and Saptapadi. A celebration that brings two hearts and two families together. Followed by lunch. Dress code: bring out your silks for a traditional Telugu celebration.',
  '5. Cocktail party, "A Night under the Stars": Friday, December 4, 2026, 6:00 PM. The Meridian Venue, 351 Southwind Ln, Fairview, TX 75069. An after-wedding celebration with drinks and dinner. Dress code: formal or Indian festive wear; statement lehengas, sharp suits, bring on the Desi bling.',
  '',
  'GETTING THERE',
  '- Every venue has plenty of on-site parking.',
  '- Each event page on the website has an "Open in Maps" button.',
  '- McKinney, TX sits between all three venues and is the easiest place to stay.',
  '',
  'FLYING IN',
  '- Dallas Fort Worth International Airport (DFW) is the main airport, with the most flights. It is about 45 minutes to 1 hour by car to McKinney and the venues, depending on traffic.',
  '- Dallas Love Field (DAL) is smaller (mainly Southwest Airlines) and closer to downtown Dallas. It is about 40 to 50 minutes by car to McKinney and the venues.',
  '- A car is the easiest way to get around: rental cars are available at both airports, and Uber and Lyft work throughout the area.',
  '',
  'RECOMMENDED HOTELS (no group rate or booking code yet; guests book on their own)',
  '- Sheraton McKinney Hotel, 1900 Gateway Blvd, McKinney, TX 75069. Closest to the Cocktail venue.',
  '- Hampton Inn & Suites McKinney, 2008 N Central Expy, McKinney, TX 75069. On US-75, easy drive to Anna.',
  '- Fairfield Inn & Suites Dallas McKinney, 1600 Hardin Blvd, McKinney, TX 75071. North McKinney, toward Anna.',
  '- Holiday Inn Express & Suites McKinney - Frisco East, 6601 Henneman Way, McKinney, TX 75070. West McKinney, toward Aubrey.',
  '- Holiday Inn Express & Suites Prosper, 1100 Mahard Pkwy, Prosper, TX 75078. Closest to the Wedding venue.',
  '',
  'ON THE WEBSITE',
  '- RSVP: tap RSVP in the top bar (or the round RSVP button). Enter your name (email and phone are optional; guests who give an email get a confirmation email with their answers and the event details, and guests who give a US phone number get a confirmation text), choose "Count Me In!" or "Sending Love!" for each event, and for events you are attending pick the number of guests and Vegetarian or Non-vegetarian. You can add an optional note for the couple, then tap Send RSVP. Sending again updates your reply.',
  '- Photos: the Photos page lets guests upload pictures from the celebrations. Only the couple can see them.'
].join('\n');

var SYSTEM_PROMPT = [
  'You are the friendly assistant on the wedding website of Bhavitha and Nagender. Guests ask you about the wedding events.',
  'Answer wedding questions (events, times, venues, dress codes, RSVP, hotels) only from the facts below. If something about the wedding is not covered (for example meal menus or gifts), say you are not sure and suggest asking the family directly. Never guess event times, places, prices or names.',
  'For general travel questions about getting to and around the Dallas area (airports, driving times, rideshare, weather in early December, things to do nearby), you may use well-known general knowledge. Keep it brief, say times and distances are approximate, and suggest checking a map app for exact routes.',
  'Only help with questions about this wedding, travel to it and staying nearby. Politely decline anything else.',
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
  // Optional contact details and note, the same on every row of this reply.
  var email = clean_(data.email, 120), phone = clean_(data.phone, 30), note = clean_(data.note, 500);
  responses.forEach(function (r) {
    if (!r || EVENTS.indexOf(r.event) < 0) return;
    var yes = r.attending === 'yes';
    var guests = yes ? Math.max(1, Math.min(10, parseInt(r.guests, 10) || 1)) : 0;
    var meal = yes && MEALS.indexOf(r.meal) >= 0 ? r.meal : '';
    rows.push([now, id, name, r.event, yes ? 'Yes' : 'No', guests, meal, lang, email, phone, note]);
  });
  if (!rows.length) return { ok: false, error: 'events' };

  var lock = LockService.getScriptLock();
  var totals, previous;
  lock.waitLock(10000);
  try {
    var sheet = sheet_();
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    // Recount under the lock so two replies arriving together each compare against the right previous totals.
    totals = totals_(sheet);
    var props = PropertiesService.getScriptProperties();
    previous = JSON.parse(props.getProperty('LAST_TOTALS') || '{}');
    props.setProperty('LAST_TOTALS', JSON.stringify(totals));
  } finally {
    lock.releaseLock();
  }
  try {
    if (EVENTS.some(function (e) { return totals[e] > (previous[e] || 0); })) notify_(name, rows, totals);
  } catch (err) {
    console.error('Notification failed: ' + err); // The RSVP is saved either way.
  }
  try {
    telegram_(name, rows, totals); // Every reply, including "Sending Love!" ones.
  } catch (err) {
    console.error('Telegram message failed: ' + err);
  }
  var emailed = false, mailError = '';
  // A few confirmations per address an hour, so the form can't be used to flood someone's inbox.
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && allow_('mail:' + email.toLowerCase(), 3, 3600)) {
    try {
      confirmGuest_(email, name, rows, data.lang === 'te' ? 'te' : 'en');
      emailed = true;
    } catch (err) {
      console.error('Confirmation email failed: ' + err);
      mailError = String(err);
    }
  }
  var texted = false;
  var mobile = usPhone_(phone);
  // Same flood guard as email: a few texts per number an hour.
  if (mobile && allow_('sms:' + mobile, 3, 3600)) {
    try {
      texted = textGuest_(mobile, name, rows, data.lang === 'te' ? 'te' : 'en');
    } catch (err) {
      console.error('Confirmation text failed: ' + err);
    }
  }
  return { ok: true, id: id, emailed: emailed, mailError: mailError, texted: texted };
}

// A US or Canadian number in +1XXXXXXXXXX form, or '' for anything else (texts abroad cost more and mostly need local registration).
function usPhone_(raw) {
  var digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  return digits.length === 11 && digits.charAt(0) === '1' ? '+' + digits : '';
}

// Texts the guest a short confirmation through Twilio. Needs three script properties: TWILIO_SID, TWILIO_TOKEN
// and TWILIO_FROM (your Twilio number, like +18885551234). Without them it does nothing.
function textGuest_(to, name, rows, lang) {
  var props = PropertiesService.getScriptProperties();
  var sid = props.getProperty('TWILIO_SID'), token = props.getProperty('TWILIO_TOKEN'), from = props.getProperty('TWILIO_FROM');
  if (!sid || !token || !from) return false;
  var te = lang === 'te';
  var lines = rows.map(function (r) {
    var event = te ? (EVENT_INFO[r[3]] || {}).te || r[3] : r[3];
    if (r[4] !== 'Yes') return event + ': ' + (te ? 'రాలేకపోతున్నారు' : "can't make it");
    return event + ': ' + r[5] + ' ' + (te ? (r[5] > 1 ? 'అతిథులు' : 'అతిథి') : (r[5] > 1 ? 'guests' : 'guest'));
  });
  var body = te
    ? name + ', మీ RSVP అందింది! భవిత & నాగేందర్ వివాహం\n' + lines.join('\n') + '\nవివరాలు, మార్పులు: naguddu.com'
    : 'Hi ' + name + ', thank you for your RSVP to Bhavitha & Nagender\'s wedding!\n' + lines.join('\n') + '\nDetails or changes: naguddu.com';
  var res = UrlFetchApp.fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'post', muteHttpExceptions: true,
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + token) },
    payload: { To: to, From: from, Body: body }
  });
  if (res.getResponseCode() >= 300) {
    console.error('Twilio ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
    return false;
  }
  return true;
}

// Run this once from the editor after adding the Twilio properties: it texts a sample confirmation to the number you type below.
function testConfirmationText() {
  var to = usPhone_('YOUR NUMBER HERE');
  if (!to) return console.log('Put your 10-digit US number in place of YOUR NUMBER HERE first.');
  var ok = textGuest_(to, 'Test Guest', [[new Date(), 'test', 'Test Guest', 'Haldi', 'Yes', 2, 'Vegetarian', 'English', '', to, '']], 'en');
  console.log(ok ? 'Sample text sent to ' + to : 'Not sent: check the Twilio properties and the error above.');
}

// Details for the guest's confirmation email, keyed by the event names the website sends.
var EVENT_INFO = {
  'Haldi': { te: 'నలుగు', when: { en: 'Tuesday, December 1, 2026 · 9:30 AM', te: 'మంగళవారం, డిసెంబర్ 1, 2026 · ఉదయం 9:30' }, venue: 'Serengeti Events (Airbnb)', address: '6147 FM 455, Anna, TX 75409' },
  'Mehendi': { te: 'మెహందీ', when: { en: 'Tuesday, December 1, 2026 · 4:00 PM', te: 'మంగళవారం, డిసెంబర్ 1, 2026 · సాయంత్రం 4:00' }, venue: 'Serengeti Events (Airbnb)', address: '6147 FM 455, Anna, TX 75409' },
  'Pellikuthuru / Pellikoduku': { te: 'పెళ్లికూతురు / పెళ్లికొడుకు', when: { en: 'Wednesday, December 2, 2026 · 10:00 AM', te: 'బుధవారం, డిసెంబర్ 2, 2026 · ఉదయం 10:00' }, venue: 'Serengeti Events (Airbnb)', address: '6147 FM 455, Anna, TX 75409' },
  'Wedding': { te: 'సుముహూర్తం', when: { en: 'Thursday, December 3, 2026 · 9:00 AM', te: 'గురువారం, డిసెంబర్ 3, 2026 · ఉదయం 9:00' }, venue: 'Bella Cavalli Events', address: '1651 W Sherman Dr, Aubrey, TX 76227' },
  'Cocktail': { te: 'కాక్‌టెయిల్', when: { en: 'Friday, December 4, 2026 · 6:00 PM', te: 'శుక్రవారం, డిసెంబర్ 4, 2026 · సాయంత్రం 6:00' }, venue: 'The Meridian Venue', address: '351 Southwind Ln, Fairview, TX 75069' }
};
var MEAL_TE = { 'Vegetarian': 'శాకాహారం', 'Non-vegetarian': 'మాంసాహారం', 'Vegan': 'వీగన్', 'Jain': 'జైన్' };
var SITE_URL = 'https://naguddu.com';

// Thanks the guest and lists their answers, with date, venue and a Maps link for each event they're coming to.
function confirmGuest_(to, name, rows, lang) {
  var te = lang === 'te';
  var W = te ? {
    subject: 'మీ సమాధానం అందింది! 💌 భవిత & నాగేందర్ వివాహం',
    hi: 'ప్రియమైన ' + name + ',',
    thanks: 'మీ RSVP పంపినందుకు ధన్యవాదాలు! మాకు అందిన మీ సమాధానాలు:',
    yes: 'నేను వస్తాను!', no: 'ప్రేమతో ఆశీస్సులు!', guest: 'అతిథి', guests: 'అతిథులు', map: 'మ్యాప్‌లో చూడండి',
    change: 'మనసు మారిందా? naguddu.com లో కొత్త సమాధానం పంపండి, మీ తాజా సమాధానాన్నే తీసుకుంటాం.',
    love: 'ప్రేమతో,', couple: 'భవిత & నాగేందర్'
  } : {
    subject: "You're on the list! 💌 Bhavitha & Nagender's wedding",
    hi: 'Dear ' + name + ',',
    thanks: 'Thank you for your RSVP! Here is what we have from you:',
    yes: 'Count Me In!', no: 'Sending Love!', guest: 'guest', guests: 'guests', map: 'Open in Maps',
    change: "Plot twist? Just send a new RSVP at naguddu.com and we'll go with your latest answer.",
    love: 'With love,', couple: 'Bhavitha & Nagender'
  };

  var text = [W.hi, '', W.thanks, ''];
  var html = '<div style="font-family:Georgia,serif;color:#3a1d14;max-width:520px;margin:auto;padding:24px;background:#fffaf0;border:1px solid #e6c98a;border-radius:12px">'
    + '<p style="text-align:center;color:#a8742a;letter-spacing:2px;margin:0 0 16px">#NaGuddu</p>'
    + '<p>' + esc_(W.hi) + '</p><p>' + esc_(W.thanks) + '</p>';
  rows.forEach(function (r) {
    var info = EVENT_INFO[r[3]] || { te: r[3], when: { en: '', te: '' }, venue: '', address: '' };
    var event = te ? info.te : r[3];
    var yes = r[4] === 'Yes';
    var answer = yes
      ? W.yes + ' · ' + r[5] + ' ' + (r[5] > 1 ? W.guests : W.guest) + (r[6] ? ' · ' + (te ? MEAL_TE[r[6]] || r[6] : r[6]) : '')
      : W.no;
    var maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(info.venue + ', ' + info.address);
    text.push(event + ': ' + answer);
    if (yes && info.address) text.push('  ' + info.when[lang], '  ' + info.venue + ', ' + info.address, '  ' + maps);
    text.push('');
    html += '<div style="margin:12px 0;padding:12px 14px;background:#fff;border-left:3px solid ' + (yes ? '#a8742a' : '#c9b8a8') + ';border-radius:6px">'
      + '<b style="color:#7a1f1f">' + esc_(event) + '</b><br>' + esc_(answer)
      + (yes && info.address
        ? '<br><span style="font-size:14px;color:#6b4a3a">' + esc_(info.when[lang]) + '<br>' + esc_(info.venue) + ', ' + esc_(info.address)
          + '</span><br><a href="' + maps + '" style="color:#a8742a">' + esc_(W.map) + '</a>'
        : '')
      + '</div>';
  });
  text.push(W.change, '', W.love, W.couple, SITE_URL);
  html += '<p style="font-size:14px">' + esc_(W.change) + '</p>'
    + '<p>' + esc_(W.love) + '<br><b>' + esc_(W.couple) + '</b></p>'
    + '<p style="text-align:center"><a href="' + SITE_URL + '" style="color:#a8742a">naguddu.com</a></p></div>';

  MailApp.sendEmail(to, W.subject, text.join('\n'), { name: 'Bhavitha & Nagender', htmlBody: html });
}

// Run this once from the editor: it asks for any missing Gmail permission, logs how many emails are left today and sends you a sample confirmation.
function testConfirmationEmail() {
  var me = Session.getEffectiveUser().getEmail();
  console.log('Emails left today: ' + MailApp.getRemainingDailyQuota());
  confirmGuest_(me, 'Test Guest', [[new Date(), 'test', 'Test Guest', 'Haldi', 'Yes', 1, 'Vegetarian', 'English', me, '', '']], 'en');
  console.log('Sample confirmation sent to ' + me);
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Guests attending each event, counting only each person's latest reply (rows from one send share a Reply ID).
function totals_(sheet) {
  var values = sheet.getDataRange().getValues().slice(1);
  var latest = {};
  values.forEach(function (r) {
    var who = String(r[2]).trim().toLowerCase();
    var at = new Date(r[0]).getTime();
    if (!latest[who] || at >= latest[who].at) latest[who] = { at: at, id: r[1] };
  });
  var totals = {};
  EVENTS.forEach(function (e) { totals[e] = 0; });
  values.forEach(function (r) {
    var who = String(r[2]).trim().toLowerCase();
    if (latest[who].id === r[1] && r[4] === 'Yes' && r[3] in totals) totals[r[3]] += Number(r[5]) || 0;
  });
  return totals;
}

// Sends the new totals by email (on unless NOTIFY_EMAIL is "off") and as a phone push via ntfy when NTFY_TOPIC is set.
function notify_(name, rows, totals) {
  var reply = rows.map(function (r) {
    return r[3] + ': ' + (r[4] === 'Yes' ? r[5] + (r[5] > 1 ? ' guests' : ' guest') + (r[6] ? ', ' + r[6] : '') : "can't make it");
  }).join('\n');
  var all = 0;
  var lines = EVENTS.map(function (e) { all += totals[e]; return e + ': ' + totals[e]; });
  var extra = [rows[0][8] && 'Email: ' + rows[0][8], rows[0][9] && 'Phone: ' + rows[0][9], rows[0][10] && 'Note: ' + rows[0][10]].filter(Boolean).join('\n');
  var body = name + ' replied:\n' + reply + (extra ? '\n' + extra : '') + '\n\nGuests attending so far:\n' + lines.join('\n') + '\n(Sum across events: ' + all + ')';

  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail();
  if (email && email.toLowerCase() !== 'off') MailApp.sendEmail(email, 'New RSVP from ' + name, body);

  var topic = props.getProperty('NTFY_TOPIC');
  if (topic) {
    UrlFetchApp.fetch('https://ntfy.sh/' + encodeURIComponent(topic), {
      method: 'post', payload: body, muteHttpExceptions: true,
      headers: { Title: 'New wedding RSVP', Tags: 'tada' }
    });
  }
}

// Posts the reply and the latest counts to your Telegram group through your own bot (free). Needs two script
// properties: TELEGRAM_TOKEN (from BotFather) and TELEGRAM_CHAT (the group's id; run findTelegramChat to get it).
function telegram_(name, rows, totals) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_TOKEN'), chat = props.getProperty('TELEGRAM_CHAT');
  if (!token || !chat) return;
  var reply = rows.map(function (r) {
    return '• ' + esc_(r[3]) + ': ' + (r[4] === 'Yes' ? r[5] + (r[5] > 1 ? ' guests' : ' guest') + (r[6] ? ', ' + r[6] : '') : "can't make it");
  });
  var all = 0;
  var counts = EVENTS.map(function (e) { all += totals[e]; return '• ' + esc_(e) + ': ' + totals[e]; });
  var text = '🎉 <b>New RSVP from ' + esc_(name) + '</b>\n' + reply.join('\n')
    + (rows[0][10] ? '\n💌 ' + esc_(rows[0][10]) : '')
    + '\n\n📊 <b>Guests attending so far</b>\n' + counts.join('\n') + '\n<b>Total: ' + all + '</b>';
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chat, text: text, parse_mode: 'HTML' })
  });
  if (res.getResponseCode() !== 200) console.error('Telegram ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
}

// Setup helper: run this once from the editor (after adding the bot to your group and sending a message there).
// It logs the chats your bot has seen; copy the group's id into the TELEGRAM_CHAT script property.
function findTelegramChat() {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!token) return console.log('Add the TELEGRAM_TOKEN script property first.');
  var updates = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates').getContentText()).result || [];
  var seen = {};
  updates.forEach(function (u) {
    var c = (u.message || u.my_chat_member || u.channel_post || {}).chat;
    if (c && !seen[c.id]) { seen[c.id] = true; console.log((c.title || c.first_name || 'chat') + ' -> TELEGRAM_CHAT = ' + c.id); }
  });
  if (!updates.length) console.log('No messages yet. Send a message in the group (mentioning the bot), then run this again.');
}

function sheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  } else if (sheet.getLastColumn() < HEADERS.length) {
    // An older sheet: add the newer column titles (Email, Phone, Note).
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
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
