import React, { useEffect, useRef, useState } from 'react';
import { T, type Lang } from './i18n';
import { editKey, useEdits } from './editStore';
import homeArt from './img/home-invite.webp';
// The same artwork with one language's words painted out, so those lines can be set as live text in the other language.
import homeArtEn from './img/home-invite-en.webp';
import homeArtTe from './img/home-invite-te.webp';

// Home invitation card: the artwork with live lines and the countdown on top. Every line and the countdown can be
// moved, resized, restyled and reworded in the local layout editor (offsets are in 1/400ths of the card's width).
export function HomeCard({ lang, countdown }: { lang: Lang; countdown: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setCardW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const edits = useEdits();
  const mode = typeof window !== 'undefined' && window.innerWidth >= 900 ? 'desktop' : 'phone';
  const unit = cardW / 400;
  const E = (p: string) => edits[editKey('cover', mode, p)] || {};
  const place = (p: string): React.CSSProperties => {
    const d = E(p);
    return {
      marginLeft: (d.dx || 0) * unit, marginTop: (d.dy || 0) * unit, scale: d.scale ? String(d.scale) : undefined,
      width: d.w ? `calc(80% * ${d.w})` : undefined, ['--fs' as any]: d.fs || undefined, ['--piece-font' as any]: d.font || undefined,
    };
  };
  // A line of the card: the editor's wording if set (one row per line), otherwise the built-in lines.
  const line = (p: string, cls: string, rows: React.ReactNode[]) => {
    const d = E(p);
    const words = d.text?.[lang]?.split('\n');
    const shown = words ?? rows;
    return (
      <p className={'cover-line ' + cls} data-piece={p} data-wh="w" data-font={d.font ? '' : undefined} style={place(p)}>
        {shown.map((r, n) => <React.Fragment key={n}>{n > 0 && <br />}{r}</React.Fragment>)}
      </p>
    );
  };
  const c = E('countdown');
  return (
    <section id="cover" data-sec="cover" data-editable="" data-mode={mode} data-unit={unit} className="sec cover">
      <div className="cover-bg" style={{ backgroundImage: `url(${homeArt})` }} aria-hidden="true" />
      <div className="cover-art" ref={ref}>
        <img src={lang === 'en' ? homeArtEn : homeArtTe} alt="" />
        {/* English: the blessing lines at the top. Telugu: the welcome, both names and the countdown caption. */}
        {lang === 'en' ? (
          <>
            {line('blessing', 'cl-bless', [<>Srirasthu <i>✦</i> Subhamasthu <i>✦</i> Avighnamasthu</>])}
            {line('om', 'cl-om', ['|| Om Sri Ganeshaya Namaha ||'])}
            <p className="sr-only">{T.inviteLead.en} {T.inviteSub.en} {T.bride.en} &amp; {T.groom.en}. #NaGuddu</p>
          </>
        ) : (
          <>
            {line('welcome', 'cl-lead', ['ఇరు కుటుంబాల ఆశీస్సులతో,', 'ప్రేమ మరియు కృతజ్ఞతతో నిండిన హృదయాలతో,', 'మా వివాహ వేడుకకు మిమ్మల్ని ఆహ్వానిస్తున్నాము.'])}
            {line('message', 'cl-sub', ['మా జీవిత ప్రయాణం మొదలయ్యే ఈ శుభవేళ,', 'మీ రాక మా ఆనందాన్ని సంపూర్ణం చేస్తుంది.'])}
            {line('bride', 'cl-name cl-bride', ['భవిత రెడ్డి', 'గజ్జెల'])}
            {line('groom', 'cl-name cl-groom', ['నాగేందర్ రెడ్డి', 'గోలి'])}
            {line('caption', 'cl-cap', ['వివాహ వేడుకలకు కౌంట్‌డౌన్'])}
          </>
        )}
        <h1 className="sr-only">{T.bride.en} &amp; {T.groom.en}</h1>
        <div className="cover-count" data-piece="countdown" data-wh="" style={{ marginLeft: (c.dx || 0) * unit, marginTop: (c.dy || 0) * unit, scale: c.scale || c.fs ? String((c.scale || 1) * (c.fs || 1)) : undefined }}>{countdown}</div>
      </div>
    </section>
  );
}
