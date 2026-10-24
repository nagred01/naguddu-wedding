import React, { useEffect, useRef, useState } from 'react';
import { downloadEdits, editKey, getEdit, replaceEdits, resetEdits, setEdit, useEdits, type Edits } from './editStore';
import type { Lang } from './i18n';

// Local-only editor for the event pages: click a piece to select it, drag to move it, and use the
// panel for size, text size, font and wording. Opened with http://localhost:8080/?edit.

const PIECES: Record<string, string> = {
  ganesha: 'Ganesha', title: 'Title', details: 'Date / time / venue',
  image1: 'Left picture', image2: 'Right picture', map: 'Open in Maps button', number: 'Number',
  kicker: 'Names line', sub: 'Subtitle', theme: 'Theme line', date: 'Date', time: 'Time', venue: 'Venue', dress: 'Dress code',
};
const PAGES: Record<string, string> = { pasupu: 'Haldi', mehandi: 'Mehendi', pellikuthuru: 'Pellikuthuru / Pellikoduku', vivaham: 'Wedding', reception: 'Cocktail' };
const FONTS: [string, string][] = [
  ['', 'Default'],
  ["'Cinzel', Georgia, serif", 'Cinzel (titles)'],
  ['Georgia, serif', 'Georgia (text)'],
  ["'Times New Roman', serif", 'Times New Roman'],
  ["'Noto Serif Telugu', 'Telugu Sangam MN', serif", 'Telugu serif'],
  ['system-ui, sans-serif', 'Sans-serif'],
];
const WORDING = new Set(['title', 'kicker', 'sub', 'theme', 'date', 'time', 'venue', 'dress', 'map']);
type Sel = { page: string; mode: string; piece: string };

export function LayoutEditor({ lang }: { lang: Lang }) {
  useEdits(); // re-render when edits change
  const [sel, setSel] = useState<Sel | null>(null);
  const [hidden, setHidden] = useState(false);
  const [draft, setDraft] = useState('');
  const drag = useRef<{ sx: number; sy: number; dx: number; dy: number; unit: number; key: string } | null>(null);
  const key = sel ? editKey(sel.page, sel.mode, sel.piece) : '';
  const edit = key ? getEdit(key) : {};

  const pieceEl = (s: Sel) => document.querySelector<HTMLElement>(`[data-sec="${s.page}"] [data-piece="${s.piece}"]`);
  const pieceLabel = (piece: string) => PIECES[piece] || (piece.startsWith('extra-') ? 'Extra label' : piece);

  // Wording box shows the saved wording, or what the page shows now.
  useEffect(() => {
    if (!sel || !WORDING.has(sel.piece)) return;
    const saved = getEdit(key).text?.[lang];
    const el = pieceEl(sel);
    setDraft(saved ?? (el ? [...el.childNodes].map((n) => n.textContent).filter(Boolean).join('\n') : ''));
  }, [key, lang]);

  // Select and drag pieces on the event pages.
  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.le-panel')) return;
      const el = t.closest<HTMLElement>('[data-editable] [data-piece]');
      if (!el) return;
      const sec = el.closest<HTMLElement>('[data-editable]')!;
      const s = { page: sec.dataset.sec!, mode: sec.dataset.mode!, piece: el.dataset.piece! };
      const k = editKey(s.page, s.mode, s.piece);
      const cur = getEdit(k);
      setSel(s);
      drag.current = { sx: e.clientX, sy: e.clientY, dx: cur.dx || 0, dy: cur.dy || 0, unit: Number(sec.dataset.unit) || 1, key: k };
      e.preventDefault(); e.stopPropagation();
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const r = (v: number) => Math.round(v * 2) / 2;
      setEdit(d.key, { dx: r(d.dx + (e.clientX - d.sx) / d.unit), dy: r(d.dy + (e.clientY - d.sy) / d.unit) });
    };
    const up = () => { drag.current = null; };
    const key = (e: KeyboardEvent) => {
      if (!sel || (e.target as HTMLElement).closest('textarea, input, select')) return;
      const step = e.shiftKey ? 10 : 1;
      const dir: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (!dir[e.key]) return;
      e.preventDefault();
      const k = editKey(sel.page, sel.mode, sel.piece); const cur = getEdit(k);
      setEdit(k, { dx: (cur.dx || 0) + dir[e.key][0], dy: (cur.dy || 0) + dir[e.key][1] });
    };
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', key);
    };
  }, [sel]);

  // Read the current value at click time, so quick repeated clicks all count.
  const step = (field: 'scale' | 'fs', by: number) => setEdit(key, { [field]: Math.round(((getEdit(key)[field] || 1) + by) * 100) / 100 });
  const nudge = (x: number, y: number) => { const cur = getEdit(key); setEdit(key, { dx: (cur.dx || 0) + x, dy: (cur.dy || 0) + y }); };
  const loadFile = async (f?: File) => { if (f) try { replaceEdits(JSON.parse(await f.text()) as Edits); } catch { alert('That file is not a saved layout.'); } };
  const pct = (v?: number) => Math.round((v || 1) * 100) + '%';

  return (
    <>
      {/* Outline every piece and highlight the selected one. */}
      <style>{`[data-editable] [data-piece]{outline:1px dashed rgba(63,208,255,.55);cursor:move;pointer-events:auto!important;touch-action:none}
        ${sel ? `[data-sec="${sel.page}"] [data-piece="${sel.piece}"]{outline:2px solid #3fd0ff!important;outline-offset:2px}` : ''}`}</style>
      <div className={'le-panel' + (hidden ? ' le-min' : '')}>
        <div className="le-head">
          <b>Layout editor</b>
          <button onClick={() => setHidden(!hidden)}>{hidden ? 'Show' : 'Hide'}</button>
        </div>
        {!hidden && (
          <>
            <p className="le-mode">
              Editing the <b>{window.innerWidth >= 900 ? 'desktop' : 'phone'}</b> layout ({lang === 'en' ? 'English' : 'Telugu'} wording).{' '}
              {window.innerWidth >= 900 && <button onClick={() => window.open(location.href, 'naguddu-phone', 'width=410,height=900')}>Open phone window</button>}
            </p>
            {!sel ? (
              <p className="le-hint">Click any title, picture, details or button on an event page to select it. Drag to move; arrow keys nudge (Shift = bigger steps).</p>
            ) : (
              <div className="le-body">
                <p className="le-sel">{PAGES[sel.page] || sel.page} · <b>{pieceLabel(sel.piece)}</b> <span>({sel.mode})</span></p>
                <div className="le-row"><span>Move</span>
                  <button onClick={() => nudge(-1, 0)}>←</button>
                  <button onClick={() => nudge(0, -1)}>↑</button>
                  <button onClick={() => nudge(0, 1)}>↓</button>
                  <button onClick={() => nudge(1, 0)}>→</button>
                </div>
                <div className="le-row"><span>Size</span><button onClick={() => step('scale', -0.05)}>−</button><output>{pct(edit.scale)}</output><button onClick={() => step('scale', 0.05)}>+</button></div>
                <div className="le-row"><span>Text size</span><button onClick={() => step('fs', -0.05)}>−</button><output>{pct(edit.fs)}</output><button onClick={() => step('fs', 0.05)}>+</button></div>
                <label className="le-row"><span>Font</span>
                  <select value={edit.font || ''} onChange={(e) => setEdit(key, { font: e.target.value })}>
                    {FONTS.map(([v, n]) => <option key={n} value={v}>{n}</option>)}
                  </select>
                </label>
                {WORDING.has(sel.piece) && (
                  <label className="le-words"><span>Wording ({lang === 'en' ? 'English' : 'Telugu'}){sel.piece === 'title' && sel.page !== 'reception' ? ' — 2nd line is the subtitle' : ''}</span>
                    <textarea rows={2} value={draft} onChange={(e) => { setDraft(e.target.value); setEdit(key, { text: { ...getEdit(key).text, [lang]: e.target.value } }); }} />
                    <small>Switch the site language (top right) to edit the other language.</small>
                  </label>
                )}
                <div className="le-row"><button onClick={() => { resetEdits(key); setSel({ ...sel }); }}>Reset this piece</button><button onClick={() => setSel(null)}>Done</button></div>
              </div>
            )}
            <div className="le-foot">
              <button className="le-save" onClick={downloadEdits}>Save layout</button>
              <label className="le-load">Load file<input type="file" accept=".json,application/json" hidden onChange={(e) => loadFile(e.target.files?.[0])} /></label>
              {sel && <button onClick={() => confirm(`Reset all ${sel.mode} changes on ${PAGES[sel.page] || sel.page}?`) && resetEdits(`${sel.page}|${sel.mode}|`)}>Reset page</button>}
            </div>
            <p className="le-hint">Changes are kept in this browser as you go. "Save layout" downloads <b>layoutEdits.json</b>: send that file to Claude to publish it.</p>
          </>
        )}
      </div>
    </>
  );
}
