// 효과음 & 관중 소리 & 장내 아나운서 (모두 WebAudio 로 합성)
export const Sound = {
  ctx: null, master: null, muted: false, voice: true, bed: null, roar: null, lastSqueak: 0, voices: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const a = this.ctx;
    this.master = a.createGain(); this.master.gain.value = 0.9; this.master.connect(a.destination);
    // 관중 웅성거림(베드) + 함성(로어)
    const noiseBuf = a.createBuffer(2, a.sampleRate * 4, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = noiseBuf.getChannelData(ch); let last = 0; for (let i = 0; i < d.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 6 + (Math.random() * 2 - 1) * 0.15; } }
    const mk = (freq, q, type) => { const src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true; const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = a.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(this.master); src.start(0, Math.random() * 3); return g; };
    this.bed = mk(500, 0.5, 'lowpass');
    this.roar = mk(1100, 0.6, 'bandpass');
    this.speechVoices();
  },
  speechVoices() {
    if (!window.speechSynthesis) return;
    const pick = () => { const v = speechSynthesis.getVoices(); this.voices = v.filter(x => /en[-_]US/i.test(x.lang)); };
    pick(); speechSynthesis.onvoiceschanged = pick;
  },
  setMute(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.9; if (m && window.speechSynthesis) speechSynthesis.cancel(); },
  t() { return this.ctx ? this.ctx.currentTime : 0; },

  tone(f, d, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
    const a = this.ctx; if (!a || this.muted) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d, vol = 0.2, freq = 3000, q = 1, type = 'bandpass', delay = 0, attack = 0.005) {
    const a = this.ctx; if (!a || this.muted) return;
    const t = a.currentTime + delay;
    const b = a.createBuffer(1, Math.max(1, a.sampleRate * d), a.sampleRate), c = b.getChannelData(0);
    for (let i = 0; i < c.length; i++) c[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.buffer = b; s.connect(f).connect(g).connect(this.master); s.start(t);
  },

  // ── 코트 사운드 ──
  dribble(v = 1) { if (v < 0.05) return; this.tone(70, 0.13, 'sine', 0.35 * v, -25); this.noise(0.05, 0.12 * v, 900, 1.2); },
  bounce(v = 1) { this.tone(85, 0.15, 'sine', 0.3 * v, -30); this.noise(0.05, 0.1 * v, 800); },
  squeak(v = 1) {
    if (!this.ctx || this.t() - this.lastSqueak < 0.09 || v < 0.08) return; this.lastSqueak = this.t();
    const f = 1700 + Math.random() * 1400; this.tone(f, 0.07 + Math.random() * 0.05, 'sine', 0.05 * v, 700 + Math.random() * 600);
    this.tone(f * 1.5, 0.05, 'triangle', 0.015 * v, 400);
  },
  swish() { this.noise(0.42, 0.32, 5200, 0.8, 'bandpass', 0, 0.03); this.noise(0.25, 0.1, 2500, 1, 'bandpass', 0.05); },
  rim(v = 1) { this.tone(430, 0.35, 'triangle', 0.13 * v); this.tone(1290, 0.18, 'sine', 0.05 * v); this.tone(2200, 0.08, 'square', 0.015 * v); },
  board() { this.tone(140, 0.16, 'square', 0.07, -50); this.noise(0.08, 0.12, 600); },
  catchBall() { this.noise(0.05, 0.12, 1500, 1.5); },
  whistle(long = false) {
    const d = long ? 0.75 : 0.32;
    for (const [f, v] of [[3150, 0.09], [3230, 0.06]]) {
      const a = this.ctx; if (!a || this.muted) return;
      const t = a.currentTime, o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
      o.frequency.value = f; lfo.frequency.value = 38; lg.gain.value = 90; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.02); g.gain.setValueAtTime(v, t + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(this.master); o.start(t); lfo.start(t); o.stop(t + d); lfo.stop(t + d);
    }
  },
  buzzer() { this.tone(196, 1.1, 'sawtooth', 0.13); this.tone(199, 1.1, 'square', 0.07); this.tone(98, 1.1, 'sawtooth', 0.06); },
  horn() { this.tone(300, 0.45, 'sawtooth', 0.08); this.tone(450, 0.45, 'square', 0.04); },
  shotClockBeep() { this.tone(1000, 0.12, 'square', 0.04); },

  // ── 관중 ──
  setCrowd(excite) {
    if (!this.ctx) return;
    this.crowdOn = true;
    const t = this.ctx.currentTime;
    this.bed.gain.setTargetAtTime(0.10 + excite * 0.12, t, 0.4);
    this.roar.gain.setTargetAtTime(Math.max(0, excite - 0.25) * 0.5, t, excite > 0.6 ? 0.08 : 0.6);
  },
  // 경기가 진행되지 않을 때(메뉴·일시정지·경기 종료) 관중 소리를 끈다. 다음 setCrowd 때 다시 켜진다.
  quiet(stopVoice = true) {
    if (!this.crowdOn) return;
    this.crowdOn = false;
    if (stopVoice && window.speechSynthesis) speechSynthesis.cancel();
    const t = this.ctx.currentTime;
    this.bed.gain.setTargetAtTime(0, t, 0.3);
    this.roar.gain.setTargetAtTime(0, t, 0.3);
  },
  // 탭을 닫거나 숨기면 모든 소리를 멈춘다. 아나운서 음성은 탭을 닫아도 브라우저에 남아 있을 수 있어 따로 취소한다.
  sleep() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  },
  wake() { if (this.ctx && this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume(); },
  cheer(big = 1) { this.noise(2.2 * big, 0.25 * big, 1300, 0.5, 'bandpass', 0, 0.15); for (let i = 0; i < 18 * big; i++) this.noise(0.03, 0.08, 2500 + Math.random() * 1500, 2, 'bandpass', Math.random() * 1.6); },
  groan() { this.noise(1.2, 0.14, 380, 0.8, 'lowpass', 0, 0.2); },
  oohh() { this.noise(0.9, 0.12, 700, 3, 'bandpass', 0, 0.1); },
  claps(n = 2, delay = 0) { for (let i = 0; i < n; i++) for (let k = 0; k < 10; k++) this.noise(0.04, 0.06, 1800 + Math.random() * 1200, 1.5, 'bandpass', delay + i * 0.32 + Math.random() * 0.04); },
  defenseChant() { // "DE-FENSE" + 박수 두 번
    this.noise(0.28, 0.12, 520, 4, 'bandpass', 0, 0.04); this.noise(0.28, 0.06, 1100, 5, 'bandpass', 0, 0.04);
    this.noise(0.35, 0.14, 650, 4, 'bandpass', 0.38, 0.04); this.noise(0.35, 0.07, 1500, 5, 'bandpass', 0.38, 0.04);
    this.claps(2, 0.85);
  },
  organ(kind = 'charge') {
    const notes = kind === 'charge' ? [[392, 0], [523, 0.16], [659, 0.32], [784, 0.48], [659, 0.72], [784, 0.86]] : [[523, 0], [587, 0.2], [659, 0.4], [523, 0.6], [784, 0.8]];
    for (const [f, d] of notes) { this.tone(f, 0.22, 'square', 0.035, 0, d); this.tone(f * 2, 0.22, 'sine', 0.03, 0, d); this.tone(f / 2, 0.22, 'triangle', 0.04, 0, d); }
  },

  // ── 장내 아나운서 (영어 음성) ──
  say(text, prio = false) {
    if (!this.voice || this.muted || !window.speechSynthesis || document.hidden) return;
    if (prio) speechSynthesis.cancel(); else if (speechSynthesis.speaking) return;
    const u = new SpeechSynthesisUtterance(text);
    if (this.voices && this.voices.length) u.voice = this.voices.find(v => /male|david|guy|mark/i.test(v.name)) || this.voices[0];
    u.rate = 1.08; u.pitch = 0.85; u.volume = 0.95;
    speechSynthesis.speak(u);
  },
};

document.addEventListener('visibilitychange', () => { document.hidden ? Sound.sleep() : Sound.wake(); });
window.addEventListener('pagehide', () => Sound.sleep());
window.addEventListener('pageshow', () => Sound.wake());
