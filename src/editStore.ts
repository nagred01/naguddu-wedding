import { useSyncExternalStore } from 'react';
import saved from './layoutEdits.json';
import type { Lang } from './i18n';

// Layout edits made in the local editor (http://localhost:8080/?edit). Keys are "page|mode|piece",
// e.g. "pasupu|phone|title". Offsets are in layout units (phone: the 390-wide canvas; desktop: the
// 1280-wide spread), so an edit looks the same on every screen size of that mode.
export type PieceEdit = {
  dx?: number; dy?: number;          // move
  scale?: number;                    // overall size
  w?: number; h?: number;            // width and height multipliers (pictures stretch; text boxes get wider or narrower)
  fs?: number;                       // text size multiplier
  font?: string;                     // font family
  text?: Partial<Record<Lang, string>>; // replacement wording (lines separated by new lines)
};
export type Edits = Record<string, PieceEdit>;

const LOCAL_KEY = 'naguddu-layout-edits';
// Edit mode only on this computer, never on the published site.
export const EDIT_MODE = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('edit');

// The browser copy, once started, holds the whole layout (so resets stick); it starts from the saved file.
function loadLocal(): Edits {
  try { const v = localStorage.getItem(LOCAL_KEY); return v ? JSON.parse(v) : (saved as Edits); } catch { return saved as Edits; }
}
let edits: Edits = EDIT_MODE ? loadLocal() : (saved as Edits);
const listeners = new Set<() => void>();
const publish = () => {
  if (EDIT_MODE) try { localStorage.setItem(LOCAL_KEY, JSON.stringify(edits)); } catch { /* storage unavailable: edits last for this visit */ }
  listeners.forEach((l) => l());
};

// Keep the desktop window and the phone-size editing window in step.
if (EDIT_MODE) window.addEventListener('storage', (e) => {
  if (e.key === LOCAL_KEY) { edits = loadLocal(); listeners.forEach((l) => l()); }
});

export const useEdits = () => useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => edits);
export const editKey = (page: string, mode: string, piece: string) => `${page}|${mode}|${piece}`;
export const getEdit = (key: string): PieceEdit => edits[key] || {};

export function setEdit(key: string, patch: PieceEdit) {
  const next = { ...edits[key], ...patch };
  // Drop values that are back to their defaults so the saved file stays small.
  (Object.keys(next) as (keyof PieceEdit)[]).forEach((k) => {
    const v = next[k] as unknown;
    if (v === undefined || ((k === 'dx' || k === 'dy') && v === 0) || ((k === 'scale' || k === 'fs' || k === 'w' || k === 'h') && v === 1) || (k === 'font' && v === '')) delete next[k];
  });
  edits = { ...edits };
  if (Object.keys(next).length) edits[key] = next; else delete edits[key];
  publish();
}

export function resetEdits(prefix: string) {
  edits = Object.fromEntries(Object.entries(edits).filter(([k]) => !k.startsWith(prefix)));
  publish();
}

export function replaceEdits(next: Edits) { edits = next; publish(); }

export function downloadEdits() {
  const blob = new Blob([JSON.stringify(edits, null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'layoutEdits.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
