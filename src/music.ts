import cover from './audio/cover.mp3';
import pasupu from './audio/pasupu.mp3';
import mehandi from './audio/mehandi.mp3';
import pellikuthuru from './audio/pellikuthuru.mp3';
import vivaham from './audio/vivaham.m4a'; // the couple's wedding song, Wedding page only
import reception from './audio/reception.mp3';

const SRC: Record<string, string> = { cover, pasupu, mehandi, pellikuthuru, vivaham, reception, rsvp: cover, photos: cover, glimpse: cover };
// Web Audio is used instead of <audio>: the host serves files without Range support, which iPhone Safari needs for <audio>.
class Player {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  bufs = new Map<string, AudioBuffer>();
  loading = new Map<string, Promise<AudioBuffer>>();
  cur: { src: string; gain: GainNode; node: AudioBufferSourceNode } | null = null;
  want = '';
  muted = false;
  state = 'idle';
  analyser: AnalyserNode | null = null;
  energyFrame = 0;
  paused = false;
  setPaused(p: boolean) { this.paused = p; if(this.ctx) p ? this.ctx.suspend() : this.ctx.resume(); }
  private trackEnergy() {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    let last = 0;
    let smoothEnergy = 0;
    const tick = (now: number) => {
      if (now - last > 65 && !document.hidden && !this.paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.analyser!.getByteFrequencyData(data);
        let sum = 0; for (let i=2;i<22;i++) sum += data[i];
        // Low-pass the soundtrack energy over about two seconds, avoiding beat flashes.
        smoothEnergy += (sum / 20 / 255 - smoothEnergy) * .035;
        document.querySelector<HTMLElement>('.stage')?.style.setProperty('--music-energy', String(smoothEnergy));
        last = now;
      }
      this.energyFrame = requestAnimationFrame(tick);
    };
    this.energyFrame = requestAnimationFrame(tick);
  }
  private publish() { (window as any).__musicState = this.state; }
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    try { (navigator as any).audioSession && ((navigator as any).audioSession.type = 'playback'); } catch { /* ignore */ }
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) { this.state = 'no-webaudio'; this.publish(); return; }
    this.ctx = new C() as AudioContext;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 256;
    this.master.connect(this.analyser); this.analyser.connect(this.ctx.destination);
    this.trackEnergy();
    const b = this.ctx.createBuffer(1, 1, 22050); const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0);
    this.ctx.resume();
    this.state = 'started'; this.publish();
  }
  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.15);
  }
  private load(src: string): Promise<AudioBuffer> {
    const have = this.bufs.get(src); if (have) return Promise.resolve(have);
    let p = this.loading.get(src);
    if (!p) {
      p = fetch(src).then((r) => r.arrayBuffer()).then((ab) => new Promise<AudioBuffer>((res, rej) => this.ctx!.decodeAudioData(ab, res, rej)))
        .then((b) => { this.bufs.set(src, b); this.loading.delete(src); return b; });
      p.catch(() => { this.loading.delete(src); this.state = 'load-error'; this.publish(); });
      this.loading.set(src, p);
    }
    return p;
  }
  async play(id: string) {
    this.want = id;
    if (!this.ctx || !this.master) return;
    const src = SRC[id] || SRC.cover;
    if (this.cur?.src === src) return;
    let buf: AudioBuffer;
    try { buf = await this.load(src); } catch { return; }
    if (this.want !== id || !this.ctx || !this.master) return;
    if (this.cur?.src === src) return;
    const ctx = this.ctx; const t = ctx.currentTime;
    const old = this.cur;
    if (old) {
      old.gain.gain.cancelScheduledValues(t); old.gain.gain.setValueAtTime(old.gain.gain.value, t); old.gain.gain.linearRampToValueAtTime(0, t + 1.2);
      try { old.node.stop(t + 1.3); } catch { /* ignore */ }
    }
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + 1.5);
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true; n.connect(g); g.connect(this.master); n.start(0);
    this.cur = { src, gain: g, node: n };
    this.state = 'playing:' + id; this.publish();
    // free decoded buffers that are not current or next to save memory on phones
    for (const k of Array.from(this.bufs.keys())) if (k !== src && this.bufs.size > 3) this.bufs.delete(k);
    this.preloadNext(id);
  }
  private preloadNext(id: string) {
    const order = ['cover', 'pasupu', 'mehandi', 'pellikuthuru', 'vivaham', 'reception'];
    const i = order.indexOf(id); const nx = order[i + 1];
    if (nx && SRC[nx]) this.load(SRC[nx]).catch(() => {});
  }
}
export const player = new Player();
