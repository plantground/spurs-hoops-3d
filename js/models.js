import * as THREE from 'three';

export const HX = 14, HZ = 7.5, RIM_Y = 3.05, RIM_R = 0.23, BALL_R = 0.12, RIM_X = 12.425, BOARD_X = 12.8;
export const SKIN = ['#f0cfb2', '#ddb08a', '#c38a5e', '#9a6542', '#714630', '#4f301f'];
export const HAIRC = { k: '#17120f', b: '#4b311f', l: '#a07a4a', r: '#7d4526', g: '#8e8983', p: '#e88ab4', w: '#e7d9b6' };

const cache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.62, ...o }));
  return cache.get(key);
}
const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
function shade(hex, f) { const c = new THREE.Color(hex); c.multiplyScalar(f); return '#' + c.getHexString(); }

// ───────────────────────── court & arena ─────────────────────────
function courtTexture(renderer) {
  const W = 2048, k = W / 30, H = Math.round(17 * k);
  const [c, g] = canvas(W, H);
  const X = x => (x + 15) * k, Z = z => (z + 8.5) * k;
  g.fillStyle = '#16181d'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#d4a26a'; g.fillRect(X(-HX), Z(-HZ), 28 * k, 15 * k);
  for (let i = 0; i < 15 * k; i += 9) {
    g.fillStyle = `rgba(${110 + Math.random() * 50},${65 + Math.random() * 35},20,${0.04 + Math.random() * 0.08})`;
    g.fillRect(X(-HX), Z(-HZ) + i, 28 * k, 4.5);
  }
  for (let i = 0; i < 700; i++) { g.fillStyle = 'rgba(80,45,10,0.07)'; g.fillRect(X(-HX) + Math.random() * 28 * k, Z(-HZ) + Math.floor(Math.random() * 15 * k / 9) * 9, 1.5, 9); }
  for (const s of [-1, 1]) { g.fillStyle = 'rgba(22,22,26,0.9)'; g.fillRect(s < 0 ? X(-HX) : X(HX - 5.8), Z(-2.45), 5.8 * k, 4.9 * k); }
  g.fillStyle = 'rgba(22,22,26,0.88)'; g.beginPath(); g.arc(X(0), Z(0), 1.8 * k, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c4ced4'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 ${0.72 * k}px Arial Black, Arial`; g.fillText('SPURS', X(0), Z(0));
  g.fillStyle = 'rgba(196,206,212,0.18)'; g.font = `900 ${1.1 * k}px Arial Black, Arial`;
  g.fillText('SAN ANTONIO', X(-6.5), Z(0)); g.fillText('SAN ANTONIO', X(6.5), Z(0));
  for (const s of [-1, 1]) {
    g.save(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = `900 ${0.6 * k}px Arial`;
    g.translate(X(s * (HX + 0.5)), Z(0)); g.rotate(s * Math.PI / 2); g.fillText('GO SPURS GO', 0, 0); g.restore();
  }
  g.strokeStyle = '#fff'; g.lineWidth = 0.05 * k;
  g.strokeRect(X(-HX), Z(-HZ), 28 * k, 15 * k);
  g.beginPath(); g.moveTo(X(0), Z(-HZ)); g.lineTo(X(0), Z(HZ)); g.stroke();
  g.beginPath(); g.arc(X(0), Z(0), 1.8 * k, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(X(0), Z(0), 0.6 * k, 0, Math.PI * 2); g.stroke();
  const off = Math.sqrt(6.75 ** 2 - 6.6 ** 2), a = Math.atan2(6.6, off);
  for (const s of [-1, 1]) {
    const hx = X(s * RIM_X), hz = Z(0), bx = X(s * HX), cx = X(s * (RIM_X - off));
    g.strokeRect(s < 0 ? X(-HX) : X(HX - 5.8), Z(-2.45), 5.8 * k, 4.9 * k);
    g.beginPath(); g.arc(X(s * (HX - 5.8)), hz, 1.8 * k, 0, Math.PI * 2); g.stroke();
    for (const zz of [-6.6, 6.6]) { g.beginPath(); g.moveTo(bx, Z(zz)); g.lineTo(cx, Z(zz)); g.stroke(); }
    g.beginPath();
    if (s < 0) g.arc(hx, hz, 6.75 * k, -a, a); else g.arc(hx, hz, 6.75 * k, Math.PI - a, Math.PI + a);
    g.stroke();
    g.beginPath(); g.arc(hx, hz, 1.25 * k, s < 0 ? -Math.PI / 2 : Math.PI / 2, s < 0 ? Math.PI / 2 : Math.PI * 1.5); g.stroke();
    for (const d of [2.1, 3.0, 3.9]) for (const zz of [-2.45, 2.45]) { // lane hash marks
      g.beginPath(); g.moveTo(X(s * (HX - d)), Z(zz)); g.lineTo(X(s * (HX - d)), Z(zz + Math.sign(zz) * 0.2)); g.stroke();
    }
  }
  const t = tex(c); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t;
}

function ledTexture(text, bg = '#000', fg = '#c4ced4') {
  const [c, g] = canvas(1024, 64);
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 64);
  g.fillStyle = fg; g.font = '900 42px Arial'; g.textBaseline = 'middle';
  let x = 10; while (x < 1024) { g.fillText(text, x, 33); x += g.measureText(text).width + 60; }
  const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t;
}

export function buildArena(scene, renderer) {
  const court = new THREE.Mesh(new THREE.PlaneGeometry(30, 17), new THREE.MeshStandardMaterial({ map: courtTexture(renderer), roughness: 0.38, metalness: 0.05 }));
  court.rotation.x = -Math.PI / 2; court.receiveShadow = true; scene.add(court);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat('#121419', { roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; floor.receiveShadow = true; scene.add(floor);

  const nets = [];
  for (const s of [1, -1]) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 1.8), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.05 }));
    board.position.set(s * (BOARD_X + 0.025), 3.42, 0); scene.add(board);
    const e1 = new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })); e1.position.copy(board.position); scene.add(e1);
    const e2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.055, 0.45, 0.59)), new THREE.LineBasicMaterial({ color: 0xffffff })); e2.position.set(s * (BOARD_X + 0.02), 3.27, 0); scene.add(e2);
    const metal = mat('#23262e', { metalness: 0.6, roughness: 0.35 });
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.7, 0.32), metal); pole.position.set(s * 15.5, 1.85, 0); pole.castShadow = true; scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.2, 0.2), metal); arm.position.set(s * 14.2, 3.6, 0); scene.add(arm);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.7), mat('#0d0d0f')); pad.position.set(s * 15.5, 0.5, 0); scene.add(pad);
    const padTop = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 1.72), mat('#c4ced4')); padTop.position.set(s * 15.5, 1.0, 0); scene.add(padTop);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.018, 8, 32), mat('#ff5a0a', { metalness: 0.4, roughness: 0.4 }));
    rim.rotation.x = Math.PI / 2; rim.position.set(s * RIM_X, RIM_Y, 0); scene.add(rim);
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.12), rim.material); br.position.set(s * (BOARD_X - 0.08), RIM_Y, 0); scene.add(br);
    const net = new THREE.Mesh(new THREE.CylinderGeometry(RIM_R, 0.13, 0.43, 16, 5, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.85 }));
    net.position.set(s * RIM_X, RIM_Y - 0.215, 0); scene.add(net); nets.push({ mesh: net, s, t: 0 });
  }

  // scorer's table + LED boards
  const ledMat = new THREE.MeshStandardMaterial({ map: ledTexture('GO SPURS GO  •  SAN ANTONIO SPURS  •', '#050505', '#ffd21f'), emissive: 0xffffff, emissiveIntensity: 0.45 });
  ledMat.emissiveMap = ledMat.map;
  const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.85, 0.7), [mat('#111'), mat('#111'), mat('#222'), mat('#111'), ledMat, mat('#111')]);
  table.position.set(0, 0.43, -9.35); scene.add(table);
  const ledMat2 = new THREE.MeshStandardMaterial({ map: ledTexture('SAN ANTONIO SPURS  •  DEFENSE  •', '#050505', '#c4ced4'), emissive: 0xffffff, emissiveIntensity: 0.4 });
  ledMat2.emissiveMap = ledMat2.map; ledMat2.map.repeat.set(3, 1);
  const board2 = new THREE.Mesh(new THREE.BoxGeometry(34, 0.8, 0.1), [mat('#111'), mat('#111'), mat('#111'), mat('#111'), ledMat2, mat('#111')]);
  board2.position.set(0, 0.4, -10.3); scene.add(board2);
  const ledMats = [ledMat, ledMat2];
  // bench chairs
  for (const side of [-1, 1]) for (let k = 0; k < 8; k++) {
    const x = side * (4 + k * 0.9);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.5), mat(side < 0 ? '#1a1a1a' : '#1d3f9a')); seat.position.set(x, 0.48, -9.45); scene.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.08), seat.material); back.position.set(x, 0.8, -9.7); scene.add(back);
    for (const lx of [-0.22, 0.22]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), mat('#555')); l.position.set(x + lx, 0.24, -9.45); scene.add(l); }
  }
  // jumbotron
  const jb = new THREE.Group();
  const jbBox = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.6, 5.6), mat('#0c0d12', { emissive: '#0d1530' })); jb.add(jbBox);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.4, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xffd21f, emissive: 0xffd21f, emissiveIntensity: 0.6, side: THREE.DoubleSide })); ring.position.y = -1.6; jb.add(ring);
  jb.position.set(0, 14, 0); scene.add(jb);
  return { nets, ledMats };
}

// ───────────────────────── crowd (instanced people) ─────────────────────────
export function buildCrowd(scene) {
  const fans = [];
  const stepMat = mat('#1a1d27', { roughness: 0.9 });
  const seatsPos = [];
  const addRows = (rows, fn) => { for (let r = 0; r < rows; r++) fn(r); };
  // far side
  addRows(11, r => {
    const z = -11 - r * 0.85, y = 0.45 * r;
    const step = new THREE.Mesh(new THREE.BoxGeometry(38, 0.45 * (r + 1), 0.85), stepMat); step.position.set(0, 0.225 * (r + 1) - 0.0, z); scene.add(step);
    for (let x = -18.5; x <= 18.5; x += 0.62) seatsPos.push([x + Math.random() * 0.05, y + 0.45, z, 0]);
  });
  // ends
  for (const s of [-1, 1]) addRows(10, r => {
    const x = s * (18.2 + r * 0.85), y = 0.45 * r;
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45 * (r + 1), 21), stepMat); step.position.set(x, 0.225 * (r + 1), 0); scene.add(step);
    for (let z = -10; z <= 10; z += 0.62) seatsPos.push([x, y + 0.45, z, -s * Math.PI / 2]);
  });
  // near side (low rows so the camera can see over)
  addRows(3, r => {
    const z = 10.6 + r * 0.85, y = 0.35 * r;
    const step = new THREE.Mesh(new THREE.BoxGeometry(34, 0.35 * (r + 1), 0.85), stepMat); step.position.set(0, 0.175 * (r + 1), z); scene.add(step);
    for (let x = -16.5; x <= 16.5; x += 0.62) seatsPos.push([x, y + 0.35, z, Math.PI]);
  });
  // courtside floor seats (far baseline corners)
  for (const s of [-1, 1]) for (let x = 5; x <= 13; x += 0.65) seatsPos.push([s * x, 0, -10.0 + 0.02, 0]);

  const skin = ['#f0cfb2', '#ddb08a', '#c38a5e', '#9a6542', '#714630', '#4f301f'];
  const shirts = ['#111111', '#111111', '#1a1a1a', '#c4ced4', '#ffffff', '#8a8d93', '#ffd21f', '#ffd21f', '#1d4ed8', '#2563eb', '#7a1f1f', '#2b5d34', '#f2f2f2', '#000000', '#d1d5db', '#ea580c'];
  const pants = ['#1f2937', '#111827', '#374151', '#1e3a8a', '#3f3f46', '#57534e'];
  const hairs = ['#17120f', '#17120f', '#3b2a1e', '#5b3b24', '#8a6a3a', '#a3a3a3', '#2b1d14'];
  for (const s of seatsPos) {
    if (Math.random() < 0.06) continue;
    fans.push({ x: s[0], y: s[1], z: s[2], ry: s[3], sc: 0.88 + Math.random() * 0.2, ph: Math.random() * 10, eager: Math.random(),
      stand: 0, arm: 0, skin: skin[Math.floor(Math.random() * skin.length)], shirt: shirts[Math.floor(Math.random() * shirts.length)],
      pants: pants[Math.floor(Math.random() * pants.length)], hair: hairs[Math.floor(Math.random() * hairs.length)], bald: Math.random() < 0.15, cap: Math.random() < 0.12 });
  }
  const N = fans.length;
  const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.5, 6); armGeo.translate(0, -0.25, 0);
  const parts = {
    legs: new THREE.InstancedMesh(new THREE.BoxGeometry(0.36, 0.15, 0.46), new THREE.MeshStandardMaterial({ roughness: 0.9 }), N),
    shin: new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.42, 0.12), new THREE.MeshStandardMaterial({ roughness: 0.9 }), N),
    torso: new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.15, 0.56, 8), new THREE.MeshStandardMaterial({ roughness: 0.85 }), N),
    head: new THREE.InstancedMesh(new THREE.SphereGeometry(0.105, 10, 8), new THREE.MeshStandardMaterial({ roughness: 0.7 }), N),
    hair: new THREE.InstancedMesh(new THREE.SphereGeometry(0.112, 10, 6, 0, Math.PI * 2, 0, 1.4), new THREE.MeshStandardMaterial({ roughness: 0.95 }), N),
    armL: new THREE.InstancedMesh(armGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N),
    armR: new THREE.InstancedMesh(armGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N),
  };
  const col = new THREE.Color();
  fans.forEach((f, i) => {
    parts.legs.setColorAt(i, col.set(f.pants)); parts.shin.setColorAt(i, col.set(f.pants));
    parts.torso.setColorAt(i, col.set(f.shirt)); parts.head.setColorAt(i, col.set(f.skin));
    parts.hair.setColorAt(i, col.set(f.cap ? (Math.random() < 0.5 ? '#111' : '#c4ced4') : f.bald ? f.skin : f.hair));
    const sleeve = Math.random() < 0.5 ? f.shirt : f.skin;
    parts.armL.setColorAt(i, col.set(sleeve)); parts.armR.setColorAt(i, col.set(sleeve));
  });
  for (const k in parts) { parts[k].instanceMatrix.setUsage(THREE.DynamicDrawUsage); parts[k].frustumCulled = false; scene.add(parts[k]); }

  const M = new THREE.Matrix4(), B = new THREE.Matrix4(), L = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1), sv = new THREE.Vector3();
  const place = (mesh, i, x, y, z, rx = 0, ry = 0, rz = 0) => {
    L.compose(v.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), s1);
    M.multiplyMatrices(B, L); mesh.setMatrixAt(i, M);
  };
  let T = 0, frame = 0;
  function update(dt, excite, mode) {
    T += dt; frame++;
    if (frame % 2) return;
    for (let i = 0; i < N; i++) {
      const f = fans[i];
      const wantStand = excite > 0.55 && f.eager < excite - 0.15 ? 1 : (mode === 'wave' && f.eager < 0.5 ? 1 : 0);
      f.stand += (wantStand - f.stand) * Math.min(1, dt * 8);
      let armT = 0;
      if (excite > 0.5 && f.eager < excite) armT = 1;
      else if (mode === 'clap' && f.eager < 0.7) armT = 0.5;
      else if (mode === 'wave' && f.eager < 0.6) armT = 1;
      f.arm += (armT - f.arm) * Math.min(1, dt * 6);
      const st = f.stand, bob = Math.sin(T * 9 + f.ph) * 0.05 * Math.max(st, excite > 0.5 ? 1 : 0);
      B.compose(v.set(f.x, f.y + st * 0.42 + bob, f.z), q.setFromEuler(e.set(0, f.ry, 0)), sv.set(f.sc, f.sc, f.sc));
      place(parts.legs, i, 0, 0.07 - st * 0.25, 0.2 - st * 0.15, st * 1.3);
      place(parts.shin, i, 0, -0.18 - st * 0.1, 0.42 - st * 0.2);
      place(parts.torso, i, 0, 0.36, 0, -0.05 + Math.sin(T * 0.7 + f.ph) * 0.04);
      place(parts.head, i, 0, 0.77, 0.01, 0, Math.sin(T * 0.5 + f.ph) * 0.4);
      place(parts.hair, i, 0, 0.79, -0.01, -0.15);
      let ax, az, w = 0;
      if (mode === 'clap' && f.arm > 0.2 && excite <= 0.5) { ax = -1.2; az = 0.35 + Math.abs(Math.sin(T * 7 + f.ph * 0.1)) * 0.35 * f.arm; }
      else { ax = -0.55 - f.arm * 2.4; az = 0.2 + f.arm * 0.25; w = mode === 'wave' ? Math.sin(T * 6 + f.ph) * 0.5 * f.arm : Math.sin(T * 12 + f.ph) * 0.25 * f.arm; }
      place(parts.armL, i, 0.19, 0.6, 0, ax, 0, az + w);
      place(parts.armR, i, -0.19, 0.6, 0, ax, 0, -az + w);
    }
    for (const k in parts) parts[k].instanceMatrix.needsUpdate = true;
  }
  return { update };
}

// ───────────────────────── people (players, refs) ─────────────────────────
function faceTexture(look, skinHex, isRef) {
  const W = 512, H = 256, [c, g] = canvas(W, H), cx = W / 2;
  g.fillStyle = skinHex; g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(cx, 125, 20, cx, 125, 260);
  rg.addColorStop(0, 'rgba(255,255,255,0.10)'); rg.addColorStop(1, 'rgba(0,0,0,0.28)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const hairC = HAIRC[look.hc] || '#111';
  const dark = shade(skinHex, 0.62);
  // hairline (painted part of buzz/fade/short cuts)
  if (look.hair !== 'bald') {
    g.fillStyle = hairC; g.globalAlpha = look.hair === 'buzz' || look.hair === 'fade' ? 0.82 : 0.95;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 118);
    g.bezierCurveTo(W - 60, 116, cx + 140, 100, cx + 128, 108); // behind right ear
    g.lineTo(cx + 110, 92); g.bezierCurveTo(cx + 80, 70, cx + 55, 62, cx, 60);
    g.bezierCurveTo(cx - 55, 62, cx - 80, 70, cx - 110, 92);
    g.lineTo(cx - 128, 108); g.bezierCurveTo(cx - 140, 100, 60, 116, 0, 118); g.closePath(); g.fill();
    g.globalAlpha = 1;
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`; g.fillRect(Math.random() * W, Math.random() * 100, 2, 2); }
  }
  // brows
  g.strokeStyle = look.hc === 'g' ? '#55504a' : (look.hc === 'p' || look.hc === 'w' ? '#3a2a1c' : hairC); g.lineCap = 'round'; g.lineWidth = 5;
  if (look.x.includes('uni')) { g.beginPath(); g.moveTo(cx - 36, 108); g.quadraticCurveTo(cx, 103, cx + 36, 108); g.stroke(); }
  else for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 9, 108); g.quadraticCurveTo(cx + s * 22, 102, cx + s * 37, 108); g.stroke(); }
  // eyes
  for (const s of [-1, 1]) {
    const ex = cx + s * 22, ey = 121;
    g.fillStyle = dark; g.beginPath(); g.ellipse(ex, ey + 1, 11, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f4efe8'; g.beginPath(); g.ellipse(ex, ey, 9, 4.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(ex + s * -1, ey, 3.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(ex + s * -1, ey, 1.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(ex + 1, ey - 2, 1.5, 1.5);
    g.strokeStyle = '#1a100a'; g.lineWidth = 1.8; g.beginPath(); g.ellipse(ex, ey, 9.5, 4.6, 0, Math.PI, Math.PI * 2); g.stroke();
  }
  // nose shading + nostrils
  g.fillStyle = shade(skinHex, 0.82); g.beginPath(); g.moveTo(cx - 4, 124); g.lineTo(cx - 9, 151); g.lineTo(cx + 9, 151); g.lineTo(cx + 4, 124); g.fill();
  g.fillStyle = dark; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 6, 152, 3.5, 2, 0, 0, Math.PI * 2); g.fill(); }
  // beard
  const beardA = { n: 0, s: 0.35, b: 0.8, f: 0.95 }[look.beard] || 0;
  if (beardA > 0) {
    const bc = look.hc === 'p' || look.hc === 'w' ? '#2b1d14' : hairC;
    g.save(); g.globalAlpha = beardA; g.fillStyle = bc;
    const w = look.beard === 'f' ? 92 : 80;
    g.beginPath(); g.moveTo(cx - w, 108); g.bezierCurveTo(cx - w + 4, 160, cx - 50, 205, cx, look.beard === 'f' ? 228 : 214);
    g.bezierCurveTo(cx + 50, 205, cx + w - 4, 160, cx + w, 108);
    g.lineTo(cx + w - 14, 110); g.bezierCurveTo(cx + 52, 150, cx + 40, 150, cx + 20, 157); g.lineTo(cx - 20, 157);
    g.bezierCurveTo(cx - 40, 150, cx - 52, 150, cx - w + 14, 110); g.closePath(); g.fill();
    g.restore();
    if (look.beard === 's') for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(cx - 80 + Math.random() * 160, 140 + Math.random() * 75, 1.5, 1.5); }
  }
  // lips
  g.fillStyle = shade(skinHex, 0.72); g.beginPath(); g.ellipse(cx, 172, 15, 5.5, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = shade(skinHex, 0.45); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 14, 172); g.quadraticCurveTo(cx, 174, cx + 14, 172); g.stroke();
  if (look.x.includes('mg')) { g.fillStyle = '#e8eef5'; g.beginPath(); g.ellipse(cx + 12, 175, 7, 3, 0.3, 0, Math.PI * 2); g.fill(); }
  // ears tone
  for (const ex of [cx - 128, cx + 128]) { g.fillStyle = shade(skinHex, 0.85); g.beginPath(); g.ellipse(ex, 125, 9, 16, 0, 0, Math.PI * 2); g.fill(); }
  return tex(c);
}

function tattooTexture(skinHex, seed) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = skinHex; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(15,20,25,0.65)'; g.fillStyle = 'rgba(15,20,25,0.55)'; g.lineWidth = 3;
  let r = seed * 9301 + 49297; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 14; i++) {
    const x = rnd() * 256, y = rnd() * 256, s = 10 + rnd() * 30;
    const t = rnd();
    if (t < 0.3) { g.beginPath(); g.arc(x, y, s / 2, 0, Math.PI * 2); g.stroke(); }
    else if (t < 0.55) { g.font = `italic ${s}px serif`; g.fillText(['faith', 'LOVE', 'XIV', 'mamba', '23', 'blessed', 'one'][Math.floor(rnd() * 7)], x, y); }
    else if (t < 0.8) { g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) g.lineTo(x + (rnd() - 0.5) * s * 2, y + (rnd() - 0.5) * s * 2); g.stroke(); }
    else { g.beginPath(); g.moveTo(x, y - s / 2); g.lineTo(x + s / 3, y); g.lineTo(x, y + s / 2); g.lineTo(x - s / 3, y); g.closePath(); g.fill(); }
  }
  return tex(c);
}

function jerseyTexture(o) {
  const W = 512, H = 256, [c, g] = canvas(W, H);
  if (o.kind === 'ref') {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#111'; for (let x = 0; x < W; x += 28) g.fillRect(x, 0, 13, H);
    g.fillStyle = '#111'; g.fillRect(0, 0, W, 14);
    g.fillStyle = '#fff'; g.fillRect(W * 0.5 - 30, 120, 60, 30); g.fillStyle = '#111'; g.font = '900 26px Arial'; g.textAlign = 'center'; g.fillText(o.num, W * 0.5, 145);
    g.fillStyle = '#fff'; g.fillRect(0, 100, 50, 60); g.fillRect(W - 50, 100, 50, 60);
    g.fillStyle = '#111'; g.font = '900 40px Arial'; g.fillText(o.num, 25, 145); g.fillText(o.num, W - 25, 145);
    return tex(c);
  }
  g.fillStyle = o.bg; g.fillRect(0, 0, W, H);
  // side panels + neckline/arm trim
  g.fillStyle = o.fg; g.fillRect(W * 0.25 - 10, 0, 20, H); g.fillRect(W * 0.75 - 10, 0, 20, H);
  g.fillStyle = o.fg2 || o.fg; g.fillRect(0, 0, W, 10);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // front (u = 0.5)
  g.fillStyle = o.fg; g.font = `900 ${o.top.length > 6 ? 30 : 40}px Arial Black, Arial`;
  g.fillText(o.top, W * 0.5, 70);
  g.font = '900 96px Arial Black, Arial'; g.lineWidth = 5; g.strokeStyle = o.stroke; g.strokeText(String(o.num), W * 0.5, 160); g.fillText(String(o.num), W * 0.5, 160);
  // back (u = 0 / 1) split across the seam
  for (const x of [0, W]) {
    g.font = `900 ${o.name.length > 9 ? 20 : 26}px Arial`; g.fillText(o.name, x, 52);
    g.font = '900 104px Arial Black, Arial'; g.strokeText(String(o.num), x, 150); g.fillText(String(o.num), x, 150);
  }
  return tex(c);
}

/**
 * 관절 리그가 있는 사람 모델.
 * o = { h, build, legR, armR, look, outfit:{kind, bg, fg, top, num, name, stroke}, shadow }
 * 캐릭터는 +z 를 바라보며, index 0 = 왼쪽(+x), 1 = 오른쪽(-x)
 */
export function buildPerson(o) {
  const H = o.h, b = o.build || 1, look = o.look, isRef = o.outfit.kind === 'ref';
  const longL = look.x.includes('long') ? 1.04 : 1, longA = look.x.includes('long') ? 1.09 : 1;
  const D = {};
  D.H = H; D.ankleH = 0.045 * H; D.shin = 0.235 * H * longL; D.thigh = 0.235 * H * longL;
  D.hipY = D.ankleH + D.shin + D.thigh;
  const rem = H - D.hipY;
  D.torso = rem * 0.64; D.neck = rem * 0.085; D.headH = rem * 0.275; D.headR = D.headH / 2 / 1.12;
  D.ua = 0.195 * H * longA; D.fore = 0.165 * H * longA; D.hand = 0.085 * H;
  D.shY = D.torso * 0.9; D.shX = 0.113 * H * b;

  const skinHex = SKIN[look.skin];
  const skin = mat(skinHex, { roughness: 0.55 });
  const tat = look.x.includes('tatB') || look.x.includes('tatA') ? new THREE.MeshStandardMaterial({ map: tattooTexture(skinHex, look.num || 7), roughness: 0.55 }) : null;
  const armMats = [look.x.includes('tatB') ? tat : skin, tat || skin];
  const uni = o.outfit;
  const shorts = isRef ? mat('#111111') : mat(uni.bg, { roughness: 0.7 });
  const trim = isRef ? mat('#111111') : mat(uni.fg, { roughness: 0.7 });
  const jersey = new THREE.MeshStandardMaterial({ map: jerseyTexture(uni), roughness: 0.72, side: THREE.DoubleSide });
  const shoe = mat(isRef ? '#0d0d0d' : (o.shoe || '#f1f1f1'), { roughness: 0.45 });
  const sole = mat(isRef ? '#222' : '#fafafa');
  const sock = mat(isRef ? '#111' : (o.sock || '#f4f4f4'));
  const hairM = mat(HAIRC[look.hc] || '#111', { roughness: 0.95 });
  const sleeveM = mat(uni.sleeve || '#111111', { roughness: 0.5 });
  const shadow = o.shadow !== false;
  const meshes = [];
  const add = (parent, geo, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); if (shadow) me.castShadow = true; parent.add(me); meshes.push(me); return me; };
  const cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const sph = (r, w = 12, h = 10) => new THREE.SphereGeometry(r, w, h);

  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = D.hipY; root.add(hips);
  // pelvis / shorts
  const pel = new THREE.LatheGeometry([0.074, 0.088, 0.092, 0.09, 0.083].map((r, i) => new THREE.Vector2(r * H * b, (-0.085 + i * 0.037) * H)), 18);
  add(hips, pel, shorts).scale.z = 0.8;
  if (!isRef) add(hips, cyl(0.0835 * H * b, 0.0835 * H * b, 0.018 * H, 18), trim, 0, 0.062 * H).scale.z = 0.8;

  const spine = new THREE.Group(); hips.add(spine);
  const prof = [[0.08, 0], [0.083, 0.12], [0.09, 0.32], [0.1, 0.56], [0.106, 0.76], [0.1, 0.88], [0.072, 0.965], [0.04, 1.0]];
  const tor = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r * H * b, y * D.torso)), 28, -Math.PI);
  const torsoMesh = add(spine, tor, jersey); torsoMesh.scale.z = 0.62;
  // chest/back volume under jersey edges (traps)
  add(spine, sph(0.05 * H * b, 10, 8), isRef ? jersey : skin, 0, D.torso * 0.93, -0.01 * H).scale.set(1.5, 0.55, 0.9);
  if (isRef) { // short sleeves
    for (const sx of [1, -1]) add(spine, cyl(0.04 * H * b, 0.037 * H * b, 0.08 * H), jersey, sx * D.shX, D.shY - 0.03 * H);
  }
  // neck / head
  const neck = new THREE.Group(); neck.position.y = D.torso * 0.97; spine.add(neck);
  add(neck, cyl(0.03 * H * (0.65 + 0.35 * b), 0.034 * H * (0.65 + 0.35 * b), D.neck * 1.6), skin, 0, D.neck * 0.5);
  const head = new THREE.Group(); head.position.y = D.neck; neck.add(head);
  const hr = D.headR;
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTexture(look, skinHex, isRef), roughness: 0.55 });
  const skull = add(head, new THREE.SphereGeometry(hr, 32, 24, -Math.PI / 2), faceMat, 0, D.headH / 2); skull.scale.set(0.9, 1.12, 1);
  const hc = D.headH / 2;
  add(head, new THREE.SphereGeometry(hr * 0.62, 14, 10), skin, 0, hc - hr * 0.62, hr * 0.22).scale.set(1.25, 0.9, 1.2); // jaw
  const nose = add(head, new THREE.ConeGeometry(hr * 0.15, hr * 0.42, 6), skin, 0, hc - hr * 0.2, hr * 0.92); nose.rotation.x = Math.PI / 2 + 0.35; nose.scale.set(1, 1, 0.75);
  for (const sx of [1, -1]) { const ear = add(head, sph(hr * 0.22, 8, 8), skin, sx * hr * 0.9, hc - hr * 0.05, -hr * 0.05); ear.scale.set(0.45, 1.15, 0.8); }
  // hair styles
  const cap = (scale, thetaLen, rx = -0.2) => { const m = add(head, new THREE.SphereGeometry(hr * scale, 24, 14, 0, Math.PI * 2, 0, thetaLen), hairM, 0, hc, -hr * 0.02); m.rotation.x = rx; m.scale.set(0.92, 1.12, 1.02); return m; };
  if (look.hair === 'short' || look.hair === 'fade') cap(1.035, look.hair === 'fade' ? 0.95 : 1.2);
  else if (look.hair === 'flow') { cap(1.07, 1.45, -0.35); const back = add(head, sph(hr * 0.75, 12, 10), hairM, 0, hc + hr * 0.1, -hr * 0.45); back.scale.set(1.15, 1.05, 0.8); }
  else if (look.hair === 'curly' || look.hair === 'twists') {
    cap(1.05, 1.15);
    const n = look.hair === 'twists' ? 30 : 22;
    for (let i = 0; i < n; i++) {
      const th = Math.random() * 0.95, ph = Math.random() * Math.PI * 2;
      const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph) * 0.92, Math.cos(th) * 1.12, Math.sin(th) * Math.sin(ph));
      const bump = add(head, look.hair === 'twists' ? cyl(hr * 0.09, hr * 0.12, hr * 0.42, 5) : sph(hr * 0.2, 6, 5), hairM, dir.x * hr * 1.02, hc + dir.y * hr * 1.0, dir.z * hr * 1.02 - hr * 0.04);
      bump.lookAt(head.localToWorld(new THREE.Vector3(dir.x * 10, hc + dir.y * 10, dir.z * 10)));
      bump.rotateX(Math.PI / 2);
    }
  } else if (look.hair === 'locs') {
    cap(1.06, 1.3);
    for (let i = 0; i < 20; i++) {
      const a = Math.PI * 0.32 + (i / 19) * Math.PI * 1.36; // skip the face
      const x = Math.sin(a) * hr * 0.95, z = Math.cos(a) * hr * 0.98;
      const len = hr * (1.3 + Math.random() * 0.5);
      const loc = add(head, cyl(hr * 0.085, hr * 0.07, len, 5), hairM, x, hc - len * 0.35, z);
      loc.rotation.set(-z / hr * 0.25, 0, x / hr * 0.25);
    }
  } else if (look.hair === 'afro') { const a = add(head, sph(hr * 1.3, 16, 12), hairM, 0, hc + hr * 0.3, -hr * 0.1); a.scale.set(1, 0.9, 1); }
  if (look.x.includes('band')) { const bd = add(head, new THREE.TorusGeometry(hr * 0.96, hr * 0.09, 6, 24), mat(uni.fg || '#fff'), 0, hc + hr * 0.42, 0); bd.rotation.x = Math.PI / 2 + 0.12; bd.scale.set(0.95, 1.04, 1); }

  // arms
  const sh = [], el = [], wr = [], palm = [];
  for (let i = 0; i < 2; i++) {
    const sx = i === 0 ? 1 : -1;
    add(spine, sph(0.031 * H * b, 12, 10), isRef ? jersey : skin, sx * (D.shX - 0.002 * H), D.shY - 0.004 * H).scale.set(0.95, 1.05, 0.9); // deltoid
    const s = new THREE.Group(); s.position.set(sx * D.shX, D.shY, 0); spine.add(s); sh.push(s);
    const am = armMats[i];
    add(s, cyl(0.03 * H * b, 0.023 * H * b, D.ua), am, 0, -D.ua / 2);
    add(s, sph(0.025 * H * b, 10, 8), am, 0, -D.ua * 0.45, 0.009 * H).scale.set(0.95, 2.0, 0.85); // biceps
    const e = new THREE.Group(); e.position.y = -D.ua; s.add(e); el.push(e);
    add(e, sph(0.022 * H * b, 10, 8), am);
    add(e, cyl(0.022 * H * b, 0.016 * H * b, D.fore), am, 0, -D.fore / 2);
    add(e, sph(0.02 * H * b, 8, 8), am, 0, -D.fore * 0.28, 0).scale.set(1.1, 2.0, 1);
    const sleeve = (i === 0 && look.x.includes('sleeveL')) || (i === 1 && look.x.includes('sleeveR'));
    if (sleeve) { add(s, cyl(0.032 * H * b, 0.025 * H * b, D.ua * 0.95), sleeveM, 0, -D.ua / 2); add(e, cyl(0.024 * H * b, 0.018 * H * b, D.fore * 0.85), sleeveM, 0, -D.fore * 0.45); }
    const w = new THREE.Group(); w.position.y = -D.fore; e.add(w); wr.push(w);
    const hand = add(w, sph(0.026 * H, 10, 8), skin, 0, -D.hand * 0.4, 0.003 * H); hand.scale.set(0.75, 1.5, 0.45);
    const th = add(w, cyl(0.007 * H, 0.006 * H, 0.04 * H, 5), skin, -sx * 0.014 * H, -D.hand * 0.25, 0.012 * H); th.rotation.z = -sx * 0.5;
    const pm = new THREE.Object3D(); pm.position.set(0, -D.hand * 0.55, 0.02 * H); w.add(pm); palm.push(pm);
  }
  // legs
  const th = [], kn = [], an = [];
  for (let i = 0; i < 2; i++) {
    const sx = i === 0 ? 1 : -1;
    const t = new THREE.Group(); t.position.set(sx * 0.056 * H * b, 0, 0); hips.add(t); th.push(t);
    add(t, cyl(0.052 * H * b, 0.036 * H * b, D.thigh), isRef ? shorts : skin, 0, -D.thigh / 2);
    if (!isRef) {
      add(t, cyl(0.064 * H * b, 0.059 * H * b, D.thigh * 0.74, 14), shorts, 0, -D.thigh * 0.33);
      add(t, cyl(0.06 * H * b, 0.06 * H * b, 0.012 * H, 14), trim, 0, -D.thigh * 0.7);
    } else add(t, cyl(0.058 * H * b, 0.045 * H * b, D.thigh, 12), shorts, 0, -D.thigh / 2);
    const k = new THREE.Group(); k.position.y = -D.thigh; t.add(k); kn.push(k);
    add(k, sph(0.035 * H * b, 10, 8), isRef ? shorts : (look.x.includes('knee') ? mat('#111') : skin)).scale.set(1, 1, 1.1);
    add(k, cyl(0.034 * H * b, 0.022 * H * b, D.shin), isRef ? shorts : skin, 0, -D.shin / 2);
    add(k, sph(0.03 * H * b, 10, 8), isRef ? shorts : skin, 0, -D.shin * 0.3, -0.01 * H).scale.set(1, 2.1, 1); // calf
    if (!isRef && look.x.includes('legS')) add(k, cyl(0.037 * H * b, 0.025 * H * b, D.shin * 0.9), sleeveM, 0, -D.shin * 0.48);
    if (look.x.includes('knee')) add(k, cyl(0.04 * H * b, 0.036 * H * b, 0.08 * H, 12), mat('#111'), 0, -0.01 * H);
    add(k, cyl(0.025 * H, 0.024 * H, 0.06 * H), sock, 0, -D.shin + 0.02 * H);
    const a = new THREE.Group(); a.position.y = -D.shin; k.add(a); an.push(a);
    const sm = add(a, sph(0.045 * H, 14, 10), shoe, 0, -D.ankleH * 0.35, 0.03 * H); sm.scale.set(0.62, 0.62, 1.55);
    const so = add(a, new THREE.BoxGeometry(0.058 * H, 0.012 * H, 0.15 * H), sole, 0, -D.ankleH + 0.006 * H, 0.03 * H);
  }
  // floor ring + user marker
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; root.add(ring);
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 4), new THREE.MeshBasicMaterial({ color: 0xffe600 }));
  marker.rotation.x = Math.PI; marker.visible = false; root.add(marker);
  return { root, hips, spine, neck, head, sh, el, wr, palm, th, kn, an, ring, marker, D, torsoMesh };
}

export function makeBall() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#d4651e'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`; g.fillRect(Math.random() * 512, Math.random() * 256, 2, 2); }
  g.strokeStyle = '#1a0d05'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, 128); g.lineTo(512, 128); g.stroke();
  for (const x of [128, 384]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  for (const x of [0, 256]) { g.beginPath(); g.ellipse(x + 128, 128, 80, 128, 0, 0, Math.PI * 2); g.stroke(); }
  return new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 32, 20), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.7 }));
}
