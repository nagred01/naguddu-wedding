import React, { useState } from 'react';
import { type Lang } from './i18n';
import { SCRIPT_URL } from './config';

const MAX_SIDE = 2560;            // long edge after resizing: plenty for prints, small enough to upload quickly
const MAX_BYTES = 14 * 1024 * 1024;
const MAX_FILES = 30;

// Resizes a photo to MAX_SIDE as JPEG. Falls back to the original when the browser can't decode it (e.g. HEIC outside Safari).
async function prepare(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.type === 'image/jpeg' && file.size <= 4 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.88));
    return blob || file;
  } catch {
    return file;
  }
}

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

export function PhotoUpload({ lang, upload, kolam }: { lang: Lang; upload: string; kolam: React.ReactNode }) {
  const en = lang === 'en';
  const [name, setName] = useState('');
  const [state, setState] = useState<{ total: number; done: number; failed: number; busy: boolean } | null>(null);

  const send = async (files: File[]) => {
    const list = files.filter((f) => f.type.startsWith('image/')).slice(0, MAX_FILES);
    if (!list.length) return;
    let done = 0, failed = 0;
    setState({ total: list.length, done, failed, busy: true });
    for (const file of list) {
      try {
        const blob = await prepare(file);
        if (blob.size > MAX_BYTES) throw new Error('too big');
        const type = blob.type || file.type;
        const filename = blob === file ? file.name : file.name.replace(/\.[^.]+$/, '') + '.jpg';
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ type: 'photo', name: name.trim(), filename, mimeType: type, data: await toBase64(blob) }) });
        if (!(await res.json()).ok) throw new Error('rejected');
        done++;
      } catch {
        failed++;
      }
      setState({ total: list.length, done, failed, busy: true });
    }
    setState({ total: list.length, done, failed, busy: false });
  };

  if (!SCRIPT_URL) {
    return (
      <>
        <div className="drop" aria-disabled="true">{kolam}<span className="btn" aria-disabled="true">{upload}</span></div>
        <p className="note">{en ? 'Preview only: uploads are not connected yet. The plan is a Google Drive folder where guests can add photos but not see others.' : 'ఇది నమూనా మాత్రమే: అప్‌లోడ్ ఇంకా అనుసంధానం కాలేదు.'}</p>
      </>
    );
  }
  return (
    <>
      <label className="field"><span>{en ? 'Your name (optional)' : 'మీ పేరు (ఐచ్ఛికం)'}</span><input type="text" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="…" /></label>
      <div className="drop">
        {kolam}
        <label className={'btn' + (state?.busy ? ' busy' : '')} aria-disabled={state?.busy}>
          {state?.busy ? (en ? `Sending ${Math.min(state.done + state.failed + 1, state.total)} of ${state.total}…` : `${state.total}లో ${Math.min(state.done + state.failed + 1, state.total)} పంపుతున్నాం…`) : upload}
          <input type="file" accept="image/*" multiple hidden disabled={state?.busy} onChange={(e) => { send(Array.from(e.target.files || [])); e.target.value = ''; }} />
        </label>
      </div>
      <p className={'photo-msg' + (state && !state.busy && state.failed ? ' bad' : '')} role="status" aria-live="polite">
        {state && !state.busy && (state.done
          ? (en ? `✓ ${state.done} photo${state.done > 1 ? 's' : ''} sent to the couple. Thank you!` : `✓ ${state.done} ఫోటోలు వధూవరులకు చేరాయి. ధన్యవాదాలు!`)
          : '') + (state.failed ? (en ? ` ${state.failed} could not be sent; please try those again.` : ` ${state.failed} పంపలేకపోయాం; దయచేసి మళ్లీ ప్రయత్నించండి.`) : '')}
      </p>
      <p className="note">{en ? 'Photos go to a private folder that only the couple can see.' : 'ఫోటోలు వధూవరులకు మాత్రమే కనిపించే ప్రైవేట్ ఫోల్డర్‌కు వెళ్తాయి.'}</p>
    </>
  );
}
