import { Template } from '../types';

export const aquariumTemplate: Template = {
  id: 'aquarium',
  name: 'Virtual Aquarium',
  description: 'Mic-reactive migration sim — small fish flee sound, big fish hunt toward it.',
  category: 'audio',
  supportsLiveParams: true,
  params: [
    {
      id: 'temperature',
      name: 'Water Temperature',
      type: 'enum',
      default: 'moderate',
      options: ['freezing', 'cold', 'moderate', 'warm', 'hot'],
      category: 'simulation',
      description: 'Controls swim speed and vertical drift — hot rises fast, freezing sinks slowly.',
    },
    {
      id: 'currentStrength',
      name: 'Current Strength',
      type: 'number',
      default: 0.35,
      min: 0,
      max: 1,
      step: 0.05,
      category: 'simulation',
      description: 'Strength of the Perlin-noise water current displacing all fish.',
    },
    {
      id: 'smallFishCount',
      name: 'Small Fish',
      type: 'number',
      default: 45,
      min: 5,
      max: 120,
      step: 5,
      category: 'simulation',
      description: 'Number of small schooling fish that flee from sound.',
    },
    {
      id: 'bigFishCount',
      name: 'Big Fish',
      type: 'number',
      default: 5,
      min: 1,
      max: 12,
      step: 1,
      category: 'simulation',
      description: 'Number of large fish that hunt toward sound.',
    },
    {
      id: 'micSensitivity',
      name: 'Mic Sensitivity',
      type: 'number',
      default: 1.5,
      min: 0.5,
      max: 4,
      step: 0.1,
      category: 'audio',
      description: 'How strongly microphone input drives fish behavior.',
    },
  ],
  presets: [
    {
      name: 'Tropical Reef',
      params: { temperature: 'warm', currentStrength: 0.25, smallFishCount: 60, bigFishCount: 4, micSensitivity: 1.5 },
    },
    {
      name: 'Arctic Deep',
      params: { temperature: 'freezing', currentStrength: 0.6, smallFishCount: 25, bigFishCount: 3, micSensitivity: 2 },
    },
    {
      name: 'Storm Surge',
      params: { temperature: 'cold', currentStrength: 0.9, smallFishCount: 80, bigFishCount: 8, micSensitivity: 2.5 },
    },
  ],
  generateCode: (params, seed) => {
    const initTemp = params.temperature || 'moderate';
    const initCurrent = params.currentStrength ?? 0.35;
    const initSmall = Math.floor(params.smallFishCount || 45);
    const initBig = Math.floor(params.bigFishCount || 5);
    const initMicSens = params.micSensitivity ?? 1.5;

    return `
// ── Virtual Aquarium ──────────────────────────────────────────────
let smallFish = [], bigFish = [], bubbles = [], ripples = [];
let analyser = null, micData = null;
let soundLevel = 0;
let temperature = '${initTemp}';
let currentStrength = ${initCurrent};
let micSensitivity = ${initMicSens};
let tick = 0;

const TEMP = {
  freezing: { speed: 0.28, yBias: 0.9,  h: 210 },
  cold:     { speed: 0.55, yBias: 0.35, h: 205 },
  moderate: { speed: 1.0,  yBias: 0.0,  h: 200 },
  warm:     { speed: 1.4,  yBias: -0.4, h: 195 },
  hot:      { speed: 2.0,  yBias: -0.9, h: 185 },
};

function cfg() { return TEMP[temperature] || TEMP.moderate; }

// ── setup ─────────────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noiseSeed(${seed});
  randomSeed(${seed});
  spawnSmall(${initSmall});
  spawnBig(${initBig});
  for (let i = 0; i < 28; i++) {
    bubbles.push({ x: random(width), y: random(height), r: random(2, 5), spd: random(0.4, 1.1) });
  }
  startMic();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// ── mic ───────────────────────────────────────────────────────────
function startMic() {
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      micData = new Uint8Array(analyser.frequencyBinCount);
    })
    .catch(() => {});
}

function readMic() {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(micData);
  let rms = 0;
  for (let i = 0; i < micData.length; i++) {
    const v = (micData[i] - 128) / 128;
    rms += v * v;
  }
  return Math.min(1, Math.sqrt(rms / micData.length) * micSensitivity * 9);
}

// ── fish factories ────────────────────────────────────────────────
function makeSmall() {
  return { x: random(width), y: random(height * 0.1, height * 0.9),
    vx: random(-1, 1), vy: random(-0.4, 0.4),
    sz: random(7, 13), hue: random(175, 225), ph: random(TWO_PI), flee: 0 };
}
function makeBig() {
  return { x: random(width), y: random(height * 0.15, height * 0.85),
    vx: random(-0.7, 0.7), vy: random(-0.3, 0.3),
    sz: random(38, 68), hue: random(135, 175), ph: random(TWO_PI), hunt: 0 };
}
function spawnSmall(n) { for (let i = 0; i < n; i++) smallFish.push(makeSmall()); }
function spawnBig(n)   { for (let i = 0; i < n; i++) bigFish.push(makeBig()); }

// ── current field ─────────────────────────────────────────────────
function current(x, y) {
  const t = tick * 0.0007;
  const nx = (noise(x * 0.003, y * 0.003, t)       - 0.5) * currentStrength * 2.2;
  const ny = (noise(x * 0.003 + 99, y * 0.003 + 99, t) - 0.5) * currentStrength * 2.2;
  return { nx, ny };
}

// ── background ────────────────────────────────────────────────────
function drawBg() {
  const h = cfg().h;
  for (let y = 0; y <= height; y += 4) {
    const p = y / height;
    stroke(h + p * 15, lerp(70, 95, p), lerp(22, 4, p), 100);
    line(0, y, width, y);
  }
  // caustic shimmer near surface
  noStroke();
  for (let i = 0; i < 6; i++) {
    const cx = (noise(i * 13.7, tick * 0.0008) * 1.3 - 0.15) * width;
    const cy = noise(i * 13.7 + 50, tick * 0.0008) * height * 0.22;
    const r  = noise(i * 13.7 + 99, tick * 0.0008) * 100 + 40;
    fill(h - 10, 45, 55, 7);
    ellipse(cx, cy, r * 2.2, r * 0.45);
  }
}

function drawSurface() {
  noFill();
  for (let i = 0; i < 3; i++) {
    stroke(cfg().h - 5, 35, 75, 22 - i * 5);
    strokeWeight(1);
    beginShape();
    for (let x = 0; x <= width; x += 18) {
      const y = noise(x * 0.009, tick * 0.0018 + i * 8) * 14 - 4 + i * 7;
      curveVertex(x, y);
    }
    endShape();
  }
}

// ── ripples from sound ────────────────────────────────────────────
function tickRipples() {
  if (soundLevel > 0.07) {
    ripples.push({ x: width / 2, y: 20, r: 10, max: 60 + soundLevel * 220, a: soundLevel * 55 });
  }
  noFill();
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += 5; rp.a -= 1.8;
    if (rp.a <= 0 || rp.r > rp.max) { ripples.splice(i, 1); continue; }
    stroke(185, 55, 90, rp.a);
    strokeWeight(1.5);
    ellipse(rp.x, rp.y, rp.r * 2, rp.r * 0.55);
  }
}

// ── bubbles ───────────────────────────────────────────────────────
function tickBubbles() {
  const spd = cfg().speed;
  noFill();
  strokeWeight(1);
  for (const b of bubbles) {
    b.y -= b.spd * spd * 0.55;
    b.x += sin(b.y * 0.04) * 0.35;
    if (b.y < -8) { b.y = height + 6; b.x = random(width); }
    stroke(195, 28, 78, 22);
    ellipse(b.x, b.y, b.r * 2, b.r * 2);
  }
}

// ── small fish ────────────────────────────────────────────────────
function tickSmall() {
  const { speed, yBias } = cfg();
  const SX = width / 2, SY = 0;

  for (const f of smallFish) {
    const cur = current(f.x, f.y);
    f.vx += cur.nx * 0.14;
    f.vy += cur.ny * 0.14 + yBias * 0.018;

    // Flocking
    let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
    for (const o of smallFish) {
      if (o === f) continue;
      const dx = o.x - f.x, dy = o.y - f.y;
      const d = Math.hypot(dx, dy);
      if (d < 85) {
        ax += o.vx; ay += o.vy;
        cx += o.x;  cy += o.y;
        n++;
        if (d < 28 && d > 0) { sx -= dx / d; sy -= dy / d; }
      }
    }
    if (n > 0) {
      f.vx += (ax / n - f.vx) * 0.03 + (cx / n - f.x) * 0.002 + sx * 0.09;
      f.vy += (ay / n - f.vy) * 0.03 + (cy / n - f.y) * 0.002 + sy * 0.09;
    }

    // Flee sound
    if (soundLevel > 0.05) {
      const dx = f.x - SX, dy = f.y - SY;
      const d = Math.max(1, Math.hypot(dx, dy));
      const force = soundLevel * 3.8 * speed;
      f.vx += (dx / d) * force;
      f.vy += (dy / d) * force;
      f.flee = 45;
    } else if (f.flee > 0) f.flee--;

    const vmax = (f.flee > 0 ? 5.2 : 2.6) * speed;
    const spd2 = Math.hypot(f.vx, f.vy);
    if (spd2 > vmax)   { f.vx = f.vx / spd2 * vmax; f.vy = f.vy / spd2 * vmax; }
    if (spd2 < 0.25)   { f.vx += random(-0.2, 0.2);  f.vy += random(-0.1, 0.1); }

    f.x = ((f.x + f.vx) % width + width) % width;
    f.y = constrain(f.y + f.vy, 8, height - 8);
    f.ph += 0.16;

    drawFish(f.x, f.y, f.vx, f.vy, f.sz, f.hue, f.ph, f.flee > 0 ? 88 : 68, false);
  }
}

// ── big fish ──────────────────────────────────────────────────────
function tickBig() {
  const { speed, yBias } = cfg();
  const SX = width / 2, SY = 0;

  for (const f of bigFish) {
    const cur = current(f.x, f.y);
    f.vx += cur.nx * 0.05;
    f.vy += cur.ny * 0.05 + yBias * 0.013;

    // Hunt toward sound
    if (soundLevel > 0.05) {
      const dx = SX - f.x, dy = SY - f.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const force = soundLevel * 2.2 * speed;
      f.vx += (dx / d) * force;
      f.vy += (dy / d) * force;
      f.hunt = 65;
    } else if (f.hunt > 0) f.hunt--;

    // Repel other big fish
    for (const o of bigFish) {
      if (o === f) continue;
      const dx = f.x - o.x, dy = f.y - o.y;
      const d = Math.hypot(dx, dy);
      if (d < 110 && d > 0) { f.vx += (dx / d) * 0.35; f.vy += (dy / d) * 0.35; }
    }

    // Wander when idle
    if (f.hunt === 0) {
      f.vx += (noise(f.x * 0.004, f.y * 0.004, tick * 0.001 + f.ph) - 0.5) * 0.22;
      f.vy += (noise(f.x * 0.004 + 200, f.y * 0.004 + 200, tick * 0.001 + f.ph) - 0.5) * 0.22;
    }

    const vmax = (f.hunt > 0 ? 3.6 : 1.6) * speed;
    const spd2 = Math.hypot(f.vx, f.vy);
    if (spd2 > vmax)  { f.vx = f.vx / spd2 * vmax; f.vy = f.vy / spd2 * vmax; }
    if (spd2 < 0.18)  { f.vx += random(-0.15, 0.15); f.vy += random(-0.1, 0.1); }

    f.x = ((f.x + f.vx) % width + width) % width;
    f.y = constrain(f.y + f.vy, 28, height - 28);
    f.ph += 0.08;

    drawFish(f.x, f.y, f.vx, f.vy, f.sz, f.hue, f.ph, f.hunt > 0 ? 82 : 60, true);
  }
}

// ── fish renderer ─────────────────────────────────────────────────
function drawFish(x, y, vx, vy, sz, hue, ph, bright, big) {
  const angle = Math.atan2(vy, vx);
  push();
  translate(x, y);
  rotate(angle + sin(ph) * (big ? 0.08 : 0.14));
  noStroke();

  // Glow for big fish
  if (big) {
    fill(hue, 60, bright, 18);
    ellipse(0, 0, sz * 1.8, sz * 1.1);
  }

  // Tail
  fill(hue, 68, bright - 12, 78);
  triangle(
    -sz * 0.42, 0,
    -sz * 0.88, -sz * 0.28 + sin(ph) * sz * (big ? 0.13 : 0.17),
     -sz * 0.88,  sz * 0.28 + sin(ph) * sz * (big ? 0.13 : 0.17)
  );

  // Body
  fill(hue, 62, bright, 88);
  ellipse(0, 0, sz, sz * (big ? 0.44 : 0.48));

  // Dorsal fin
  fill(hue, 55, bright - 8, 65);
  triangle(sz * 0.05, -sz * 0.22, -sz * 0.1, -sz * 0.38, -sz * 0.28, -sz * 0.22);

  // Eye
  fill(0, 0, 92, 90);
  ellipse(sz * 0.26, -sz * 0.04, sz * 0.14, sz * 0.14);
  fill(0, 0, 8, 95);
  ellipse(sz * 0.28, -sz * 0.04, sz * 0.07, sz * 0.07);

  pop();
}

// ── HUD ───────────────────────────────────────────────────────────
function drawHUD() {
  noStroke();
  // Mic bar background
  fill(0, 0, 8, 55);
  rect(18, height - 56, 130, 18, 9);
  // Mic bar fill
  if (soundLevel > 0.005) {
    const barH = analyser ? hue(150) : hue(0);
    fill(analyser ? 130 : 0, 65, 85, 75);
    rect(20, height - 54, soundLevel * 126, 14, 7);
  }
  fill(0, 0, 75, 65);
  noStroke();
  textSize(9);
  textAlign(LEFT, CENTER);
  text(analyser ? '🎙 MIC' : '🚫 MIC', 24, height - 47);

  // Temp badge
  const tc = { freezing:[210,75,80], cold:[205,60,72], moderate:[180,45,65], warm:[25,65,75], hot:[5,78,85] };
  const [th, ts, tb] = tc[temperature] || tc.moderate;
  fill(th, ts, tb, 78);
  rect(18, height - 82, 90, 18, 9);
  fill(0, 0, 92, 85);
  textSize(9);
  text(temperature.toUpperCase(), 24, height - 73);
}

// ── main draw loop ────────────────────────────────────────────────
function draw() {
  tick++;
  soundLevel = lerp(soundLevel, readMic(), 0.28);
  drawBg();
  drawSurface();
  tickRipples();
  tickBubbles();
  tickSmall();
  tickBig();
  drawHUD();
  noStroke();
}

// ── live param updates from control panel ─────────────────────────
window.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'params-update') {
    const p = event.data.params;
    if (p.temperature     !== undefined) temperature     = p.temperature;
    if (p.currentStrength !== undefined) currentStrength = p.currentStrength;
    if (p.micSensitivity  !== undefined) micSensitivity  = p.micSensitivity;

    // Dynamically resize fish schools
    if (p.smallFishCount !== undefined) {
      const target = Math.floor(p.smallFishCount);
      while (smallFish.length < target) smallFish.push(makeSmall());
      if (smallFish.length > target) smallFish.splice(target);
    }
    if (p.bigFishCount !== undefined) {
      const target = Math.floor(p.bigFishCount);
      while (bigFish.length < target) bigFish.push(makeBig());
      if (bigFish.length > target) bigFish.splice(target);
    }
  }

  if (event.data.type === 'export') {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const a = document.createElement('a');
      a.download = 'aquarium.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    }
  }
});
`;
  },
};
