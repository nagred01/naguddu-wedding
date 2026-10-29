import React, { useEffect, useRef, useState } from 'react';
import './style.css';
import homeArt from './img/home-invite.webp';
// The same artwork with one language's words painted out, so those lines can be set as live text in the other language.
import homeArtEn from './img/home-invite-en.webp';
import homeArtTe from './img/home-invite-te.webp';
// The card's top edge, mirrored: fills the band under the sound and language buttons so the card reaches the menu.
import homeTopEn from './img/home-invite-top-en.webp';
import homeTopTe from './img/home-invite-top-te.webp';
import gate from './img/gate-garland.jpg';
import ganesha from './img/ganesha.webp';
import haldi from './img/haldi-c1.webp';
import mangalaC from './img/haldi-c2.webp';
import mehandi from './img/c-mehandi.webp';
import pellikoduku from './img/pellikoduku-k.webp';
import mehandiSwing from './img/c-swing.webp';
import pellikuthuru from './img/pellikuthuru-k.webp';
import wedKnot from './img/wedding-couple1.webp';
import wedFeet from './img/wedding-couple2.webp';
import reception from './img/c-recep.webp';
const EVIMG: Record<string, string> = { pasupu: haldi, mehandi, pellikuthuru, vivaham: wedKnot, reception };
import { EVENTS, HOTELS, T, mapUrl, type Lang } from './i18n';
import { SCRIPT_URL } from './config';
import { PhotoUpload } from './PhotoUpload';
import { EDIT_MODE } from './editStore';
import { LayoutEditor } from './LayoutEditor';
const EXTRA: Record<string, { img: string; cap: Record<Lang, string> }> = {
  vivaham: { img: wedFeet, cap: { en: '', te: '' } },
  pasupu: { img: mangalaC, cap: { en: 'Mangala Snanam', te: 'మంగళ స్నానం' } },
  mehandi: { img: mehandiSwing, cap: { en: 'Mehandi Moments', te: 'మెహందీ క్షణాలు' } },
  pellikuthuru: { img: pellikoduku, cap: { en: 'Pellikoduku', te: 'పెళ్లికొడుకు' } },
};
const VERSE: Record<string, string[]> = {
  vivaham: ['పిడికిట తలంబ్రాలు పెళ్లి కూతురు కొంత', 'పెదమరవి నవ్వేనే పెళ్లి కూతురు', 'తాను తన తాళి బొట్టు ఆమె తన ఆయువు పట్టు', 'ఏకమైంది దాంపత్యం ఏడడుగులు వేస్తూ'],
  pasupu: ['ముత్తైదువులంతా ముదమారా ఈ బాలకి', 'మంగళ స్నానాలు చేయించరే', 'శ్రీరామ రక్షణ అనే క్షీరాబ్ధి కన్యకి', 'ముమ్మారు దిష్టి తీసి దీవించరే'],
  mehandi: ['అర చేతుల గోరింటాకు బుగ్గల్లో ఎరుపెక్కింది,', 'ఆ సిగ్గుల పేరే మందారమా!', 'అరిటాకుల విస్తళ్ళన్నీ అతిథుల్నే రమ్మన్నాయి,', 'ఆ కమ్మని పిలుపే ఆహ్వానమా!'],
};

import { player } from './music';
import { SavedEvent } from './SavedEvent';
import { Cocktail } from './Cocktail';
import { Glimpse } from './Glimpse';

const Kolam = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M60 6 C72 24 72 36 60 48 C48 36 48 24 60 6Z" /><path d="M114 60 C96 72 84 72 72 60 C84 48 96 48 114 60Z" />
    <path d="M60 114 C48 96 48 84 60 72 C72 84 72 96 60 114Z" /><path d="M6 60 C24 48 36 48 48 60 C36 72 24 72 6 60Z" />
    <path d="M60 30 L90 60 L60 90 L30 60Z" /><circle cx="60" cy="60" r="8" />
    {[[30, 30], [90, 30], [30, 90], [90, 90]].map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r="2.5" fill="currentColor" />)}
  </svg>
);

const Divider = () => <div className="divider"><span /><Kolam className="divider-k" /><span /></div>;


const WEDDING = new Date(Date.UTC(2026, 11, 3, 15, 0, 0)); // Dec 3, 2026 9:00 AM US Central (CST, UTC-6), same instant for all viewers
function Countdown({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const h = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(h); }, []);
  const diff = Math.max(0, WEDDING.getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, sec = Math.floor(diff / 1000) % 60;
  const L = lang === 'en' ? ['days', 'hours', 'min', 'sec'] : ['రోజులు', 'గంటలు', 'నిమి', 'సెక'];
  return (
    <div className="countdown" aria-label="countdown">
      {[d, h, m, sec].map((v, i) => <div key={i}><b>{String(v).padStart(2, '0')}</b><span>{L[i]}</span></div>)}
    </div>
  );
}
const PETALS = Array.from({ length: 16 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 3.7) % 30, dur: 24 + (i % 5) * 3, size: 8 + (i % 4) * 3, c: ['#f5a623', '#e8553d', '#fbe8b5', '#f08a24'][i % 4] }));
const Petals = ({ hide }: { hide?: boolean }) => (
  <div className="petals" aria-hidden="true" style={hide ? { display: 'none' } : undefined}>
    {PETALS.map((p, i) => <i key={i} style={{ left: p.left + '%', width: p.size, height: p.size * 1.3, background: p.c, animationDelay: -p.delay + 's', animationDuration: p.dur + 's' }} />)}
  </div>
);


type QA = { id: string; q: Record<Lang, string>; a: Record<Lang, React.ReactNode> };
const evName = (ev: (typeof EVENTS)[number], lang: Lang) => (lang === 'en' ? ev.en : ev.te).split('/')[0].trim();
const QA_LIST: QA[] = [
  {
    id: 'when',
    q: { en: 'When is the wedding?', te: 'పెళ్లి ఎప్పుడు?' },
    a: {
      en: <>The muhurtham is <b>Thursday, December 3, 2026 at 9:00 AM</b> at Bella Cavalli Events. The celebrations run Tuesday, December 1 to Friday, December 4.</>,
      te: <>ముహూర్తం: <b>గురువారం, డిసెంబర్ 3, 2026, ఉదయం 9:00</b>, Bella Cavalli Events వద్ద. వేడుకలు మంగళవారం డిసెంబర్ 1 నుండి శుక్రవారం డిసెంబర్ 4 వరకు.</>,
    },
  },
  {
    id: 'schedule',
    q: { en: 'Full schedule', te: 'అన్ని వేడుకలు' },
    a: {
      en: <>{EVENTS.map((ev) => <span className="wa-line" key={ev.id}><b>{evName(ev, 'en')}</b> · {ev.date.en}, {ev.time.en} · {ev.venue.en}</span>)}</>,
      te: <>{EVENTS.map((ev) => <span className="wa-line" key={ev.id}><b>{evName(ev, 'te')}</b> · {ev.date.te}, {ev.time.te} · {ev.venue.te}</span>)}</>,
    },
  },
  {
    id: 'where',
    q: { en: 'Where are the events?', te: 'వేడుకలు ఎక్కడ?' },
    a: {
      en: <><span className="wa-line">Haldi, Mehendi, Pellikuthuru · <b>Serengeti Events (Airbnb)</b><br /><a href={mapUrl(EVENTS[0].address)} target="_blank" rel="noopener">6147 FM 455, Anna, TX 75409</a></span><span className="wa-line">Wedding · <b>Bella Cavalli Events</b><br /><a href={mapUrl(EVENTS[3].address)} target="_blank" rel="noopener">1651 W Sherman Dr, Aubrey, TX 76227</a></span><span className="wa-line">Cocktail · <b>The Meridian Venue</b><br /><a href={mapUrl(EVENTS[4].address)} target="_blank" rel="noopener">351 Southwind Ln, Fairview, TX 75069</a></span>Tap an address to open it in Maps.</>,
      te: <><span className="wa-line">పసుపు, మెహందీ, పెళ్లికూతురు · <b>Serengeti Events (Airbnb)</b><br /><a href={mapUrl(EVENTS[0].address)} target="_blank" rel="noopener">6147 FM 455, Anna, TX 75409</a></span><span className="wa-line">సుముహూర్తం · <b>Bella Cavalli Events</b><br /><a href={mapUrl(EVENTS[3].address)} target="_blank" rel="noopener">1651 W Sherman Dr, Aubrey, TX 76227</a></span><span className="wa-line">కాక్‌టెయిల్ · <b>The Meridian Venue</b><br /><a href={mapUrl(EVENTS[4].address)} target="_blank" rel="noopener">351 Southwind Ln, Fairview, TX 75069</a></span>మ్యాప్‌లో చూడటానికి చిరునామాను తాకండి.</>,
    },
  },
  {
    id: 'stay',
    q: { en: 'Where should I stay?', te: 'ఎక్కడ బస చేయాలి?' },
    a: {
      en: <>McKinney is the easiest base: it sits between all three venues.{HOTELS.map((h) => <span key={h.name} className="wa-line"><b>{h.name}</b> · {h.note.en}<br /><a href={mapUrl(h.name + ', ' + h.address)} target="_blank" rel="noopener">{h.address}</a></span>)}Please book early.</>,
      te: <>మెకిన్నీ అన్ని వేదికల మధ్యలో ఉంటుంది, అక్కడ బస చేయడం సులభం.{HOTELS.map((h) => <span key={h.name} className="wa-line"><b>{h.name}</b> · {h.note.te}<br /><a href={mapUrl(h.name + ', ' + h.address)} target="_blank" rel="noopener">{h.address}</a></span>)}దయచేసి ముందుగానే బుక్ చేసుకోండి.</>,
    },
  },
  {
    id: 'dress',
    q: { en: 'What should I wear?', te: 'ఏం ధరించాలి?' },
    a: {
      en: <>Suggestions from each event page:{EVENTS.map((ev) => <span className="wa-line" key={ev.id}><b>{evName(ev, 'en')}</b> · {ev.dress.en}</span>)}</>,
      te: <>ప్రతి వేడుక పేజీలోని సూచనలు:{EVENTS.map((ev) => <span className="wa-line" key={ev.id}><b>{evName(ev, 'te')}</b> · {ev.dress.te}</span>)}</>,
    },
  },
  {
    id: 'parking',
    q: { en: 'Is there parking?', te: 'పార్కింగ్ ఉందా?' },
    a: {
      en: <>Yes! Every venue has plenty of on-site parking, so just drive in and park.</>,
      te: <>అవును! అన్ని వేదికల వద్ద తగినంత పార్కింగ్ ఉంది, నేరుగా వచ్చి పార్క్ చేయవచ్చు.</>,
    },
  },
  {
    id: 'rsvp',
    q: { en: 'How do I RSVP?', te: 'RSVP ఎలా చేయాలి?' },
    a: {
      en: SCRIPT_URL ? <>Tap <b>RSVP</b> in the top bar, answer for each celebration and tap <b>Send RSVP</b>. Your reply goes straight to the couple.</> : <>Tap <b>RSVP</b> in the top bar, pick the events you will attend and send. The form is still being connected, so for now please also let the family know directly.</>,
      te: SCRIPT_URL ? <>పైన ఉన్న <b>RSVP</b> తాకి, ప్రతి వేడుకకు సమాధానం ఇచ్చి <b>పంపండి</b> నొక్కండి. మీ సమాధానం నేరుగా వధూవరులకు చేరుతుంది.</> : <>పైన ఉన్న <b>RSVP</b> తాకి, మీరు హాజరయ్యే వేడుకలు ఎంచుకుని పంపండి. ఫారమ్ ఇంకా అనుసంధానం అవ్వలేదు, కాబట్టి ప్రస్తుతానికి కుటుంబానికి నేరుగా కూడా తెలియజేయండి.</>,
    },
  },
  {
    id: 'photos',
    q: { en: 'Can I share photos?', te: 'ఫోటోలు పంచుకోవచ్చా?' },
    a: {
      en: <>Yes! Use the <b>Photos</b> tab. Uploads are still being connected; until then, share with the hashtag <b>#NaGuddu</b>.</>,
      te: <>తప్పకుండా! <b>ఫోటోలు</b> ట్యాబ్ వాడండి. అప్‌లోడ్ ఇంకా అనుసంధానం అవ్వలేదు; అప్పటివరకు <b>#NaGuddu</b> హ్యాష్‌ట్యాగ్‌తో పంచుకోండి.</>,
    },
  },
];

const PAGES = [{ id: 'cover', en: 'Home', te: 'హోమ్' }, ...EVENTS.map((e) => ({ id: e.id, en: e.en.split('/')[0].trim(), te: e.te.split('/')[0].trim() })), { id: 'glimpse', en: 'All Events', te: 'అన్ని వేడుకలు' }, { id: 'rsvp', en: 'RSVP', te: 'RSVP' }, { id: 'photos', en: 'Photos', te: 'ఫోటోలు' }];

// A random id per browser, so the backend can limit how many questions one guest asks.
function guestId() {
  try {
    let id = localStorage.getItem('wa-guest');
    if (!id) { id = Math.random().toString(36).slice(2, 12); localStorage.setItem('wa-guest', id); }
    return id;
  } catch { return 'anon'; }
}

type ChatItem = { role: 'q' | 'a'; content: React.ReactNode; text?: string };

function Assistant({ lang }: { lang: Lang }) {
  const en = lang === 'en';
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [asked, setAsked] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const b = bodyRef.current; if (b) b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' }); }, [items, thinking, open]);
  const title = en ? 'Wedding assistant' : 'వివాహ సహాయకుడు';

  const pick = (qa: QA) => { setAsked((a) => [...a, qa.id]); setItems((m) => [...m, { role: 'q', content: qa.q[lang] }, { role: 'a', content: qa.a[lang] }]); };
  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    // Only typed questions and Claude's answers go to the model; quick-question answers stay on the page.
    const history = [...items.filter((m) => m.text !== undefined), { role: 'q' as const, content: text, text }];
    setItems((m) => [...m, { role: 'q', content: text, text }]);
    setDraft('');
    setThinking(true);
    let answer = '', failed = '';
    try {
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ type: 'chat', lang, guest: guestId(), messages: history.map((m) => ({ role: m.role === 'q' ? 'user' : 'assistant', content: m.text })) }) });
      const out = await res.json();
      if (out.ok) answer = out.answer;
      else failed = out.error === 'limit'
        ? (en ? "You've asked a lot of questions! Please try again in a little while, or ask the family." : 'మీరు చాలా ప్రశ్నలు అడిగారు! కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి, లేదా కుటుంబాన్ని అడగండి.')
        : '';
    } catch { /* falls through to the generic message */ }
    setThinking(false);
    setItems((m) => [...m, answer
      ? { role: 'a', content: answer, text: answer }
      : { role: 'a', content: failed || (en ? "Sorry, I can't answer right now. Try the quick questions below, or ask the family." : 'క్షమించండి, ఇప్పుడు సమాధానం ఇవ్వలేకపోతున్నాను. దిగువ ప్రశ్నలు ప్రయత్నించండి, లేదా కుటుంబాన్ని అడగండి.') }]);
  };

  // Close with a short slide-down instead of vanishing.
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false); }, 180); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={'wa' + (open ? ' is-open' : '')}>
      {open && (
        <div className={'wa-panel' + (closing ? ' closing' : '')} role="dialog" aria-label={title}>
          <div className="wa-head">
            <div><span className="wa-title">{title}</span><span className="wa-sub">{en ? 'Events, venues, hotels and more' : 'వేడుకలు, వేదికలు, హోటళ్లు మరియు మరిన్ని'}</span></div>
            <button className="wa-x" onClick={close} aria-label={en ? 'Close' : 'మూసివేయి'}>×</button>
          </div>
          <div className="wa-body" ref={bodyRef} aria-live="polite">
            <p className="wa-msg wa-a">{SCRIPT_URL
              ? (en ? 'Namaste! Ask me anything about the wedding, or tap a question below.' : 'నమస్తే! వివాహం గురించి ఏదైనా అడగండి, లేదా దిగువ ప్రశ్నను తాకండి.')
              : (en ? 'Namaste! Tap a question below and I will answer.' : 'నమస్తే! దిగువ ప్రశ్నను తాకండి, సమాధానం చెబుతాను.')}</p>
            {items.map((m, i) => <p key={i} className={'wa-msg ' + (m.role === 'q' ? 'wa-q' : 'wa-a') + (m.text !== undefined ? ' wa-ai' : '')}>{m.content}</p>)}
            {thinking && <p className="wa-msg wa-a wa-typing" aria-label={en ? 'Typing' : 'టైప్ చేస్తోంది'}><span /><span /><span /></p>}
          </div>
          {/* Suggested questions: one swipeable row, so the conversation keeps the space. */}
          {QA_LIST.some((x) => !asked.includes(x.id)) && (
            <div className="wa-chips" aria-label={en ? 'Suggested questions' : 'సూచించిన ప్రశ్నలు'}>
              {QA_LIST.filter((x) => !asked.includes(x.id)).map((x) => (
                <button key={x.id} onClick={() => pick(x)}>{x.q[lang]}</button>
              ))}
            </div>
          )}
          {SCRIPT_URL && (
            <form className="wa-input" onSubmit={ask}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={600} enterKeyHint="send" placeholder={en ? 'Type your question…' : 'మీ ప్రశ్న రాయండి…'} aria-label={en ? 'Your question' : 'మీ ప్రశ్న'} />
              <button type="submit" disabled={thinking || !draft.trim()} aria-label={en ? 'Send' : 'పంపు'}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
              </button>
            </form>
          )}
        </div>
      )}
      <button className="wa-fab" onClick={() => (open ? close() : setOpen(true))} aria-label={title} aria-expanded={open}>
        {open ? <span className="wa-fab-x">×</span> : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.55 1.24 4.84 3.22 6.46-.14 1.1-.62 2.63-1.72 3.74 0 0 2.98.28 5.35-1.5.74.18 1.51.3 2.32.3 5.52 0 10-3.94 10-8.8S17.52 2 12 2Z"/></svg>
        )}
      </button>
    </div>
  );
}

export function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shared, setShared] = useState(false);
  // Share opens the phone's share sheet (WhatsApp, Messages, Instagram…); where there isn't one, it copies the link.
  const share = async () => {
    const url = 'https://naguddu.com';
    const data = { title: 'Bhavitha & Nagender · #NaGuddu', text: lang === 'en' ? 'You’re invited to Bhavitha & Nagender’s wedding celebrations! 💌' : 'భవిత & నాగేందర్ వివాహ వేడుకలకు మీకు ఆహ్వానం! 💌', url };
    if (navigator.share) { try { await navigator.share(data); } catch { /* closed without sharing */ } return; }
    try { await navigator.clipboard.writeText(url); } catch { window.prompt(lang === 'en' ? 'Copy this link:' : 'ఈ లింక్ కాపీ చేయండి:', url); return; }
    setShared(true); window.setTimeout(() => setShared(false), 2200);
  };
  const [active, setActive] = useState('cover');
  const [switching,setSwitching]=useState(false);
  const transitionTimer=useRef<number>();
  const [rsvp, setRsvp] = useState<Record<string, 'yes' | 'no' | undefined>>({});
  const [party, setParty] = useState<Record<string, { guests: number; meal?: string }>>({});
  const setGuests = (id: string, d: number) => setParty((p) => ({ ...p, [id]: { ...p[id], guests: Math.min(10, Math.max(1, (p[id]?.guests ?? 1) + d)) } }));
  const setMeal = (id: string, meal: string) => setParty((p) => ({ ...p, [id]: { guests: p[id]?.guests ?? 1, meal } }));
  const [guestName, setGuestName] = useState('');
  // Optional contact details and a note for the couple.
  const [contact, setContact] = useState({ email: '', phone: '', note: '' });
  const [emailed, setEmailed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'needName' | 'needEvent' | 'sending' | 'done' | 'error' | 'preview'>('idle');
  const t = (k: keyof typeof T) => T[k][lang];
  const sendRsvp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!guestName.trim()) return setStatus('needName');
    const chosen = EVENTS.filter((ev) => rsvp[ev.id]);
    if (!chosen.length) return setStatus('needEvent');
    if (!SCRIPT_URL) return setStatus('preview');
    const payload = {
      name: guestName.trim(), lang,
      email: contact.email.trim(), phone: contact.phone.trim(), note: contact.note.trim(),
      website: (e.currentTarget.elements.namedItem('website') as HTMLInputElement).value,
      responses: chosen.map((ev) => {
        const meal = party[ev.id]?.meal as keyof typeof T | undefined;
        return { event: ev.en, attending: rsvp[ev.id], guests: party[ev.id]?.guests ?? 1, meal: meal ? T[meal].en : '' };
      }),
    };
    setStatus('sending');
    try {
      // A text/plain body keeps this a simple request, which Apps Script accepts without a CORS preflight.
      const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
      const out = await res.json();
      setEmailed(!!out.emailed);
      setStatus(out.ok ? 'done' : 'error');
    } catch { setStatus('error'); }
  };
  const activeRef = useRef('cover');
  const scroller = useRef<HTMLDivElement>(null);

  const [opening, setOpening] = useState(false);
  const enter = () => { player.start(); player.play(activeRef.current); setOpening(true); window.setTimeout(() => setEntered(true), 1100); };
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-sec]'));
    // A page is current when it fills more than half the visible area. This also works for pages taller than the
    // screen (RSVP, Photos), which never become 55% visible themselves.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const view = e.rootBounds?.height || window.innerHeight;
        if (e.isIntersecting && e.intersectionRect.height > view * 0.5) {
          const id = (e.target as HTMLElement).dataset.sec!;
          if (id === activeRef.current) return;
          activeRef.current = id; setActive(id); player.play(id);
        }
      });
    }, { root: scroller.current, threshold: Array.from({ length: 21 }, (_, i) => i / 20) });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  useEffect(() => { player.setMuted(muted); }, [muted]);
  useEffect(() => { const b = document.querySelector<HTMLElement>('.tabs [data-tab="' + active + '"]'); const bar = b && b.parentElement; if (b && bar) bar.scrollTo({ left: b.offsetLeft - bar.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' }); }, [active]);

  const go = (id: string) => { const el = document.getElementById(id); if(!el||!scroller.current||id===activeRef.current)return; window.clearTimeout(transitionTimer.current); const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;setSwitching(!reduced);transitionTimer.current=window.setTimeout(()=>{scroller.current!.scrollTo({top:el.offsetTop,behavior:'instant' as ScrollBehavior});activeRef.current=id;setActive(id);player.play(id);requestAnimationFrame(()=>requestAnimationFrame(()=>setSwitching(false)));},reduced?0:350); };

  return (
    <div className={'wed ' + (lang === 'te' ? 'is-te' : '')} lang={lang}>
     <div className={'stage' + (active === 'cover' ? ' home-active' : '')}>
      <div className="sample-bar">{t('sample')}</div>
      <div className="topbar">
        <div className="playback-pills"><button className="pill" onClick={() => setMuted(!muted)} aria-pressed={muted} aria-label={t('sound')}>{muted ? '🔇' : '🔊'}</button><button className="pill share-pill" onClick={share} aria-label={lang === 'en' ? 'Share this invitation' : 'ఈ ఆహ్వానాన్ని పంచుకోండి'}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" /><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" /></svg></button>{shared && <span className="share-toast" role="status">{lang === 'en' ? 'Link copied!' : 'లింక్ కాపీ అయింది!'}</span>}</div>
        <div className="lang" role="group" aria-label="Language">
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          <button className={lang === 'te' ? 'on' : ''} onClick={() => setLang('te')}>తెలుగు</button>
        </div>
      </div>
      {entered && (
        <nav className="tabs" aria-label={t('nav')}>
          {PAGES.map((x) => (
            <button key={x.id} data-tab={x.id} className={active === x.id ? 'on' : ''} aria-current={active === x.id ? 'true' : undefined} onClick={() => go(x.id)}>{lang === 'en' ? x.en : x.te}</button>
          ))}
        </nav>
      )}
      <Petals hide={active === 'glimpse'} />

      {entered && <Assistant lang={lang} />}
      {entered && EDIT_MODE && <LayoutEditor lang={lang} />}
      {entered && (
        <button className={'rsvp-fab' + (active === 'rsvp' ? ' on' : '')} onClick={() => go('rsvp')} aria-current={active === 'rsvp' ? 'true' : undefined} aria-label={lang === 'en' ? 'RSVP: tell us if you can come' : 'RSVP: మీరు వస్తారో తెలియజేయండి'}>RSVP</button>
      )}

      {!entered && (
        <div className={'gate' + (opening ? ' opening' : '')} onClick={enter} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') enter(); }} aria-label={t('enter')}>
          <div className="door l" style={{ backgroundImage: `url(${gate})` }} />
          <div className="door r" style={{ backgroundImage: `url(${gate})` }} />
          <span className="gate-in">
            <img className="ganesha" src={ganesha} alt="" loading="lazy" decoding="async" />
            <span className="gate-om">{lang === 'en' ? 'Sri Ganeshaya Namaha' : 'శ్రీ గణేశాయ నమః'}</span>
            <span className="gate-names">{lang === 'en' ? 'Bhavitha & Nagender' : 'భవిత & నాగేందర్'}</span>
            <span className="gate-h">{lang === 'en' ? 'Wedding Invitation' : 'శుభ వివాహ ఆహ్వానం'}</span>
            <span className="gate-t">{t('enter')}</span>
          </span>
        </div>
      )}

      <div className={'scroller'+(switching?' page-switching':'')} ref={scroller}>
      <section id="cover" data-sec="cover" className="sec cover">
        <div className="cover-bg" style={{ backgroundImage: `url(${homeArt})` }} aria-hidden="true" />
        {/* The couple's invitation artwork, with the live countdown placed in the space under its "Countdown" caption. */}
        <div className="cover-art">
          <div className="cover-art-top" aria-hidden="true" style={{ backgroundImage: `url(${lang === 'en' ? homeTopEn : homeTopTe})` }} />
          <img src={lang === 'en' ? homeArtEn : homeArtTe} alt={`${T.inviteLead.en} ${T.inviteSub.en} ${T.bride.en} & ${T.groom.en}. #NaGuddu`} />
          {/* English: the blessing lines, the welcome and the couple with their parents. Telugu: the same in Telugu, and the countdown caption. */}
          {lang === 'en' ? (
            <>
              <p className="cover-line cl-bless">Srirasthu <i>✦</i> Subhamasthu <i>✦</i> Avighnamasthu</p>
              <p className="cover-line cl-om">|| Om Sri Ganeshaya Namaha ||</p>
              <p className="cover-line cl-lead cl-en">With the blessings of Lord Ganesha and both our families,<br />and hearts full of love and gratitude,<br />we invite you to celebrate our wedding.</p>
              {/* Each name and each parents' line stays on one line. */}
              <div className="cover-line cl-couple">
                <p className="cl-who">Chi.La.Sow BHAVITHA REDDY GAJJELA</p>
                <p className="cl-kin">Younger D/o Smt. Rajitha Reddy Gajjela &amp; Shri Yadav Reddy Gajjela</p>
                <p className="cl-with">with</p>
                <p className="cl-who">Chi. NAGENDER REDDY GOLI</p>
                <p className="cl-kin">Elder S/o Smt. Laxmi Reddy Goli &amp; Shri Jayapal Reddy Goli (Late)</p>
              </div>
            </>
          ) : (
            <>
              <p className="cover-line cl-lead">శ్రీ గణేశుని మరియు ఇరు కుటుంబాల ఆశీస్సులతో,<br />ప్రేమ మరియు కృతజ్ఞతతో నిండిన హృదయాలతో,<br />మా వివాహ వేడుకకు మిమ్మల్ని ఆహ్వానిస్తున్నాము.</p>
              <p className="cover-line cl-sub">మా జీవిత ప్రయాణం మొదలయ్యే ఈ శుభవేళ,<br />మీ రాక మా ఆనందాన్ని సంపూర్ణం చేస్తుంది.</p>
              <div className="cover-line cl-couple">
                <p className="cl-who">చి.ల.సౌ. భవిత రెడ్డి గజ్జెల</p>
                <p className="cl-kin">శ్రీమతి రజిత రెడ్డి గజ్జెల &amp; శ్రీ యాదవ్ రెడ్డి గజ్జెల గార్ల చిన్న కుమార్తె</p>
                <p className="cl-with">తో</p>
                <p className="cl-who">చి. నాగేందర్ రెడ్డి గోలి</p>
                <p className="cl-kin">శ్రీమతి లక్ష్మి రెడ్డి గోలి &amp; కీ.శే. శ్రీ జయపాల్ రెడ్డి గోలి గార్ల పెద్ద కుమారుడు</p>
              </div>
              <p className="cover-line cl-cap">వివాహ వేడుకలకు కౌంట్‌డౌన్</p>
            </>
          )}
          <h1 className="sr-only">{T.bride.en} &amp; {T.groom.en}</h1>
          <div className="cover-count"><Countdown lang={lang} /></div>
        </div>
      </section>

      {EVENTS.map((ev) => ev.id === 'reception' ? <Cocktail key={ev.id} lang={lang} active={active === ev.id && entered} near={entered && ['vivaham', 'reception', 'glimpse'].includes(active)} paused={false}/> : <SavedEvent key={ev.id} id={ev.id} lang={lang} active={active === ev.id && entered} />)}

      <Glimpse lang={lang} />

      <section id="rsvp" data-sec="rsvp" className="sec rsvp">
        {/* One screen, like the event pages: a compact row per event (the event pages already give dates and times). */}
        <div className="card wide rsvp-compact">
          {status !== 'done' && <h2>{t('rsvpTitle')}</h2>}
          {status !== 'done' && <p className="blurb">{t('rsvpSub')}</p>}
          {status === 'done' ? (
            <div className="rsvp-done" role="status">
              <p className="rsvp-done-msg">{t('rsvpDone')}</p>
              <p className="rsvp-done-sub">{t('rsvpLanded')}</p>
              {emailed && <p className="rsvp-done-sub">{t('rsvpEmailed')}</p>}
              <p className="note">{t('rsvpChangeNote')}</p>
              <button className="btn" type="button" onClick={() => setStatus('idle')}>{t('rsvpChange')}</button>
            </div>
          ) : (
          <form onSubmit={sendRsvp} noValidate>
            <label className="field"><span className="sr-only">{t('yourName')}</span><input type="text" name="name" autoComplete="name" maxLength={80} placeholder={t('yourName')} value={guestName} onChange={(e) => { setGuestName(e.target.value); if (status === 'needName') setStatus('idle'); }} aria-invalid={status === 'needName'} /></label>
            <div className="rsvp-contact">
              <label className="field"><span className="sr-only">{t('yourEmail')}</span><input type="email" name="email" autoComplete="email" inputMode="email" maxLength={120} placeholder={t('yourEmail')} value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} /></label>
              <label className="field"><span className="sr-only">{t('yourPhone')}</span><input type="tel" name="phone" autoComplete="tel" inputMode="tel" maxLength={30} placeholder={t('yourPhone')} value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} /></label>
            </div>
            <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <ul className="rsvp-cards">
              {EVENTS.map((ev) => (
                <li key={ev.id} className={'rsvp-card' + (rsvp[ev.id] ? ' ' + rsvp[ev.id] : '')}>
                  <h3 className="rc-name">{lang === 'en' ? ev.en : ev.te}</h3>
                  <span className="seg">
                    <button type="button" aria-pressed={rsvp[ev.id] === 'yes'} className={rsvp[ev.id] === 'yes' ? 'on' : ''} onClick={() => setRsvp((r) => ({ ...r, [ev.id]: 'yes' }))}>{t('yes')}</button>
                    <button type="button" aria-pressed={rsvp[ev.id] === 'no'} className={rsvp[ev.id] === 'no' ? 'on no' : ''} onClick={() => setRsvp((r) => ({ ...r, [ev.id]: 'no' }))}>{t('no')}</button>
                  </span>
                  {rsvp[ev.id] === 'yes' && (
                    <div className="rc-more">
                      <p className="rc-label">{t('guests')}</p>
                      <div className="stepper" role="group" aria-label={t('guests')}>
                        <button type="button" aria-label="−" onClick={() => setGuests(ev.id, -1)}>−</button>
                        <output aria-live="polite">{party[ev.id]?.guests ?? 1}</output>
                        <button type="button" aria-label="+" onClick={() => setGuests(ev.id, 1)}>+</button>
                      </div>
                      <p className="rc-label">{t('meal')}</p>
                      <div className="chips">
                        {(['mealVeg', 'mealNonVeg'] as const).map((m) => (
                          <button key={m} type="button" aria-pressed={party[ev.id]?.meal === m} className={party[ev.id]?.meal === m ? 'on' : ''} onClick={() => setMeal(ev.id, m)}>
                            {t(m)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <label className="field rsvp-note"><span className="rsvp-note-title">{t('noteTitle')}</span><span className="rsvp-note-sub">{t('noteSub')}</span><textarea name="note" rows={2} maxLength={500} placeholder={t('yourNote')} value={contact.note} onChange={(e) => setContact((c) => ({ ...c, note: e.target.value }))} /></label>
            <p className={'rsvp-msg' + (status === 'error' || status === 'needName' || status === 'needEvent' ? ' bad' : '')} role="status" aria-live="polite">
              {status === 'needName' ? t('needName') : status === 'needEvent' ? t('needEvent') : status === 'error' ? t('rsvpFail') : status === 'preview' ? '✓ ' + (lang === 'en' ? 'Nothing was sent. This is a preview.' : 'ఏమీ పంపబడలేదు. ఇది నమూనా మాత్రమే.') : ''}
            </p>
            <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? t('sending') : t('send')}</button>
          </form>
          )}
          <p className="note">{SCRIPT_URL ? t('rsvpNoteLive') : t('rsvpNote')}</p>
        </div>
      </section>

      <section id="photos" data-sec="photos" className="sec photos">
        <div className="card wide photos-compact">
          <h2>{t('photosTitle')}</h2>
          <p className="blurb photos-sub">{t('photosSub')}</p>
          <p className="blurb photos-ask">{t('photosAsk')}</p>
          <PhotoUpload lang={lang} upload={t('upload')} kolam={<Kolam className="drop-k" />} />
          <Divider />
          <p className="thanks">{t('thanks')}</p>
          <p className="credits">{t('musicNote')}</p>
          <p className="photos-tag">#NaGuddu 🤍</p>
        </div>
      </section>
      </div>
     </div>
    </div>
  );
}
