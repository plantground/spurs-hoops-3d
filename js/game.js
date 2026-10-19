import * as THREE from 'three';
import { SPURS, TEAMS } from './data.js';
import { HX, HZ, RIM_Y, RIM_R, BALL_R, RIM_X, BOARD_X, buildArena, buildCrowd, buildPerson, makeBall } from './models.js';
import { Sound } from './audio.js';

// ───────────────────────── helpers ─────────────────────────
const GRAV = 9.8;
const $ = id => document.getElementById(id);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distH = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const lastName = n => { const s = n.split(' '); let l = s[s.length - 1]; if (/^(Jr\.?|II|III)$/.test(l) && s.length > 2) l = s[s.length - 2]; return l.replace(/\.$/, ''); };
const ORD = ['first', 'second', 'third', 'fourth'];

// ───────────────────────── three.js setup ─────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080d);
scene.fog = new THREE.Fog(0x07080d, 40, 85);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
function fitCamera() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1.7 ? Math.min(70, 42 * Math.pow(1.7 / camera.aspect, 0.7)) : 42;
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', fitCamera); fitCamera();
scene.add(new THREE.HemisphereLight(0xe6edff, 0x2a2018, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.7);
sun.position.set(4, 26, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 13, bottom: -13, near: 1, far: 60 });
sun.shadow.bias = -0.0004; scene.add(sun);
for (const x of [-10, 0, 10]) { const l = new THREE.PointLight(0xfff2dd, 20, 32, 1.6); l.position.set(x, 11, 0); scene.add(l); }

const { nets, ledMats } = buildArena(scene, renderer);
const crowd = buildCrowd(scene);
const ballMesh = makeBall(); ballMesh.castShadow = true; scene.add(ballMesh);

// team 0 (SAS) attacks HOOPS[0]; sides flip at halftime
const HOOPS = [V(RIM_X, RIM_Y, 0), V(-RIM_X, RIM_Y, 0)];
const sgn = t => Math.sign(HOOPS[t].x);
function setSides(flip) { G.flip = flip; HOOPS[0].x = flip ? -RIM_X : RIM_X; HOOPS[1].x = -HOOPS[0].x; }

// ───────────────────────── people ─────────────────────────
const SHOES = ['#f1f1f1', '#111111', '#f1f1f1', '#c4ced4', '#111111'];
class Player {
  constructor(team, d, uni, starter) {
    this.team = team; this.d = d; this.starter = starter;
    this.name = d.n; this.num = d.num; this.cm = d.cm; this.h = d.cm / 100; this.ovr = d.ovr; this.three = d.three;
    this.ft = clamp(0.62 + (d.three - 0.8) * 0.6 + (d.ovr - 78) * 0.006, 0.45, 0.93);
    this.lefty = d.x.includes('lefty');
    this.reach = this.h * 1.31 * (d.x.includes('long') ? 1.03 : 1);
    this.speedBase = 5.3 * (0.9 + (d.ovr - 70) / 260) * (this.h > 2.1 ? 0.95 : 1) * (d.build > 1.18 ? 0.94 : 1);
    this.pos = V(); this.vel = V(); this.prevVel = V(); this.face = 0; this.jumpY = 0; this.jumpV = 0; this.hang = 0; this.hangY = 0;
    this.stamina = 100; this.pf = 0; this.fouledOut = false;
    this.box = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, min: 0 };
    this.onCourt = false; this.slot = -1; this.isUser = false; this.seated = false;
    this.ph = Math.random() * 6; this.dph = 0; this.dh = this.lefty ? 0 : 1; this.crossT = 0; this.crossCd = 0; this.lastB = 1;
    this.follow = 0; this.passT = 0; this.celebrate = 0; this.clap = 0;
    this.spot = null; this.spotT = 0; this.aiT = 0; this.holdT = 0; this.holdLimit = 2; this.stealCd = 0; this.jumpDelay = 0;
    this.drive = null; this.driveT = 0; this.crash = false; this.shooting = null; this.oob = false; this.target = null; this.stance = false; this.man = null;
    const outfit = { ...uni, num: d.num, name: lastName(d.n).toUpperCase() };
    this.rig = buildPerson({ h: this.h, build: d.build, look: d, outfit, shoe: SHOES[Math.floor(Math.random() * SHOES.length)], sock: Math.random() < 0.7 ? '#f4f4f4' : '#111' });
    scene.add(this.rig.root);
  }
  get grounded() { return this.jumpY === 0 && this.jumpV === 0 && this.hang <= 0; }
  jump(v) { if (this.grounded) this.jumpV = v; }
  get fwd() { return V(Math.sin(this.face), 0, Math.cos(this.face)); }
  get speed() { return this.speedBase * (0.8 + 0.2 * clamp(this.stamina / 70, 0, 1)); }
  get fatigue() { return 0.86 + 0.14 * clamp(this.stamina / 60, 0, 1); }
  dispose() { scene.remove(this.rig.root); }
}
class Ref {
  constructor(i) {
    this.isRef = true; this.role = ['center', 'trail', 'lead'][i]; this.h = [1.86, 1.9, 1.83][i];
    this.pos = V(0, 0, i === 1 ? HZ + 0.8 : -HZ - 0.75); this.vel = V(); this.prevVel = V(); this.face = 0;
    this.jumpY = 0; this.jumpV = 0; this.hang = 0; this.ph = 0; this.sig = null; this.lefty = false;
    this.rig = buildPerson({ h: this.h, build: 1.06, look: { skin: [1, 4, 0][i], hair: ['buzz', 'bald', 'short'][i], hc: ['g', 'k', 'b'][i], beard: ['n', 'b', 's'][i], x: [] }, outfit: { kind: 'ref', num: ['14', '27', '63'][i] } });
    this.rig.ring.visible = false; scene.add(this.rig.root);
  }
  get fwd() { return V(Math.sin(this.face), 0, Math.cos(this.face)); }
}
const refs = [0, 1, 2].map(i => new Ref(i));

// ───────────────────────── state ─────────────────────────
const G = {
  state: 'menu', phase: 'live', score: [0, 0], q: 1, qLen: 180, clock: 180, shot: 24, dead: 0, onDead: null, offense: 0, oppKey: null,
  cam: 0, call: 0, meter: null, diff: 1, paused: false, flip: false, teamFouls: [0, 0], front: false, eight: 0, whistled: false,
  inb: null, ft: null, jb: null, tipWinner: 0, excite: 0.2, crowdMode: '', chantT: 2, autoSub: true, subQ: [], subPanel: false, collCd: 0, keep: [], crowdT: 0,
};
let roster = [[], []], teams = [[], []], onCourt = [], T = 0;
const ball = { pos: V(0, 1, 0), vel: V(), state: 'dead', holder: null, shot: null, pass: null, lastTeam: 0, noGrab: 0, lastPasser: null, passAt: -99, passTime: 0, cut: new Set() };
const user = () => teams[0][4];

function msg(text, color = '#fff', sub = '', dur = 1.6) {
  const m = $('msg'); m.textContent = text; m.style.color = color; m.style.opacity = 1;
  const s = $('sub'); s.textContent = sub; s.style.opacity = sub ? 1 : 0;
  clearTimeout(msg._t); msg._t = setTimeout(() => { m.style.opacity = 0; s.style.opacity = 0; }, dur * 1000);
}
const teamCol = t => (t === 0 ? '#ffd21f' : '#6aa8ff');

// ───────────────────────── game setup ─────────────────────────
function newGame(oppKey) {
  for (const p of [...roster[0], ...roster[1]]) p.dispose();
  G.oppKey = oppKey;
  const opp = TEAMS[oppKey];
  const su = { kind: 'jersey', bg: '#ffc928', fg: '#111111', fg2: '#111111', top: 'SPURS', stroke: '#ffffff', sleeve: '#111111' };
  const ou = { kind: 'jersey', bg: '#1d4fd6', fg: '#ffffff', fg2: '#ffffff', top: oppKey, stroke: '#0b1f5c', sleeve: '#0b1f5c' };
  roster = [
    [...SPURS.starters.map(d => new Player(0, d, su, true)), ...SPURS.bench.map(d => new Player(0, d, su, false))],
    [...opp.starters.map(d => new Player(1, d, ou, true)), ...opp.bench.map(d => new Player(1, d, ou, false))],
  ];
  teams = [roster[0].slice(0, 5), roster[1].slice(0, 5)];
  teams.forEach(tm => tm.forEach((p, i) => { p.onCourt = true; p.slot = i; }));
  refreshCourt();
  Object.assign(G, { score: [0, 0], q: 1, clock: G.qLen, shot: 24, dead: 0, onDead: null, call: 0, meter: null, paused: false, state: 'play', teamFouls: [0, 0], subQ: [], keep: [], excite: 0.4, whistled: false });
  setSides(false);
  $('oppAb').textContent = oppKey;
  startJumpBall();
}

function refreshCourt() {
  onCourt = [...teams[0], ...teams[1]];
  for (const t of [0, 1]) {
    roster[t].filter(p => !p.onCourt).forEach((p, k) => {
      p.seated = true; p.pos.set((t === 0 ? -1 : 1) * (4 + k * 0.9), 0, -9.42); p.vel.set(0, 0, 0); p.face = 0; p.jumpY = 0; p.jumpV = 0; p.hang = 0;
      p.shooting = null; p.oob = false; p.stance = false; p.isUser = false;
    });
    teams[t].forEach(p => { p.seated = false; });
  }
  for (const p of [...roster[0], ...roster[1]]) {
    p.isUser = p === teams[0][4];
    p.rig.marker.visible = p.isUser;
    p.rig.ring.visible = p.onCourt;
    p.rig.ring.material.color.set(p.isUser ? 0xffe600 : p.team === 0 ? 0xffc928 : 0x3b82f6);
    p.rig.ring.material.opacity = p.isUser ? 0.95 : 0.4;
  }
  $('keys').innerHTML = keysHtml();
}

function keysHtml() {
  const mates = teams[0].filter(p => !p.isUser).map((p, i) => `<kbd>${i + 1}</kbd> ${lastName(p.name)}`).join(' &nbsp;');
  return `<div><kbd>WASD</kbd> 이동 <kbd>Shift</kbd> 터보 <kbd>C</kbd> 카메라 <kbd>Tab</kbd> 교체</div>
  <div><kbd>Space</kbd> 슛·점프·블록 &nbsp;<kbd>E</kbd> 패스·요청·스틸 &nbsp;<kbd>M</kbd> 소리 <kbd>N</kbd> 해설</div><div>${mates}</div>`;
}

function formation(team) { // teleport for quarter starts
  const s = sgn(team);
  const offF = [[-2.5, 3.5], [-3, -3], [1.5, 4.5], [2.5, -2.5], [3.5, 1.5]];
  const defF = [[2, 2.5], [3.5, -2.5], [4.5, 4], [6.5, -1.6], [7.5, 1.2]];
  teams[team].forEach((p, i) => p.pos.set(offF[i][0] * s, 0, offF[i][1]));
  teams[1 - team].forEach((p, i) => p.pos.set(defF[i][0] * s, 0, defF[i][1]));
  for (const p of onCourt) resetMotion(p);
}
function resetMotion(p) { p.vel.set(0, 0, 0); p.jumpY = 0; p.jumpV = 0; p.hang = 0; p.shooting = null; p.drive = null; p.spot = null; p.jumpDelay = 0; p.oob = false; p.target = null; p.follow = 0; }

function giveBall(p, reset = false) {
  const changed = G.offense !== p.team;
  ball.state = 'held'; ball.holder = p; ball.pass = null; ball.shot = null; ball.vel.set(0, 0, 0);
  ball.lastTeam = p.team; G.offense = p.team;
  if (changed || reset) { G.shot = 24; ball.lastPasser = null; G.front = p.pos.x * sgn(p.team) > 0; G.eight = 0; }
  p.holdT = 0; p.holdLimit = rand(1.2, 3.4); p.aiT = rand(0.2, 0.5); p.drive = null;
  Sound.catchBall();
}

function deadBall(time, next) {
  G.phase = 'dead'; G.dead = time; G.onDead = next; G.whistled = false; G.meter = null;
  for (const p of onCourt) { if (p.shooting && !p.shooting.ftShot) p.shooting = null; p.stance = false; }
  processSubs();
}

// ───────────────────────── substitutions ─────────────────────────
function bench(t) { return roster[t].filter(p => !p.onCourt && !p.fouledOut); }
function bestBench(t, out, minSt = 0) {
  const c = bench(t).filter(b => b.stamina >= minSt);
  c.sort((a, b) => (Math.abs(a.h - out.h) * 3 - a.ovr * 0.03 - a.stamina * 0.01) - (Math.abs(b.h - out.h) * 3 - b.ovr * 0.03 - b.stamina * 0.01));
  return c[0];
}
function doSub(t, slot, inP, quiet) {
  const out = teams[t][slot];
  if (!out || !inP || inP.onCourt || G.keep.includes(out)) return false;
  inP.onCourt = true; inP.slot = slot; inP.pos.copy(out.pos); inP.face = out.face; resetMotion(inP); inP.ftSpot = out.ftSpot;
  out.onCourt = false; out.slot = -1; resetMotion(out);
  if (ball.holder === out) ball.holder = inP;
  if (G.inb && G.inb.passer === out) G.inb.passer = inP;
  teams[t][slot] = inP;
  refreshCourt();
  if (!quiet) {
    Sound.horn();
    $('subline').textContent = `교체 ${t === 0 ? 'SAS' : G.oppKey}: ${lastName(inP.name)} IN · ${lastName(out.name)} OUT`;
    $('subline').style.opacity = 1; clearTimeout(doSub._t); doSub._t = setTimeout(() => { $('subline').style.opacity = 0; }, 2600);
    if (t === 0) Sound.say(`Now entering the game for the Spurs, ${lastName(inP.name)}`);
    refSignal('sub');
  }
  return true;
}
function processSubs() {
  for (const t of [0, 1]) for (let s = 0; s < 5; s++) {
    const p = teams[t][s];
    if (p.fouledOut) { const inn = bestBench(t, p); if (inn) { doSub(t, s, inn); if (t === 0 && s === 4) msg('웸반야마 퇴장!', '#ff7b7b', `${inn.name} 를 조종합니다`, 2.5); } }
  }
  for (const [out, inn] of G.subQ) if (out.onCourt && out.team === 0 && !inn.onCourt && !inn.fouledOut) doSub(0, out.slot, inn);
  G.subQ = [];
  for (const t of [0, 1]) {
    if (t === 0 && !G.autoSub) continue;
    for (let s = 0; s < 5; s++) {
      if (t === 0 && s === 4) continue;
      const p = teams[t][s];
      if (p.stamina < 52) { const inn = bestBench(t, p, 75); if (inn) doSub(t, s, inn); }
    }
    for (const st of bench(t).filter(b => b.starter && b.stamina > 88)) {
      const cand = teams[t].filter(p => !p.starter && !(t === 0 && p.slot === 4)).sort((a, b) => Math.abs(a.h - st.h) - Math.abs(b.h - st.h))[0];
      if (cand) doSub(t, cand.slot, st);
    }
  }
  G.keep = [];
}

// ───────────────────────── referees ─────────────────────────
function refSignal(type, target = null, dur = 1.6) {
  let best = refs[0], bd = 1e9;
  for (const r of refs) { const d = distH(r.pos, target ? target.pos : ball.pos); if (d < bd) { bd = d; best = r; } }
  best.sig = { type, t: dur, target };
  return best;
}
function updateRefs(dt) {
  const s = sgn(G.offense);
  for (const r of refs) {
    let tg;
    if (G.phase === 'jump' && r.role === 'center') tg = V(0, 0, 0.95);
    else if (r.role === 'lead') tg = V(s * (HX + 0.75), 0, clamp(ball.pos.z * 0.3 - 2.8, -6, 1));
    else if (r.role === 'trail') tg = V(clamp(ball.pos.x - s * 4, -12, 12), 0, HZ + 0.85);
    else tg = V(clamp(ball.pos.x - s * 1.5, -11, 11), 0, -HZ - 0.8);
    const dx = tg.x - r.pos.x, dz = tg.z - r.pos.z, L = Math.hypot(dx, dz);
    const des = L > 0.25 ? V(dx / L * Math.min(5.6, L * 2.5), 0, dz / L * Math.min(5.6, L * 2.5)) : V();
    r.vel.lerp(des, Math.min(1, dt * 5)); r.pos.addScaledVector(r.vel, dt);
    let look = ball.pos;
    if (r.sig) { r.sig.t -= dt; if (r.sig.target) look = r.sig.target.pos; if (r.sig.t <= 0) r.sig = null; }
    const want = Math.atan2(look.x - r.pos.x, look.z - r.pos.z);
    r.face += wrapA(want - r.face) * Math.min(1, dt * 6);
  }
}

// ───────────────────────── input ─────────────────────────
const keys = {};
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys[e.code] = true;
  if (G.state !== 'play') return;
  Sound.init();
  if (e.code === 'Tab') { toggleSubPanel(); return; }
  if (G.subPanel) return;
  if (e.code === 'KeyP') { G.paused = !G.paused; msg(G.paused ? '일시정지' : '', '#fff', G.paused ? 'P 키로 계속' : '', G.paused ? 9999 : 0.01); return; }
  if (e.code === 'KeyM') { Sound.setMute(!Sound.muted); msg(Sound.muted ? '음소거' : '소리 켬', '#fff', '', 0.8); return; }
  if (e.code === 'KeyN') { Sound.voice = !Sound.voice; msg(Sound.voice ? '해설 켬' : '해설 끔', '#fff', '', 0.8); return; }
  if (e.code === 'KeyC') { G.cam = (G.cam + 1) % 3; return; }
  if (G.paused) return;
  if (e.code === 'Space') spaceDown();
  if (e.code === 'KeyE') eKey();
  const u = user();
  if (/^Digit[1-4]$/.test(e.code) && G.phase === 'live' && ball.holder === u && !u.shooting) doPass(u, teams[0].filter(p => !p.isUser)[+e.code.slice(5) - 1]);
});
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space' && G.meter) releaseMeter(); });

function inputDir() {
  const x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const v = V(x, 0, z); return v.lengthSq() ? v.normalize() : v;
}

function spaceDown() {
  const u = user();
  if (G.phase === 'jump') { u.jump(4.9); return; }
  if (G.phase === 'ft') {
    if (G.ft.stage === 'ready' && G.ft.shooter === u && !G.meter) { G.meter = { v: 0, ft: true }; u.shooting = { meter: true, ftShot: true, dur: 1 }; }
    return;
  }
  if (G.phase !== 'live') return;
  if (ball.holder === u && !u.shooting) {
    const d = distH(u.pos, HOOPS[0]);
    if (d < 2.5) { startShot(u); return; }
    G.meter = { v: 0 }; u.shooting = { meter: true, dur: 1 }; u.jump(4.2); contestReact(u);
  } else if (!u.shooting) u.jump(G.offense === 0 ? 4.6 : 4.9);
}
function meterQuality(v) {
  if (v >= 0.72 && v <= 0.88) return [1.3, '완벽한 릴리즈!', '#3dff7a'];
  if (v >= 0.58 && v < 0.72) return [0.85, '살짝 빠름', '#ffd21f'];
  if (v > 0.88 && v <= 0.97) return [0.85, '살짝 늦음', '#ffd21f'];
  return [0.45, v < 0.58 ? '너무 빠름' : '너무 늦음', '#ff6b6b'];
}
function releaseMeter() {
  const m = G.meter; G.meter = null;
  const u = user();
  if (ball.holder !== u) { u.shooting = null; return; }
  const [q, label, col] = meterQuality(m.v);
  const sub = $('sub'); sub.textContent = label; sub.style.color = col; sub.style.opacity = 1;
  clearTimeout(msg._s); msg._s = setTimeout(() => { sub.style.opacity = 0; sub.style.color = '#dfe6ff'; }, 900);
  if (m.ft) ftRelease(q > 1 ? 1.1 : q > 0.8 ? 0.95 : 0.65);
  else releaseShot(u, q);
}
function eKey() {
  const u = user();
  if ((G.phase === 'inbound' && G.inb.team === 0) || (G.phase === 'live' && G.offense === 0 && ball.holder !== u)) { G.call = 1.8; msg('공 줘!', '#ffd21f', '', 0.7); return; }
  if (G.phase !== 'live') return;
  if (ball.holder === u) {
    if (u.shooting) return;
    const dir = inputDir();
    const mate = bestPassTarget(u, dir.lengthSq() > 0 ? dir : null);
    if (mate) doPass(u, mate);
  } else if (ball.holder && ball.holder.team === 1 && u.stealCd <= 0 && !G.whistled) {
    u.stealCd = 0.9;
    const h = ball.holder;
    if (distH(u.pos, h.pos) < 1.5 + (u.h - 2)) {
      const r = Math.random();
      if (r < 0.3 * (2 - G.diff)) { giveBall(u); u.box.stl++; msg('STEAL!', '#3dff7a', u.name); Sound.cheer(0.7); G.excite = 1; Sound.say(`Stolen by ${lastName(u.name)}!`, true); }
      else if (r > 0.8) { callFoul(u, h, 'reach'); handleCommonFoul(u, h); }
    }
  }
}

// ───────────────────────── shooting / passing ─────────────────────────
function contestReact(shooter) {
  for (const o of teams[1 - shooter.team]) {
    if (o.isUser) continue;
    if (distH(o.pos, shooter.pos) < 2.3 && o.grounded && Math.random() < 0.8) o.jumpDelay = rand(0.04, 0.18);
  }
  for (const p of onCourt) p.crash = (p.slot >= 3 && Math.random() < 0.85) || Math.random() < 0.3;
}

function startShot(p) {
  const H = HOOPS[p.team], d = distH(p.pos, H);
  const dunk = d < 2.1 && (p.h >= 1.98 || Math.random() < 0.45);
  const layup = !dunk && d < 2.7;
  const dur = dunk ? 0.34 : layup ? 0.3 : 0.48;
  p.shooting = { t: dur, dur, dunk, layup };
  p.jump(dunk ? 5.0 : layup ? 4.3 : 4.0);
  if (dunk || layup) { const dir = V(H.x - p.pos.x, 0, H.z - p.pos.z).normalize(); p.vel.copy(dir.multiplyScalar(Math.min(4, d * 2.2))); }
  contestReact(p);
  if (d > 6.75) refSignal('three', p, 2.2);
}

function releaseShot(p, q) {
  const sh = p.shooting || {};
  const dunk = !!sh.dunk, layup = !!sh.layup;
  p.shooting = null;
  if (ball.holder !== p || G.phase !== 'live') return;
  const H = HOOPS[p.team], d = distH(p.pos, H);
  const three = d > 6.75 || (Math.abs(p.pos.z) > 6.6 && Math.abs(p.pos.x - H.x) < 4.3);
  const hp = ball.pos.clone();
  p.box.fga++; if (three) p.box.tpa++;

  // shooting foul?
  let fouler = null;
  if (!G.whistled) for (const o of teams[1 - p.team]) {
    const dd = distH(o.pos, p.pos);
    if (dd < 0.95) {
      let ch = 0.05 + (o.jumpY > 0.15 ? 0.06 : 0) + (dunk || layup ? 0.07 : 0) + (dd < 0.6 ? 0.06 : 0);
      ch *= o.team === 1 ? 1 / G.diff : G.diff;
      if (Math.random() < ch) { fouler = o; break; }
    }
  }
  // block?
  if (!fouler) for (const o of teams[1 - p.team]) {
    if (distH(o.pos, p.pos) < 1.6 && o.jumpY > 0.18) {
      let ch = 0.08 + Math.max(0, o.h - 1.95) * 1.35 + (o.isUser ? 0.15 : 0) - (p.h - 2) * 0.4 - (dunk ? 0.1 : 0);
      ch *= p.team === 0 ? G.diff : 1 / G.diff;
      if (Math.random() < ch) {
        ball.state = 'loose'; ball.holder = null; ball.shot = null; ball.pos.copy(hp);
        const away = V(p.pos.x - o.pos.x, 0, p.pos.z - o.pos.z).normalize();
        ball.vel.set(away.x * 5 + rand(-2, 2), rand(1, 3), away.z * 5 + rand(-2, 2));
        ball.noGrab = 0.3; ball.lastTeam = o.team; o.box.blk++;
        msg('BLOCKED!', teamCol(o.team), `${o.name}의 블록슛`);
        Sound.board(); if (o.team === 0) { Sound.cheer(1); G.excite = 1; } else Sound.groan();
        Sound.say(`Rejected by ${lastName(o.name)}!`, true);
        return;
      }
    }
  }
  const f = 0.72 + (p.ovr - 70) / 90;
  let base;
  if (dunk) base = 0.94; else if (layup) base = 0.66; else if (d < 4.5) base = 0.47; else if (!three) base = 0.43;
  else base = 0.37 * p.three - Math.max(0, d - 8) * 0.06;
  let close = 99;
  for (const o of teams[1 - p.team]) close = Math.min(close, distH(o.pos, p.pos) - (o.h - 2) * 0.6);
  const contest = dunk ? (close < 0.8 ? 0.62 : close < 1.5 ? 0.82 : 1) : close < 0.9 ? 0.55 : close < 1.6 ? 0.75 : close < 2.6 ? 0.92 : 1.06;
  let prob = base * f * contest * q * p.fatigue;
  if (p.team === 1) prob /= G.diff; else prob *= (2 - G.diff) * 0.5 + 0.5;
  if (fouler) prob *= 0.5;
  prob = clamp(prob, 0.02, 0.97);
  const make = Math.random() < prob;

  let start = hp, tgt = H.clone(), time;
  if (dunk) {
    const toward = V(p.pos.x - H.x, 0, p.pos.z - H.z).normalize();
    start = V(H.x + toward.x * 0.15, RIM_Y + 0.3, H.z + toward.z * 0.15);
    time = 0.13;
    p.pos.set(H.x + toward.x * 0.6, 0, H.z + toward.z * 0.6); p.vel.set(0, 0, 0);
    p.hang = make ? 0.45 : 0.15; p.hangY = clamp(RIM_Y + 0.1 - p.reach, 0.1, 1.3); p.jumpY = p.hangY; p.jumpV = 0;
  } else time = layup ? 0.6 : 0.72 + d * 0.085;
  if (!make) {
    const a = Math.random() * Math.PI * 2, r = rand(0.19, 0.3);
    tgt.x += Math.cos(a) * r; tgt.z += Math.sin(a) * r; tgt.y += 0.04;
    if (d > 3 && Math.random() < 0.25) { tgt.x -= Math.sign(H.x) * 0.25; tgt.y += 0.35; }
  }
  ball.pos.copy(start);
  ball.vel.set((tgt.x - start.x) / time, (tgt.y - start.y + 0.5 * GRAV * time * time) / time, (tgt.z - start.z) / time);
  const passer = ball.lastPasser && T - ball.passAt < 4 && ball.lastPasser.team === p.team && ball.lastPasser !== p ? ball.lastPasser : null;
  ball.state = 'shot'; ball.holder = null; ball.noGrab = 0.4; ball.lastTeam = p.team;
  ball.shot = { team: p.team, pts: three ? 3 : 2, shooter: p, make, dunk, passer, foul: fouler ? { by: fouler, fts: three ? 3 : 2 } : null };
  p.follow = dunk ? 0 : 0.55;
  if (fouler) callFoul(fouler, p, 'shoot');
}

function bestPassTarget(p, dir) {
  let best = null, bs = -1e9;
  for (const m of teams[p.team]) {
    if (m === p || m.oob) continue;
    if (G.front && G.phase === 'live' && m.pos.x * sgn(m.team) < 0.2) continue;
    const to = V(m.pos.x - p.pos.x, 0, m.pos.z - p.pos.z); const d = to.length(); to.normalize();
    let open = 9; for (const o of teams[1 - p.team]) open = Math.min(open, distH(o.pos, m.pos));
    let lane = 0;
    for (const o of teams[1 - p.team]) {
      const ap = V(o.pos.x - p.pos.x, 0, o.pos.z - p.pos.z); const tp = clamp(ap.dot(to), 0, d);
      if (tp > 0.8 && tp < d - 0.5 && distH(V(p.pos.x + to.x * tp, 0, p.pos.z + to.z * tp), o.pos) < 0.7) lane = 1;
    }
    let s = Math.min(open, 4) - lane * 2.5 - d * 0.06 - distH(m.pos, HOOPS[p.team]) * 0.08 + Math.random() * 0.8;
    if (dir) s = to.dot(dir) * 6 - d * 0.04;
    if (!dir && m.isUser) s += 1.8;
    if (s > bs) { bs = s; best = m; }
  }
  return best;
}

function doPass(from, to) {
  if (!to || to === from) return;
  const d = distH(from.pos, to.pos), time = clamp(d / 15, 0.22, 0.85);
  const tgt = to.pos.clone().addScaledVector(to.vel, time * 0.8); tgt.y = to.h * 0.62;
  tgt.x = clamp(tgt.x, -HX + 0.3, HX - 0.3); tgt.z = clamp(tgt.z, -HZ + 0.3, HZ - 0.3);
  const start = ball.pos.clone();
  ball.vel.set((tgt.x - start.x) / time, (tgt.y - start.y + 0.5 * GRAV * time * time) / time, (tgt.z - start.z) / time);
  ball.state = 'pass'; ball.holder = null; ball.pass = { from, to, time, tgt }; ball.passTime = 0; ball.cut.clear(); ball.noGrab = 0; ball.lastTeam = from.team;
  from.face = Math.atan2(tgt.x - from.pos.x, tgt.z - from.pos.z); from.passT = 0.28;
}

// ───────────────────────── fouls & violations ─────────────────────────
function callFoul(fouler, victim, kind) {
  fouler.pf++;
  if (kind !== 'offensive') G.teamFouls[fouler.team]++;
  G.whistled = true; G.meter = null;
  Sound.whistle(); refSignal('foul', fouler, 1.8);
  const out = fouler.pf >= 6;
  if (out) fouler.fouledOut = true;
  const label = { shoot: '슈팅 파울', reach: '리치인 파울', block: '블로킹 파울', offensive: '공격자 파울 (차징)' }[kind];
  const bonus = kind !== 'offensive' && G.teamFouls[fouler.team] >= 5 ? ' · 보너스' : '';
  msg(label, '#ff9b6b', `${fouler.name} — 개인 ${fouler.pf}파울 · 팀파울 ${G.teamFouls[fouler.team]}${bonus}${out ? ' · 6반칙 퇴장' : ''}`, 2.2);
  Sound.say(`Foul on ${lastName(fouler.name)}${out ? '. That is his sixth. He has fouled out' : ''}`, true);
  if (victim.team === 0) Sound.oohh(); else Sound.groan();
}
function handleCommonFoul(fouler, victim) {
  ball.state = 'dead'; ball.holder = null;
  if (G.teamFouls[fouler.team] >= 5) { G.keep = [victim]; deadBall(1.6, () => startFT(victim, 2)); }
  else { const spot = sidelineSpot(victim.pos); G.shot = Math.max(G.shot, 14); deadBall(1.5, () => startInbound(victim.team, spot, 0.8)); }
}
function violation(ko, en, at) {
  Sound.whistle(); refSignal('viol', null, 1.3);
  msg(ko, '#ff7b7b', '공격권 넘어감', 1.6); Sound.say(en, true);
  const team = 1 - G.offense;
  ball.state = 'dead'; ball.holder = null;
  deadBall(1.5, () => startInbound(team, sidelineSpot(at)));
}
function sidelineSpot(pos) {
  if (Math.abs(pos.x) > HX - 0.3) return V(Math.sign(pos.x) * (HX + 0.45), 0, clamp(pos.z, -5.5, 5.5) || 1.5);
  return V(clamp(pos.x, -HX + 1.5, HX - 1.5), 0, (pos.z >= 0 ? 1 : -1) * (HZ + 0.45));
}

// ───────────────────────── inbound ─────────────────────────
function startInbound(team, spot, wait = 0.7) {
  G.phase = 'inbound';
  const cands = teams[team].filter(p => !p.isUser).sort((a, b) => distH(a.pos, spot) - distH(b.pos, spot));
  const passer = cands[0];
  passer.pos.set(spot.x, 0, spot.z); passer.vel.set(0, 0, 0); passer.oob = true; passer.shooting = null;
  passer.face = Math.atan2(-spot.x * 0.3, -spot.z) ;
  if (Math.abs(spot.x) > HX) passer.face = Math.atan2(-Math.sign(spot.x), 0);
  const changed = G.offense !== team;
  G.offense = team;
  if (changed) { G.shot = 24; G.eight = 0; ball.lastPasser = null; }
  G.front = spot.x * sgn(team) > 0.5;
  if (!G.front) G.eight = 0;
  G.inb = { team, passer, spot: spot.clone(), wait };
  ball.state = 'held'; ball.holder = passer; ball.shot = null; ball.pass = null; ball.lastTeam = team;
  for (const p of onCourt) { p.spot = null; p.shooting = null; }
  if (team === 0 && Math.random() < 0.3) Sound.organ(Math.random() < 0.5 ? 'charge' : 'go');
}
function updateInbound(dt) {
  const I = G.inb, s = sgn(I.team);
  I.wait -= dt;
  const inward = Math.abs(I.spot.x) > HX ? V(-Math.sign(I.spot.x), 0, 0) : V(0, 0, -Math.sign(I.spot.z));
  const recv = teams[I.team].find(p => p !== I.passer && !p.isUser && p.slot <= 1) || teams[I.team].find(p => p !== I.passer);
  for (const p of onCourt) {
    if (p === I.passer) { steer(p, null, 0, dt); continue; }
    if (p.isUser) { userControl(p, dt); continue; }
    if (ball.state === 'pass') { ai(p, dt); continue; }
    let tg;
    if (p === recv) tg = I.spot.clone().addScaledVector(inward, 2.6).add(V(s * 1.2, 0, 0));
    else if (p.team === I.team) tg = aiOffSpot(p, dt);
    else tg = aiDefSpot(p, dt);
    tg.x = clamp(tg.x, -HX + 0.4, HX - 0.4); tg.z = clamp(tg.z, -HZ + 0.4, HZ - 0.4);
    steer(p, tg, p.speed * 0.8, dt);
  }
  if (I.wait <= 0 && ball.state === 'held' && ball.holder === I.passer) {
    let to = (I.team === 0 && G.call > 0) ? user() : null;
    if (!to) to = (recv && Math.random() < 0.7) ? recv : bestPassTarget(I.passer, null);
    G.call = 0;
    doPass(I.passer, to);
  }
  G.call = Math.max(0, G.call - dt);
}
function endInbound() { if (G.inb) { G.inb.passer.oob = false; G.inb = null; } G.phase = 'live'; }

// ───────────────────────── free throws ─────────────────────────
function startFT(shooter, n) {
  if (!shooter.onCourt) shooter = teams[shooter.team][0];
  const t = shooter.team, s = sgn(t);
  G.phase = 'ft'; G.offense = t;
  G.ft = { shooter, team: t, n, i: 0, stage: 'setup', t: 1.8 };
  ball.state = 'dead'; ball.holder = null; ball.shot = null;
  const lane = (d, side) => V(s * (HX - d), 0, side * 2.78);
  const off = teams[t].filter(p => p !== shooter).sort((a, b) => b.h - a.h);
  const def = [...teams[1 - t]].sort((a, b) => b.h - a.h);
  def[0].ftSpot = lane(2.1, 1); def[1].ftSpot = lane(2.1, -1); def[2].ftSpot = lane(3.9, -1);
  off[0].ftSpot = lane(3.0, 1); off[1].ftSpot = lane(3.0, -1);
  const per = [V(s * (RIM_X - 7.9), 0, 3.4), V(s * (RIM_X - 7.9), 0, -3.4), V(s * (RIM_X - 8.6), 0, 1.3), V(s * (RIM_X - 8.6), 0, -1.3)];
  [off[2], off[3], def[3], def[4]].forEach((p, i) => { p.ftSpot = per[i]; });
  shooter.ftSpot = V(s * (HX - 5.8 - 0.3), 0, 0);
  for (const p of onCourt) { p.shooting = null; p.stance = false; }
  msg(`자유투 ${n}개`, teamCol(t), `${shooter.name} · 성공률 ${Math.round(shooter.ft * 100)}%`, 1.8);
}
function updateFT(dt) {
  const F = G.ft, sh = F.shooter;
  if (G.meter && G.meter.ft) { G.meter.v += dt / 0.6; if (G.meter.v >= 1.05) releaseMeter(); }
  for (const p of onCourt) {
    if (F.stage === 'setup') steer(p, p.ftSpot, p.speed * 0.6, dt);
    else steer(p, null, 0, dt);
    if (p.ftSpot && F.stage !== 'setup') p.face = p === sh ? Math.atan2(HOOPS[F.team].x - p.pos.x, -p.pos.z) : Math.atan2(ball.pos.x - p.pos.x, ball.pos.z - p.pos.z);
  }
  F.t -= dt;
  if (F.stage === 'setup' && F.t <= 0) {
    for (const p of onCourt) { if (p.ftSpot) p.pos.copy(p.ftSpot); p.vel.set(0, 0, 0); }
    F.stage = 'ready'; ball.state = 'held'; ball.holder = sh; sh.ftHold = true;
    F.t = sh.isUser ? 1e9 : rand(1.0, 1.6);
    if (sh.isUser) msg(`자유투 ${F.i + 1}/${F.n}`, '#ffd21f', 'Space 꾹 → 초록 구간에서 떼기', 2.5);
    else Sound.say(`${lastName(sh.name)} at the line`, false);
  } else if (F.stage === 'ready' && !sh.isUser && F.t <= 0) {
    F.stage = 'shooting'; sh.shooting = { t: 0.5, dur: 0.5, ftShot: true };
  } else if (F.stage === 'shooting' && sh.shooting) {
    sh.shooting.t -= dt;
    if (sh.shooting.t <= 0) ftRelease(rand(0.96, 1.04));
  }
  if (F.team === 1 && F.stage !== 'setup') G.crowdMode = 'wave';
}
function ftRelease(q) {
  const F = G.ft, sh = F.shooter;
  sh.shooting = null; sh.ftHold = false; sh.follow = 0.6;
  const H = HOOPS[F.team];
  let prob = sh.ft * q * (0.9 + 0.1 * sh.fatigue);
  if (F.team === 1) prob *= 1.04 - (G.diff - 1) * 0.3;
  const make = Math.random() < clamp(prob, 0.05, 0.97);
  const tgt = H.clone();
  if (!make) { const a = Math.random() * Math.PI * 2; tgt.x += Math.cos(a) * rand(0.2, 0.28); tgt.z += Math.sin(a) * rand(0.2, 0.28); tgt.y += 0.04; }
  const start = ball.pos.clone(), time = 1.05;
  ball.vel.set((tgt.x - start.x) / time, (tgt.y - start.y + 0.5 * GRAV * time * time) / time, (tgt.z - start.z) / time);
  const last = F.i === F.n - 1;
  ball.state = 'shot'; ball.holder = null; ball.noGrab = 0.5; ball.lastTeam = F.team;
  ball.shot = { team: F.team, pts: 1, shooter: sh, make, ft: true, last };
  sh.box.fta++;
  F.stage = 'flight';
  if (last) { G.phase = 'live'; for (const p of onCourt) p.crash = p.ftSpot && Math.abs(p.ftSpot.z) > 2 && p !== sh; }
}
function nextFT() { const F = G.ft; F.i++; F.stage = 'setup'; F.t = 0.8; G.phase = 'ft'; ball.state = 'dead'; }

// ───────────────────────── jump ball ─────────────────────────
function startJumpBall() {
  G.phase = 'jump';
  for (const p of onCourt) resetMotion(p);
  for (const t of [0, 1]) {
    const s = sgn(t), c = teams[t][4];
    c.pos.set(-s * 0.42, 0, 0); c.face = Math.atan2(s, 0);
    const others = [[-s * 2.3, 1.7], [-s * 2.3, -1.7], [s * 2.4, 2.7], [s * 2.4, -2.7]];
    teams[t].slice(0, 4).forEach((p, i) => { p.pos.set(others[i][0], 0, others[i][1]); p.face = Math.atan2(s, 0); });
  }
  refs[0].pos.set(0, 0, 0.95); refs[0].vel.set(0, 0, 0);
  G.jb = { stage: 'ready', t: 2.4, tossT: 0, aiJumped: false, aiAt: 0.27 + rand(-0.12, 0.12) / G.diff };
  ball.state = 'dead'; ball.holder = null;
  msg('점프볼!', '#ffd21f', '공이 가장 높이 올라갈 때 Space!', 2.4);
  Sound.say('Welcome to San Antonio. Here is the tip-off!', true);
  Sound.whistle();
}
function updateJump(dt) {
  const J = G.jb, c0 = teams[0][4], c1 = teams[1][4];
  for (const p of onCourt) p.vel.set(0, 0, 0);
  refs[0].sig = { type: J.stage === 'ready' ? 'hold' : 'toss', t: 0.2 };
  if (J.stage === 'ready') {
    J.t -= dt;
    const pm = refs[0].rig.palm[1].getWorldPosition(V()); ball.pos.copy(pm).add(V(0, 0.08, -0.08)); ball.vel.set(0, 0, 0);
    if (J.t <= 0) {
      J.stage = 'air'; J.tossT = 0; J.aiJumped = false; ball.state = 'toss'; ball.pos.set(0, 1.9, 0); ball.vel.set(0, 6.4, 0); Sound.whistle();
      // AI: 공이 내려오며 자신의 최고 도달점에 오는 순간에 맞춰 점프 (난이도에 따라 오차)
      const v = 4.6, g = GRAV * 1.05, peakReach = c1.reach + v * v / (2 * g), up = v / g;
      const apexT = 6.4 / GRAV, apexY = 1.9 + 6.4 * apexT - 0.5 * GRAV * apexT * apexT;
      const tHit = peakReach >= apexY ? apexT : apexT + Math.sqrt(2 * (apexY - peakReach + 0.05) / GRAV);
      J.aiAt = Math.max(0, tHit - up + rand(-0.14, 0.14) / G.diff); J.aiV = v;
    }
    return;
  }
  J.tossT += dt;
  if (!J.aiJumped && J.tossT >= J.aiAt) { c1.jump(J.aiV); J.aiJumped = true; }
  if (ball.vel.y < 1.5) {
    let best = null, bm = -1;
    for (const c of [c0, c1]) {
      if (c.jumpY < 0.15) continue;
      const reach = c.reach + c.jumpY, m = reach - ball.pos.y;
      if (m > -0.25 && distH(c.pos, ball.pos) < 0.9 && m > bm) { bm = m; best = c; }
    }
    if (best) {
      const s = sgn(best.team);
      const mate = teams[best.team].slice(0, 4).sort((a, b) => a.pos.x * s - b.pos.x * s)[0];
      const dx = mate.pos.x - ball.pos.x, dz = mate.pos.z - ball.pos.z, L = Math.hypot(dx, dz);
      ball.state = 'loose'; ball.vel.set(dx / L * 6.5, 0.6, dz / L * 6.5); ball.noGrab = 0.12; ball.lastTeam = best.team;
      G.phase = 'live'; G.tipWinner = best.team; G.offense = best.team; G.front = false; G.eight = 0; G.shot = 24;
      msg('TIP!', teamCol(best.team), `${best.name} 점프볼 승리`, 1.4);
      Sound.say(`${lastName(best.name)} wins the tip`, true);
      Sound.cheer(best.team === 0 ? 0.7 : 0.3);
      return;
    }
  }
  if (ball.pos.y < 1.5 && ball.vel.y < 0) { msg('다시 점프볼', '#fff', '', 1); J.stage = 'ready'; J.t = 1.4; ball.state = 'dead'; for (const c of [c0, c1]) { c.jumpY = 0; c.jumpV = 0; } }
}

// ───────────────────────── quarters ─────────────────────────
function endQuarter() {
  Sound.buzzer(); G.meter = null;
  if (G.q >= 4 && G.score[0] !== G.score[1]) { gameOver(); return; }
  const endedQ = G.q;
  G.q++; G.teamFouls = [0, 0];
  G.clock = G.q > 4 ? 60 : G.qLen;
  ball.state = 'dead'; ball.holder = null;
  for (const p of [...roster[0], ...roster[1]]) p.stamina = Math.min(100, p.stamina + (endedQ === 2 ? 60 : 25));
  const half = G.q === 3;
  if (half) setSides(true);
  const sub = `SAS ${G.score[0]} : ${G.score[1]} ${G.oppKey}`;
  msg(G.q > 4 ? '연장전!' : half ? '하프타임' : `${endedQ}쿼터 종료`, '#fff', half ? sub + ' · 후반전은 공격 방향이 바뀝니다' : sub, 3);
  Sound.say(G.q > 4 ? 'We are going to overtime!' : `That is the end of the ${ORD[endedQ - 1]} quarter`, true);
  if (half) Sound.organ('charge');
  const next = G.q > 4 ? null : (G.q === 4 ? G.tipWinner : 1 - G.tipWinner);
  deadBall(3.2, () => {
    if (next === null) { startJumpBall(); return; }
    formation(next);
    startInbound(next, V(0, 0, -HZ - 0.45), 1.0);
  });
}

function gameOver() {
  G.state = 'over'; G.phase = 'dead'; G.dead = 1e9;
  const win = G.score[0] > G.score[1];
  $('overTitle').textContent = win ? '🏆 스퍼스 승리!' : '패배...';
  $('overTitle').style.color = win ? '#ffd21f' : '#ff7b7b';
  $('overScore').textContent = `SAS ${G.score[0]} : ${G.score[1]} ${G.oppKey}`;
  $('overStats').innerHTML = boxScoreHtml();
  if (win) { Sound.cheer(1.5); G.excite = 1; Sound.say('Ballgame! The Spurs win!', true); } else Sound.say('That is the final.', true);
  setTimeout(() => { $('over').style.display = 'flex'; }, 1500);
}
function boxScoreHtml() {
  const row = p => { const b = p.box; return `<tr${p.d.n === 'Victor Wembanyama' ? ' class="me"' : ''}><td>#${p.num} ${p.name}</td><td>${Math.round(b.min)}</td><td><b>${b.pts}</b></td><td>${b.reb}</td><td>${b.ast}</td><td>${b.stl}</td><td>${b.blk}</td><td>${b.fgm}-${b.fga}</td><td>${b.tpm}-${b.tpa}</td><td>${b.ftm}-${b.fta}</td><td>${p.pf}</td></tr>`; };
  const head = '<tr><th>선수</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>FG</th><th>3P</th><th>FT</th><th>PF</th></tr>';
  return ['SAS', G.oppKey].map((ab, t) => `<div class="bsT" style="color:${teamCol(t)}">${ab}</div><table class="bs">${head}${roster[t].map(row).join('')}</table>`).join('');
}

// ───────────────────────── AI ─────────────────────────
const SPOTS = [
  [[7.6, 0], [7.3, 2.2], [7.3, -2.2], [5.5, 0]],
  [[6.2, -4.6], [1.3, -6.8], [4.8, -5.6], [3, -3.5]],
  [[6.2, 4.6], [1.3, 6.8], [4.8, 5.6], [3, 3.5]],
  [[4.6, 2.6], [3.6, -2.6], [1.8, 4.2], [5.8, 0.5]],
  [[1.6, -1.9], [1.6, 1.9], [4.4, 0], [2.6, 0.5]],
];
const hoopRel = (team, dx, dz) => V(HOOPS[team].x - sgn(team) * dx, 0, dz);
function nearestOpp(p) { let best = null, bd = 99; for (const o of teams[1 - p.team]) { const d = distH(o.pos, p.pos); if (d < bd) { bd = d; best = o; } } return [best, bd]; }
function clampFront(tg, team) { if (G.front && G.offense === team && G.phase === 'live') { const s = sgn(team); if (tg.x * s < 0.9) tg.x = 0.9 * s; } return tg; }

function aiOffSpot(p, dt) {
  p.spotT -= dt;
  if (!p.spot || p.spotT <= 0) {
    if (Math.random() < 0.22) { p.spot = hoopRel(p.team, rand(1, 2), rand(-1.5, 1.5)); p.spotT = rand(1.2, 2); }
    else { const s = SPOTS[p.slot][Math.floor(Math.random() * 4)]; p.spot = hoopRel(p.team, s[0] + rand(-0.4, 0.4), s[1] + rand(-0.4, 0.4)); p.spotT = rand(2.5, 4.5); }
  }
  return p.spot.clone();
}
function aiHandler(p, dt) {
  p.holdT += dt; p.aiT -= dt;
  const H = HOOPS[p.team], d = distH(p.pos, H);
  const [, dd] = nearestOpp(p);
  if (p.aiT <= 0 && !G.whistled) {
    p.aiT = rand(0.22, 0.42);
    const u = user();
    if (p.team === 0 && G.call > 0 && !u.shooting) { doPass(p, u); G.call = 0; return null; }
    if (d < 2.1 && Math.random() < 0.85) { startShot(p); return null; }
    if (G.shot < 2.3) { startShot(p); return null; }
    let sp = 0;
    if (d < 8.2 && d > 2) sp = (dd > 2.2 ? 0.38 : dd > 1.4 ? 0.12 : 0.025) * (d > 6.75 ? p.three * p.three : 1) * (p.ovr / 85);
    if (Math.random() < sp) { startShot(p); return null; }
    if (p.holdT > p.holdLimit) { const m = bestPassTarget(p, null); if (m) { doPass(p, m); return null; } }
  }
  p.driveT -= dt;
  if (!p.drive || p.driveT <= 0) {
    p.driveT = rand(0.5, 1.1);
    const toH = V(H.x - p.pos.x, 0, H.z - p.pos.z).normalize(), side = V(-toH.z, 0, toH.x);
    if (d > 8.5) p.drive = p.pos.clone().addScaledVector(toH, 3).addScaledVector(side, rand(-1.5, 1.5));
    else if (dd > 1.3 || Math.random() < 0.45) p.drive = p.pos.clone().addScaledVector(toH, 2.5).addScaledVector(side, rand(-1.2, 1.2));
    else p.drive = p.pos.clone().addScaledVector(side, rand(-3, 3)).addScaledVector(toH, rand(-0.6, 0.5));
  }
  return clampFront(p.drive.clone(), p.team);
}
function aiDefSpot(p, dt) {
  const man = teams[1 - p.team][p.slot]; p.man = man;
  const H = HOOPS[man.team];
  const dir = V(H.x - man.pos.x, 0, H.z - man.pos.z); const dm = dir.length(); dir.normalize();
  let gap = ball.holder === man ? 0.95 : 1.7;
  if (dm > 10) gap = 2.6;
  const t = man.pos.clone().addScaledVector(dir, Math.min(gap, dm * 0.5));
  if (ball.holder && ball.holder !== man) { t.x += (ball.holder.pos.x - t.x) * 0.18; t.z += (ball.holder.pos.z - t.z) * 0.18; }
  if (ball.holder === man && G.phase === 'live' && !G.whistled) {
    p.stealCd -= dt;
    if (p.stealCd <= 0 && distH(p.pos, man.pos) < 1.2) {
      p.stealCd = 1;
      const ch = 0.045 * (p.team === 1 ? G.diff : 1 / G.diff);
      const r = Math.random();
      if (!man.shooting && r < ch) {
        giveBall(p); p.box.stl++;
        msg(man.isUser ? '스틸 당함!' : 'STEAL!', man.isUser ? '#ff7b7b' : teamCol(p.team), p.name);
        Sound.say(`Stolen by ${lastName(p.name)}`, true);
        if (p.team === 0) { Sound.cheer(0.8); G.excite = 1; }
      } else if (r > 0.965) { callFoul(p, man, 'reach'); handleCommonFoul(p, man); }
    }
  }
  return t;
}
let chasers = new Set();
function computeChasers() {
  chasers.clear();
  if (ball.state !== 'loose') return;
  for (const tm of teams) tm.filter(p => !p.isUser).sort((a, b) => distH(a.pos, ball.pos) - distH(b.pos, ball.pos)).slice(0, 2).forEach(p => chasers.add(p));
}
function ai(p, dt) {
  if (p.jumpDelay > 0) { p.jumpDelay -= dt; if (p.jumpDelay <= 0) p.jump(4.2 + (p.h - 2) * 1.5); }
  p.stance = false;
  if (p.shooting) {
    p.shooting.t -= dt;
    if (p.shooting.t <= 0) releaseShot(p, rand(0.9, 1.12));
    if (!p.shooting || !p.shooting.dunk) steer(p, null, 0, dt);
    return;
  }
  if (G.whistled) { steer(p, null, 0, dt); return; }
  let target = null, spd = p.speed * 0.82;
  if ((ball.state === 'loose' || ball.state === 'shot') && p.grounded && ball.vel.y < 0 && distH(p.pos, ball.pos) < 1.3 && ball.pos.y > p.reach - 0.2 && ball.pos.y < p.reach + 0.9 && ball.noGrab < 0.15) p.jump(4.2);
  if (ball.state === 'loose' && chasers.has(p)) { target = ball.pos.clone().addScaledVector(ball.vel, 0.25); spd = p.speed; }
  else if (ball.state === 'shot' && p.crash) {
    const H = HOOPS[ball.shot.team]; const dir = V(p.pos.x - H.x, 0, p.pos.z - H.z).normalize();
    target = V(H.x + dir.x * 1.8, 0, H.z + dir.z * 1.8); spd = p.speed * 0.9;
  }
  else if (ball.holder === p) { target = aiHandler(p, dt); spd = p.speed * (distH(p.pos, HOOPS[p.team]) > 8 ? 0.9 : 1.02); }
  else if (ball.state === 'pass' && ball.pass.to === p) { target = ball.pass.tgt; spd = p.speed * 0.6; }
  else if (G.offense === p.team) target = clampFront(aiOffSpot(p, dt), p.team);
  else {
    target = aiDefSpot(p, dt);
    p.stance = G.phase === 'live' && distH(p.pos, p.man.pos) < 3.2 && distH(p.pos, target) < 1.6;
  }
  if (target) { target.x = clamp(target.x, -HX + 0.3, HX - 0.3); target.z = clamp(target.z, -HZ + 0.3, HZ - 0.3); }
  steer(p, target, spd, dt);
}
function steer(p, target, spd, dt) {
  const des = V();
  if (target) {
    const dx = target.x - p.pos.x, dz = target.z - p.pos.z, L = Math.hypot(dx, dz);
    if (L > 0.12) { const s = Math.min(spd, L * 3); des.set(dx / L * s, 0, dz / L * s); }
  }
  p.vel.lerp(des, p.grounded ? Math.min(1, dt * 6) : Math.min(1, dt * 0.8));
}
function userControl(p, dt) {
  if (p.shooting && !p.shooting.meter) {
    p.shooting.t -= dt;
    if (p.shooting.t <= 0) releaseShot(p, 1.05);
    return;
  }
  const dir = inputDir();
  const sprint = keys.ShiftLeft || keys.ShiftRight;
  let spd = p.speed * (sprint ? 1.35 : 1) * (ball.holder === p ? 0.93 : 1);
  if (p.shooting) spd *= 0.05;
  if (G.whistled) spd *= 0.3;
  p.vel.lerp(dir.multiplyScalar(spd), p.grounded ? Math.min(1, dt * 10) : Math.min(1, dt));
  if (ball.holder === p) p.holdT += dt;
  p.stance = G.phase === 'live' && G.offense !== p.team && ball.holder && distH(ball.holder.pos, p.pos) < 3.5 && !sprint;
  p.man = ball.holder;
  if (sprint && p.vel.lengthSq() > 9) p.stamina -= dt * 0.25 * (180 / G.qLen);
}

// ───────────────────────── physics ─────────────────────────
function movePlayers(dt) {
  G.collCd -= dt;
  for (const p of onCourt) {
    p.prevVel.copy(p.vel);
    p.pos.addScaledVector(p.vel, dt);
    if (p.hang > 0) { p.hang -= dt; p.jumpY = p.hangY; p.jumpV = 0; if (p.hang <= 0) { p.jumpV = -0.5; p.hang = 0; } }
    else if (p.jumpV !== 0 || p.jumpY > 0) { p.jumpY += p.jumpV * dt; p.jumpV -= GRAV * 1.05 * dt; if (p.jumpY <= 0) { p.jumpY = 0; p.jumpV = 0; } }
    p.stealCd = Math.max(0, p.stealCd - (p.isUser ? dt : 0));
  }
  for (let i = 0; i < onCourt.length; i++) for (let j = i + 1; j < onCourt.length; j++) {
    const a = onCourt[i], b = onCourt[j];
    if (a.oob || b.oob) continue;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), min = 0.52 + (a.d.build + b.d.build - 2) * 0.3;
    if (d < min && d > 1e-4) {
      const push = (min - d) / 2, nx = dx / d, nz = dz / d, wa = a.isUser ? 0.4 : 1, wb = b.isUser ? 0.4 : 1;
      a.pos.x -= nx * push * wa; a.pos.z -= nz * push * wa; b.pos.x += nx * push * wb; b.pos.z += nz * push * wb;
      // 충돌 파울 (차징/블로킹)
      if (G.phase === 'live' && !G.whistled && G.collCd <= 0 && ball.state === 'held' && (ball.holder === a || ball.holder === b) && a.team !== b.team) {
        const h = ball.holder, df = h === a ? b : a;
        const hs = Math.hypot(h.vel.x, h.vel.z), ds = Math.hypot(df.vel.x, df.vel.z);
        const inFront = (df.pos.x - h.pos.x) * h.fwd.x + (df.pos.z - h.pos.z) * h.fwd.z > 0.15;
        if (hs > 3.6 && inFront && h.grounded) {
          G.collCd = 1.2;
          const r = Math.random();
          if (r < 0.08 && ds < 1.2) { callFoul(h, df, 'offensive'); ball.state = 'dead'; ball.holder = null; const spot = sidelineSpot(h.pos); deadBall(1.5, () => startInbound(df.team, spot, 0.8)); }
          else if (r < 0.15 && ds > 1.5) { callFoul(df, h, 'block'); handleCommonFoul(df, h); }
        }
      }
    }
  }
  for (const p of onCourt) {
    if (!p.oob) { p.pos.x = clamp(p.pos.x, -HX + 0.25, HX - 0.25); p.pos.z = clamp(p.pos.z, -HZ + 0.25, HZ - 0.25); }
    const sp = Math.hypot(p.vel.x, p.vel.z);
    let want;
    if (G.phase === 'jump') want = p.face;
    else if (ball.holder === p && (p.shooting || p.ftHold)) want = Math.atan2(HOOPS[p.team].x - p.pos.x, HOOPS[p.team].z - p.pos.z);
    else if (p.oob) want = Math.atan2(-p.pos.x * 0.3, -p.pos.z);
    else if (p.stance && p.man) want = Math.atan2(p.man.pos.x - p.pos.x, p.man.pos.z - p.pos.z);
    else if (sp > 0.6) want = Math.atan2(p.vel.x, p.vel.z);
    else want = Math.atan2(ball.pos.x - p.pos.x, ball.pos.z - p.pos.z);
    if (G.phase !== 'ft') p.face += wrapA(want - p.face) * Math.min(1, dt * 10);
    // 운동화 마찰음
    const acc = Math.hypot(p.vel.x - p.prevVel.x, p.vel.z - p.prevVel.z) / Math.max(dt, 1e-3);
    if (acc > 16 && sp > 2 && p.grounded && Math.random() < 0.25) Sound.squeak(clamp(1 - camera.position.distanceTo(p.pos) / 32, 0, 1));
    // 체력
    p.stamina = clamp(p.stamina - dt * (0.11 + 0.045 * sp + (p.grounded ? 0 : 0.15)) * (180 / G.qLen), 0, 100);
    p.box.min += dt * (720 / G.qLen) / 60;
  }
  for (const p of [...roster[0], ...roster[1]]) if (!p.onCourt) p.stamina = Math.min(100, p.stamina + dt * 0.6 * (180 / G.qLen));
}

function touched(kind) {
  const sh = ball.shot;
  if (ball.state === 'shot') {
    ball.state = 'loose'; ball.noGrab = Math.min(ball.noGrab, 0.12);
    if (sh && sh.ft && !sh.last) { ball.state = 'dead'; deadBall(0.9, nextFT); }
    else if (sh && sh.foul) { ball.state = 'dead'; G.keep = [sh.shooter]; deadBall(1.0, () => startFT(sh.shooter, sh.foul.fts)); }
    if (sh && !sh.ft && sh.pts === 3 && !sh.make) Sound.oohh();
  }
  if (ball.state === 'pass' && kind === 'floor') ball.state = 'loose';
  const v = clamp(1 - camera.position.distanceTo(ball.pos) / 35, 0.2, 1);
  if (kind === 'rim') Sound.rim(v); else if (kind === 'board') Sound.board(); else if (kind === 'floor') Sound.bounce(v);
}

function score(s) {
  const team = HOOPS[0].x * s > 0 ? 0 : 1;
  const sh = ball.shot;
  const pts = sh && sh.team === team ? sh.pts : 2;
  G.score[team] += pts;
  ball.state = 'dead';
  const shooter = sh ? sh.shooter : null;
  if (shooter && shooter.team === team) {
    shooter.box.pts += pts;
    if (sh.ft) shooter.box.ftm++; else { shooter.box.fgm++; if (pts === 3) shooter.box.tpm++; }
    if (sh.passer) sh.passer.box.ast++;
  }
  const nm = shooter ? shooter.name : '', ln = shooter ? lastName(shooter.name) : '';
  nets.find(n => n.s === Math.sign(s)).t = 0.6;
  Sound.swish();
  if (team === 0) { G.excite = sh && sh.ft ? 0.55 : 1; Sound.cheer(sh && sh.ft ? 0.4 : pts === 3 || (sh && sh.dunk) ? 1.3 : 0.9); roster[0].forEach(p => { if (!p.onCourt) p.clap = 1.6; }); }
  else Sound.groan();
  if (shooter && !(sh && sh.ft)) shooter.celebrate = 1.2;
  if (pts === 3 && sh) refSignal('three2', null, 1.2);

  if (sh && sh.ft) {
    msg(`자유투 성공 (${G.ft.i + 1}/${G.ft.n})`, teamCol(team), nm, 1.0);
    if (!sh.last) { deadBall(0.9, nextFT); return; }
    const spot = V(Math.sign(s) * (HX + 0.45), 0, Math.random() < 0.5 ? 1.6 : -1.6);
    deadBall(1.2, () => startInbound(1 - team, spot, 0.6));
    return;
  }
  if (sh && sh.dunk) { msg('DUNK!!', teamCol(team), nm); Sound.say(`${ln} with the slam!`, true); }
  else if (pts === 3) { msg('3점슛!', teamCol(team), nm); Sound.say(ln === 'Wembanyama' ? 'Wemby! For threeee!' : `${ln}, for three!`, true); }
  else { msg('+2', teamCol(team), nm); if (Math.random() < 0.4) Sound.say(ln === 'Wembanyama' ? 'Wemby!' : ln); }
  if (sh && sh.foul) { msg('AND ONE!', teamCol(team), nm + ' · 추가 자유투 1개', 2); Sound.say('And one!', true); G.keep = [shooter]; deadBall(1.6, () => startFT(shooter, 1)); return; }
  const spot = V(Math.sign(s) * (HX + 0.45), 0, Math.random() < 0.5 ? 1.6 : -1.6);
  const inbTeam = 1 - team;
  const ib = teams[inbTeam].filter(p => !p.isUser).sort((a, b) => distH(a.pos, spot) - distH(b.pos, spot))[0];
  deadBall(1.4, () => startInbound(inbTeam, spot, 0.6));
  if (ib) ib.target = V(clamp(spot.x, -HX + 0.3, HX - 0.3), 0, spot.z);
}

function ballPhysics(dt) {
  ball.noGrab = Math.max(0, ball.noGrab - dt);
  if (ball.state === 'held') return;
  if (G.phase === 'jump' && G.jb.stage === 'ready') return;
  const N = 4, sdt = dt / N;
  for (let i = 0; i < N; i++) {
    const py = ball.pos.y, px = ball.pos.x;
    ball.vel.y -= GRAV * sdt;
    ball.pos.addScaledVector(ball.vel, sdt);
    if (ball.state === 'shot' || ball.state === 'loose') {
      for (const s of [1, -1]) {
        if (py > RIM_Y && ball.pos.y <= RIM_Y && ball.vel.y < 0) {
          const dx = ball.pos.x - s * RIM_X, dz = ball.pos.z;
          if (dx * dx + dz * dz < (RIM_R - 0.02) ** 2) { score(s); break; }
        }
      }
    }
    if (!(ball.state === 'shot' && ball.shot.make)) {
      for (const s of [1, -1]) {
        const cx = s * RIM_X, dx = ball.pos.x - cx, dz = ball.pos.z, L = Math.hypot(dx, dz) || 1e-4;
        const qx = cx + dx / L * RIM_R, qz = dz / L * RIM_R;
        const nx = ball.pos.x - qx, ny = ball.pos.y - RIM_Y, nz = ball.pos.z - qz, D = Math.hypot(nx, ny, nz), min = BALL_R + 0.018;
        if (D < min) {
          const n = V(nx / D, ny / D, nz / D);
          ball.pos.addScaledVector(n, min - D);
          const vn = ball.vel.dot(n);
          if (vn < 0) { ball.vel.addScaledVector(n, -1.6 * vn); ball.vel.x += rand(-0.4, 0.4); ball.vel.z += rand(-0.4, 0.4); ball.vel.multiplyScalar(0.85); touched('rim'); }
        }
      }
    }
    for (const s of [1, -1]) {
      if (Math.abs(ball.pos.z) < 0.92 && ball.pos.y > 2.88 && ball.pos.y < 3.96 && Math.abs(ball.pos.x) < BOARD_X + 0.3) {
        if (s * (ball.pos.x + s * BALL_R) > BOARD_X && s * (px + s * BALL_R) <= BOARD_X + 0.02) { ball.pos.x = s * BOARD_X - s * BALL_R; ball.vel.x = -ball.vel.x * 0.6; touched('board'); }
      }
    }
    if (ball.pos.y < BALL_R) {
      ball.pos.y = BALL_R;
      if (ball.vel.y < 0) { const hard = ball.vel.y < -1.5; ball.vel.y = -ball.vel.y * 0.68; ball.vel.x *= 0.82; ball.vel.z *= 0.82; if (hard) touched('floor'); else if (ball.state === 'shot') touched('floor'); }
    }
  }
  if (ball.pos.y <= BALL_R + 0.01) { ball.vel.x *= 1 - dt * 1.2; ball.vel.z *= 1 - dt * 1.2; }
  ballMesh.rotation.x += ball.vel.z * dt * 6; ballMesh.rotation.z -= ball.vel.x * dt * 6;

  if (G.phase !== 'live' && G.phase !== 'inbound') return;
  if (ball.state === 'pass') {
    const pa = ball.pass; ball.passTime += dt;
    for (const o of teams[1 - pa.from.team]) {
      if (ball.cut.has(o)) continue;
      if (distH(o.pos, ball.pos) < 0.6 && ball.pos.y < o.reach + o.jumpY - 0.3 && ball.passTime > 0.08) {
        ball.cut.add(o);
        if (Math.random() < (o.isUser ? 0.55 : 0.28) * (o.team === 1 ? G.diff : 1)) {
          if (G.phase === 'inbound') endInbound();
          giveBall(o); o.box.stl++; msg('INTERCEPT!', teamCol(o.team), o.name); Sound.say(`Picked off by ${lastName(o.name)}!`, true);
          if (o.team === 0) { Sound.cheer(0.8); G.excite = 1; }
          return;
        }
      }
    }
    const r = pa.to;
    if (distH(r.pos, ball.pos) < 0.85 && Math.abs(ball.pos.y - (r.h * 0.62 + r.jumpY)) < 0.9) {
      const wasInb = G.phase === 'inbound';
      if (wasInb) endInbound();
      if (!wasInb && G.front && r.pos.x * sgn(r.team) < -0.15) { violation('하프코트 바이얼레이션', 'Backcourt violation', r.pos); return; }
      giveBall(r); ball.lastPasser = pa.from; ball.passAt = T; return;
    }
    if (ball.passTime > pa.time + 0.35) { ball.state = 'loose'; if (G.phase === 'inbound') endInbound(); }
  }
  if (ball.state === 'loose' && ball.noGrab <= 0 && G.phase === 'live') {
    const order = [...onCourt].sort(() => Math.random() - 0.5);
    for (const p of order) {
      if (p.oob) continue;
      const rad = 0.55 + (p.h - 1.9) * 0.45;
      if (distH(p.pos, ball.pos) < rad && ball.pos.y < p.reach + p.jumpY + 0.05) {
        const sh = ball.shot, prevOff = G.offense;
        giveBall(p);
        if (sh) {
          p.box.reb++;
          G.shot = sh.team === p.team ? 14 : 24;
          msg(sh.team === p.team ? '공격 리바운드' : '리바운드', teamCol(p.team), p.name, 1.0);
          if (p.team === 0 && p.jumpY > 0.3) G.excite = Math.max(G.excite, 0.6);
        } else if (prevOff !== p.team) msg('턴오버', teamCol(p.team), p.name + ' 획득', 1.0);
        return;
      }
    }
  }
  if (ball.state === 'loose' && (Math.abs(ball.pos.x) > HX + 0.1 || Math.abs(ball.pos.z) > HZ + 0.1) && ball.pos.y < 2.5) {
    Sound.whistle(); refSignal('viol', null, 1.0);
    const team = 1 - ball.lastTeam, spot = sidelineSpot(ball.pos);
    msg('아웃 오브 바운즈', '#ff7b7b', `${team === 0 ? 'SAS' : G.oppKey} 공격`, 1.3);
    ball.state = 'dead';
    deadBall(1.3, () => startInbound(team, spot, 0.7));
  }
}

// ───────────────────────── animation ─────────────────────────
const _w = V(), _w2 = V();
function animatePerson(p, dt) {
  const r = p.rig, D = r.D;
  const kk = 1 - Math.exp(-dt * 13);
  const P = { thx: [-0.04, -0.04], thz: [0.035, -0.035], kn: [0.08, 0.08], an: [0, 0], shx: [0.06, 0.06], shz: [0.13, -0.13], el: [-0.22, -0.22], wr: [0.1, 0.1], spx: 0.03, spy: 0, hy: 0, hp: 0 };
  const sp = Math.hypot(p.vel.x, p.vel.z), f = p.fwd;
  const vf = p.vel.x * f.x + p.vel.z * f.z, vl = p.vel.x * Math.cos(p.face) - p.vel.z * Math.sin(p.face);
  const air = p.jumpY > 0.02 || p.hang > 0;
  const holding = ball.holder === p && ball.state === 'held';
  const dom = p.lefty ? 0 : 1, off = 1 - dom;

  // ── 하체 ──
  if (p.seated) {
    P.thx = [-1.5, -1.5]; P.kn = [1.5, 1.5]; P.shx = [-0.5, -0.5]; P.el = [-0.85, -0.85]; P.shz = [0.12, -0.12]; P.spx = -0.05;
    if (p.clap > 0) { P.shx = [-1.25, -1.25]; P.el = [-1.1, -1.1]; const c = Math.abs(Math.sin(T * 14)) * 0.45; P.shz = [-0.1 + c, 0.1 - c]; }
  } else if (air) { P.thx = [-0.55, -0.15]; P.kn = [1.0, 0.55]; }
  else if (sp > 0.3) {
    const A = clamp(sp / 7.5, 0.18, 1);
    const slide = p.stance && Math.abs(vl) > Math.abs(vf) * 0.9 && sp < 5.5;
    const back = !slide && vf < -0.4;
    p.ph += dt * sp / (D.H * (slide ? 0.3 : 0.47)) * Math.PI;
    if (slide) {
      const o = Math.sin(p.ph);
      P.thx = [-0.5, -0.5]; P.kn = [0.95, 0.95]; P.thz = [0.22 + 0.17 * o, -0.22 + 0.17 * o]; P.spx = 0.28;
    } else {
      const amp = back ? 0.55 : 1;
      for (let i = 0; i < 2; i++) {
        const ph = p.ph + i * Math.PI, sn = Math.sin(ph), cs = Math.cos(ph);
        P.thx[i] = (back ? sn : -sn) * A * 0.95 * amp - 0.06;
        P.kn[i] = 0.15 + A * 1.55 * Math.max(0, back ? -cs : cs) * amp;
        P.shx[i] = (back ? -sn : sn) * A * amp;
        P.el[i] = -(0.35 + A * 1.05);
      }
      P.spx = back ? -0.06 : 0.05 + 0.17 * A; P.spy = Math.sin(p.ph) * 0.12 * A;
    }
  } else if (p.stance) { P.thx = [-0.5, -0.5]; P.kn = [0.95, 0.95]; P.thz = [0.2, -0.2]; P.spx = 0.3; }
  else {
    P.thx = [-0.07, -0.03]; P.kn = [0.12, 0.08];
    if (p.tired) { P.spx = 0.85; P.thx = [-0.45, -0.45]; P.kn = [0.75, 0.75]; P.shx = [-0.9, -0.9]; P.el = [-0.15, -0.15]; P.shz = [0.25, -0.25]; }
  }
  if (p.stance && !air && !holding) { P.shz = [1.05, -1.05]; P.shx = [-0.35, -0.35]; P.el = [-0.55, -0.55]; }

  // ── 상체 동작 ──
  const sh = p.shooting;
  if (p.hang > 0) { P.shx = [-3.05, -3.05]; P.el = [-0.05, -0.05]; P.shz = [0.12, -0.12]; P.thx = [0.1, 0.05]; P.kn = [0.5, 0.4]; P.spx = -0.1; }
  else if (sh && sh.dunk) { P.shx[dom] = -3.0; P.el[dom] = -1.9; P.shx[off] = -1.3; P.el[off] = -0.4; P.thx[off] = -1.1; P.kn[off] = 1.4; P.thx[dom] = -0.2; P.kn[dom] = 0.7; }
  else if (sh && sh.layup) {
    const pr = 1 - sh.t / sh.dur;
    P.thx[off] = -1.35; P.kn[off] = 1.7; P.thx[dom] = 0.05; P.kn[dom] = 0.25;
    P.shx[dom] = -2.2 - 0.7 * pr; P.el[dom] = -0.9 * (1 - pr) - 0.15; P.shx[off] = -1.2; P.el[off] = -0.7;
  } else if (sh) {
    const pr = sh.meter ? clamp(G.meter ? G.meter.v / 0.8 : 1, 0, 1) : 1 - sh.t / sh.dur;
    if (pr < 0.3 && !air) { P.thx = [-0.45, -0.45]; P.kn = [0.85, 0.85]; P.shx = [-1.0, -1.0]; P.el = [-1.6, -1.6]; P.shz = [-0.2, 0.2]; P.spx = 0.15; }
    else { P.shx[dom] = -2.5 - 0.25 * pr; P.el[dom] = -1.75 + 0.3 * pr; P.shx[off] = -2.25; P.el[off] = -1.35; P.shz[off] = off === 0 ? -0.25 : 0.25; P.shz[dom] = dom === 0 ? 0.05 : -0.05; P.spx = -0.04; }
  }
  else if (p.follow > 0) { P.shx[dom] = -2.8; P.el[dom] = -0.08; P.wr[dom] = 1.1; P.shx[off] = -2.2; P.el[off] = -0.5; }
  else if (p.passT > 0) { const s = 1 - p.passT / 0.28; P.shx = [-1.45, -1.45]; P.el = [-1.6 * (1 - s) - 0.1, -1.6 * (1 - s) - 0.1]; P.shz = [-0.15, 0.15]; P.wr = [0.6 * s, 0.6 * s]; }
  else if (holding && (p.oob || p.ftHold)) { P.shx = [-0.75, -0.75]; P.el = [-1.65, -1.65]; P.shz = [-0.25, 0.25]; }
  else if (holding && air) { P.shx = [-2.7, -2.7]; P.el = [-1.0, -1.0]; P.shz = [-0.2, 0.2]; }
  else if (holding) {
    const b = Math.abs(Math.cos(p.dph)), h = p.dh, o = 1 - h;
    P.shx[h] = -0.3 - 0.3 * b; P.el[h] = -0.5 - 0.5 * b; P.shz[h] = h === 0 ? 0.2 : -0.2; P.wr[h] = 0.4 * b;
    P.shx[o] = -0.75; P.el[o] = -1.0; P.shz[o] = o === 0 ? 0.45 : -0.45; P.spx += 0.12;
  }
  else if (air) { P.shx = [-2.95, -2.95]; P.el = [-0.15, -0.15]; P.shz = [0.2, -0.2]; }
  else if (p.celebrate > 0) { P.shx[dom] = -2.9; P.el[dom] = -1.2; P.shz[dom] = dom === 0 ? 0.2 : -0.2; }
  if (p.isRef && p.sig) {
    const s = p.sig;
    if (s.type === 'foul') { if (s.t > 0.9) { P.shx[1] = -3.0; P.el[1] = -0.5; } else { P.shx[1] = -1.55; P.el[1] = -0.05; } }
    else if (s.type === 'viol') { P.shx = [-1.2, -1.2]; P.el = [-1.3 + Math.sin(T * 14) * 0.5, -1.3 + Math.cos(T * 14) * 0.5]; P.shz = [-0.3, 0.3]; }
    else if (s.type === 'three') { P.shx[1] = -3.0; P.el[1] = -0.1; P.shz[1] = -0.3; }
    else if (s.type === 'three2') { P.shx = [-3.0, -3.0]; P.el = [-0.1, -0.1]; P.shz = [0.25, -0.25]; }
    else if (s.type === 'toss') { P.shx[1] = -2.9; P.el[1] = -0.1; }
    else if (s.type === 'hold') { P.shx[1] = -1.1; P.el[1] = -1.2; }
    else if (s.type === 'sub') { P.shx[1] = -2.6; P.el[1] = -0.4 + Math.sin(T * 10) * 0.45; }
  }
  // 발목: 지면에 붙은 발은 평평하게
  for (let i = 0; i < 2; i++) P.an[i] = p.seated ? 0 : air ? 0.5 : -(P.thx[i] + P.kn[i]) * (sp > 0.3 && !p.stance ? 0.5 : 1);
  // 시선
  const look = p.isRef && p.sig && p.sig.target ? p.sig.target.pos : ball.pos;
  const yaw = wrapA(Math.atan2(look.x - p.pos.x, look.z - p.pos.z) - p.face) - r.spine.rotation.y;
  P.hy = clamp(yaw, -1.1, 1.1);
  P.hp = clamp(-Math.atan2(look.y - (p.jumpY + D.H * 0.93), Math.max(0.6, distH(look, p.pos))), -0.6, 0.45);

  const kf = p.follow > 0 || p.passT > 0 || sh ? 1 - Math.exp(-dt * 24) : kk;
  const J = (o, ax, v, k) => { o.rotation[ax] += (v - o.rotation[ax]) * k; };
  for (let i = 0; i < 2; i++) {
    J(r.th[i], 'x', P.thx[i], kk); J(r.th[i], 'z', P.thz[i], kk); J(r.kn[i], 'x', P.kn[i], kk); J(r.an[i], 'x', P.an[i], kk);
    J(r.sh[i], 'x', P.shx[i], kf); J(r.sh[i], 'z', P.shz[i], kf); J(r.el[i], 'x', P.el[i], kf); J(r.wr[i], 'x', P.wr[i], kf);
  }
  J(r.spine, 'x', P.spx, kk); J(r.spine, 'y', P.spy, kk); J(r.head, 'y', P.hy, 0.15); J(r.head, 'x', P.hp, 0.15);
  // 골반 높이: 발이 바닥에 닿도록
  if (p.seated) r.hips.position.y = Math.max(0.6, D.shin + D.ankleH + 0.03);
  else if (air) r.hips.position.y = D.hipY;
  else {
    let ext = 0;
    for (let i = 0; i < 2; i++) { const a = r.th[i].rotation.x, z = r.th[i].rotation.z, k = r.kn[i].rotation.x; ext = Math.max(ext, (D.thigh * Math.cos(a) + D.shin * Math.cos(a + k)) * Math.cos(z)); }
    r.hips.position.y = D.ankleH + ext;
  }
  r.root.position.set(p.pos.x, p.seated ? 0 : p.jumpY, p.pos.z);
  r.root.rotation.y = p.face;
  r.ring.position.y = 0.012 - (p.seated ? 0 : p.jumpY);
  r.spine.scale.set(1 + Math.sin(T * 2.2 + p.ph) * 0.008, 1, 1);
  if (r.marker.visible) { r.marker.position.y = D.H + 0.5 + Math.sin(T * 4) * 0.07; r.marker.rotation.y += dt * 2; }
  if (r.ring.visible) r.ring.material.opacity = holding ? 1 : p.isUser ? 0.95 : 0.4;
}

function placeHeldBall(p, dt) {
  const r = p.rig; r.root.updateMatrixWorld(true);
  const dom = p.lefty ? 0 : 1, f = p.fwd;
  const pw = i => r.palm[i].getWorldPosition(i === 0 ? _w : _w2);
  const sh = p.shooting, air = !p.grounded;
  if (sh || p.follow > 0) {
    const pr = sh && !sh.dunk && !sh.layup ? (sh.meter ? clamp(G.meter ? G.meter.v / 0.8 : 1, 0, 1) : 1 - sh.t / sh.dur) : 1;
    if (pr < 0.3 && !air) { const a = pw(0).clone(), b = pw(1); ball.pos.copy(a.add(b).multiplyScalar(0.5)).addScaledVector(f, BALL_R * 0.9); }
    else ball.pos.copy(pw(dom)).add(V(0, BALL_R * 0.75, 0)).addScaledVector(f, 0.04);
    return;
  }
  if (p.oob || p.ftHold || air || p.passT > 0) {
    const a = pw(0).clone(), b = pw(1);
    ball.pos.copy(a.add(b).multiplyScalar(0.5)).addScaledVector(f, BALL_R * 0.9);
    if (air) ball.pos.y += 0.05;
    return;
  }
  // 드리블
  const sp = Math.hypot(p.vel.x, p.vel.z);
  p.dph += dt * (6.8 + sp * 0.55);
  const [opp] = nearestOpp(p);
  if (opp) {
    const side = (opp.pos.x - p.pos.x) * Math.cos(p.face) - (opp.pos.z - p.pos.z) * Math.sin(p.face);
    const want = side > 0.25 ? 1 : side < -0.25 ? 0 : p.dh;
    p.crossCd -= dt;
    if (want !== p.dh && p.crossCd <= 0 && distH(opp.pos, p.pos) < 3) { p.dh = want; p.crossT = 0.26; p.crossCd = 1.1; }
  }
  const hand = pw(p.dh).clone();
  const b = Math.abs(Math.cos(p.dph));
  if (p.crossT > 0) {
    p.crossT -= dt;
    const s = 1 - p.crossT / 0.26, from = pw(1 - p.dh);
    ball.pos.set(from.x + (hand.x - from.x) * s + f.x * 0.25, BALL_R + Math.abs(Math.cos(s * Math.PI)) * (hand.y - BALL_R) * 0.85, from.z + (hand.z - from.z) * s + f.z * 0.25);
  } else ball.pos.set(hand.x + f.x * 0.06, BALL_R + (hand.y - BALL_R * 1.8) * b, hand.z + f.z * 0.06);
  if (p.lastB > 0.15 && b <= 0.15) Sound.dribble(clamp(1 - camera.position.distanceTo(ball.pos) / 30, 0, 1));
  p.lastB = b;
}

// ───────────────────────── camera / HUD ─────────────────────────
const camPos = V(0, 10, 17), camLook = V(0, 1, 0);
function updateCamera(dt) {
  const fx = clamp(ball.pos.x, -11, 11);
  let tp, tl;
  if (G.cam === 0) { tp = V(fx * 0.82, 10.5, 17.5); tl = V(fx * 0.92, 0.6, -0.6); }
  else if (G.cam === 1) { tp = V(fx * 0.9, 6, 12); tl = V(fx * 0.95, 1.2, -0.5); }
  else { tp = V(fx * 0.6, 22, 9); tl = V(fx * 0.7, 0, 0); }
  if (window.__cam) { tp = window.__cam.p; tl = window.__cam.l; }
  camPos.lerp(tp, Math.min(1, dt * 3)); camLook.lerp(tl, Math.min(1, dt * 4));
  camera.position.copy(camPos); camera.lookAt(camLook);
}
const fmtClock = s => s < 60 ? s.toFixed(1) : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
let hudT = 0;
function updateHud(dt) {
  hudT -= dt;
  const mw = $('meterWrap');
  if (G.meter) { mw.style.display = 'block'; $('meterFill').style.width = Math.min(100, G.meter.v * 100) + '%'; } else mw.style.display = 'none';
  if (hudT > 0) return; hudT = 0.1;
  $('s0').textContent = G.score[0]; $('s1').textContent = G.score[1];
  $('qtr').textContent = G.q > 4 ? `OT${G.q - 4}` : `${G.q}Q`;
  $('clock').textContent = fmtClock(Math.max(0, G.clock));
  $('shotclock').textContent = Math.max(0, Math.ceil(G.shot));
  $('shotclock').style.opacity = G.shot <= G.clock && G.phase !== 'jump' ? 1 : 0.25;
  $('possL').style.opacity = G.offense === 0 ? 1 : 0; $('possR').style.opacity = G.offense === 1 ? 1 : 0;
  for (const t of [0, 1]) $('tf' + t).textContent = `팀파울 ${G.teamFouls[t]}${G.teamFouls[t] >= 5 ? ' · BONUS' : ''}`;
  $('dirNote').textContent = `SAS 공격 ${HOOPS[0].x > 0 ? '→' : '←'}`;
  const h = ball.holder;
  $('handler').textContent = h && ball.state === 'held' ? `🏀 ${h.name} #${h.num} · ${h.cm}cm` : '';
  const u = user(), b = u.box;
  $('stats').innerHTML = `<b>#${u.num} ${u.name.toUpperCase()}</b> · ${u.cm}cm<br>${b.pts} PTS · ${b.reb} REB · ${b.ast} AST · ${b.blk} BLK · ${b.stl} STL<br>FG ${b.fgm}/${b.fga} · 3P ${b.tpm}/${b.tpa} · FT ${b.ftm}/${b.fta} · 파울 ${u.pf}
  <div class="stam"><div style="width:${u.stamina}%;background:${u.stamina > 50 ? '#3dff7a' : u.stamina > 30 ? '#ffd21f' : '#ff5b5b'}"></div></div>`;
}

// ───────────────────────── sub panel ─────────────────────────
let subSel = null;
function toggleSubPanel() {
  G.subPanel = !G.subPanel;
  $('subPanel').style.display = G.subPanel ? 'flex' : 'none';
  subSel = null;
  if (G.subPanel) renderSubPanel();
  else if (G.subQ.length && G.phase !== 'live') processSubs();
}
function renderSubPanel() {
  const row = (p, kind) => `<div class="sp ${kind} ${subSel === p ? 'sel' : ''} ${p.fouledOut ? 'out' : ''}" data-i="${roster[0].indexOf(p)}">
    <span class="nm">#${p.num} ${p.name}${p.isUser ? ' (나)' : ''}</span><span class="mt">${p.cm}cm · ${p.box.pts}점 · 파울 ${p.pf}${p.fouledOut ? ' 퇴장' : ''}</span>
    <div class="stam"><div style="width:${p.stamina}%;background:${p.stamina > 50 ? '#3dff7a' : p.stamina > 30 ? '#ffd21f' : '#ff5b5b'}"></div></div></div>`;
  $('subCourt').innerHTML = teams[0].map(p => row(p, 'court')).join('');
  $('subBench').innerHTML = roster[0].filter(p => !p.onCourt).map(p => row(p, 'bench')).join('');
  $('subQueue').innerHTML = G.subQ.length ? '대기 중인 교체: ' + G.subQ.map(([o, i]) => `${lastName(i.name)} ↔ ${lastName(o.name)}`).join(', ') + ' (다음 데드볼 때 적용)' : '코트 선수를 고른 뒤 벤치 선수를 누르세요';
  $('autoSub').checked = G.autoSub;
  document.querySelectorAll('#subPanel .sp').forEach(el => el.onclick = () => {
    const p = roster[0][+el.dataset.i];
    if (p.onCourt) subSel = p;
    else if (subSel && !p.fouledOut) { G.subQ = G.subQ.filter(([o, i]) => o !== subSel && i !== p); G.subQ.push([subSel, p]); subSel = null; }
    renderSubPanel();
  });
}
$('autoSub').onchange = e => { G.autoSub = e.target.checked; };
$('subClose').onclick = () => toggleSubPanel();

// ───────────────────────── main loop ─────────────────────────
function update(dt) {
  T += dt;
  for (const n of nets) { if (n.t > 0) { n.t -= dt; const k = 1 + Math.sin(n.t * 30) * 0.15 * n.t; n.mesh.scale.set(1 / k, k, 1 / k); } else n.mesh.scale.set(1, 1, 1); }
  for (const m of ledMats) m.map.offset.x += dt * 0.04;
  crowd.update(dt, G.excite, G.crowdMode);
  if (G.state === 'menu') return;
  if (G.paused || G.subPanel) return;
  G.excite += (0.18 - G.excite) * Math.min(1, dt * 0.35);
  G.crowdT -= dt; if (G.crowdT <= 0) { Sound.setCrowd(G.excite); G.crowdT = 0.2; }
  G.crowdMode = '';
  if (G.phase === 'live' && G.offense === 1 && ball.holder && ball.holder.pos.x * sgn(1) > 0) {
    G.crowdMode = 'clap'; G.chantT -= dt;
    if (G.chantT <= 0) { Sound.defenseChant(); G.chantT = 2.6; }
  }
  for (const p of onCourt) { p.follow -= dt; p.passT -= dt; p.celebrate -= dt; p.tired = false; }
  for (const p of roster[0]) p.clap -= dt;

  if (G.state === 'play') {
    switch (G.phase) {
      case 'jump': updateJump(dt); break;
      case 'dead':
        G.dead -= dt;
        for (const p of onCourt) {
          if (p.isUser) userControl(p, dt);
          else if (p.target) steer(p, p.target, p.speed * 0.75, dt);
          else steer(p, null, 0, dt);
          if (p.stamina < 45 && !p.target && Math.hypot(p.vel.x, p.vel.z) < 0.3) p.tired = true;
        }
        if (G.dead <= 0) { const f = G.onDead; G.onDead = null; for (const p of onCourt) p.target = null; f && f(); }
        break;
      case 'inbound': updateInbound(dt); break;
      case 'ft': updateFT(dt); break;
      case 'live': updateLive(dt); break;
    }
  } else for (const p of onCourt) steer(p, null, 0, dt);
  movePlayers(dt);
  ballPhysics(dt);
  updateRefs(dt);
  for (const p of onCourt) animatePerson(p, dt);
  for (const r of refs) animatePerson(r, dt);
  if (Math.floor(T * 60) % 3 === 0) for (const p of [...roster[0], ...roster[1]]) if (!p.onCourt) animatePerson(p, dt * 3);
  if (ball.state === 'held' && ball.holder) placeHeldBall(ball.holder, dt);
}

function updateLive(dt) {
  if (!G.whistled) { G.clock -= dt; if (ball.state !== 'shot') G.shot -= dt; }
  G.call = Math.max(0, G.call - dt);
  if (G.clock <= 0) { G.clock = 0; if (ball.state !== 'shot') { endQuarter(); return; } }
  if (G.shot <= 0 && (ball.state === 'held' || ball.state === 'pass') && !G.whistled) { Sound.buzzer(); violation('24초 바이얼레이션', 'Shot clock violation', ball.pos.clone()); return; }
  // 8초 / 백코트
  const off = G.offense, s = sgn(off), h = ball.holder;
  if ((ball.state === 'held' || ball.state === 'pass') && !G.whistled) {
    if (!G.front) {
      if (h && ball.state === 'held' && h.team === off && h.pos.x * s > 0.15) G.front = true;
      else { G.eight += dt; if (G.eight >= 8) { violation('8초 바이얼레이션', 'Eight second violation', ball.pos.clone()); return; } }
    } else if (h && ball.state === 'held' && h.team === off && h.pos.x * s < -0.15 && !h.oob) { violation('하프코트 바이얼레이션', 'Backcourt violation', h.pos.clone()); return; }
  }
  if (G.meter && !G.meter.ft) {
    G.meter.v += dt / 0.6;
    const u = user();
    if (ball.holder !== u) { G.meter = null; u.shooting = null; }
    else if (G.meter.v >= 1.05) releaseMeter();
  }
  computeChasers();
  for (const p of onCourt) p.isUser ? userControl(p, dt) : ai(p, dt);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  for (let i = 0; i < (window.__speed || 1); i++) update(dt);
  if (G.state !== 'menu') { ballMesh.position.copy(ball.pos); updateCamera(dt); updateHud(dt); }
  else { const a = now / 7000; camera.position.set(Math.sin(a) * 20, 8, Math.cos(a) * 16); camera.lookAt(0, 1, 0); ballMesh.position.set(0, 0.12, 0); }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ───────────────────────── menu ─────────────────────────
let picked = null;
const grid = $('teamGrid');
for (const [k, t] of Object.entries(TEAMS)) {
  const el = document.createElement('div');
  el.className = 'team';
  const star = t.starters.reduce((a, b) => (b.ovr > a.ovr ? b : a));
  el.innerHTML = `<div class="ab">${k}</div><div class="nm">${t.name}</div><div class="st">에이스: ${star.n}</div>`;
  el.onclick = () => { picked = k; grid.querySelectorAll('.team').forEach(e => e.classList.remove('sel')); el.classList.add('sel'); $('startBtn').disabled = false; };
  grid.appendChild(el);
}
function start(k) {
  Sound.init();
  G.qLen = +$('qlen').value; G.diff = +$('diff').value;
  $('menu').style.display = 'none'; $('over').style.display = 'none'; $('hud').style.display = 'block';
  newGame(k);
}
$('startBtn').onclick = () => picked && start(picked);
$('againBtn').onclick = () => start(G.oppKey);
$('menuBtn').onclick = () => { $('over').style.display = 'none'; $('hud').style.display = 'none'; $('menu').style.display = 'flex'; G.state = 'menu'; };
window.__game = { step: (n, dt = 1 / 60) => { for (let i = 0; i < n; i++) { update(dt); ballMesh.position.copy(ball.pos); } }, G, ball, get teams() { return teams; }, get roster() { return roster; }, refs, Sound };
