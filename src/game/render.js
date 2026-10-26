import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './constants';

// Générateur pseudo-aléatoire déterministe : le décor reste stable d'une frame à l'autre.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function createBackground(palette, seed = 7) {
  const rand = seeded(seed);
  const layers = [0.15, 0.35, 0.6].map((depth, li) => {
    const buildings = [];
    let x = -50;
    while (x < CANVAS_WIDTH + 200) {
      const w = 50 + rand() * 90;
      const h = 120 + rand() * (220 + li * 80);
      const windows = [];
      for (let wy = 14; wy < h - 10; wy += 18) {
        for (let wx = 8; wx < w - 8; wx += 14) {
          if (rand() < 0.28) windows.push([wx, wy]);
        }
      }
      buildings.push({ x, w, h, windows, antenna: rand() < 0.3 });
      x += w + 6 + rand() * 18;
    }
    return { depth, buildings, shade: 0.35 + li * 0.25 };
  });

  // Pré-rendu des immeubles dans des canvas hors-écran (gros gain de performance).
  const rendered = layers.map((layer) => {
    const c = document.createElement('canvas');
    c.width = CANVAS_WIDTH + 260;
    c.height = GROUND_Y;
    const g = c.getContext('2d');
    layer.buildings.forEach((b) => {
      const top = GROUND_Y - b.h;
      g.globalAlpha = layer.shade;
      g.fillStyle = palette.city;
      g.fillRect(b.x, top, b.w, b.h);
      g.globalAlpha = 1;
      g.fillStyle = `rgba(0,0,0,${0.6 - layer.shade * 0.5})`;
      g.fillRect(b.x, top, b.w, b.h);
      g.fillStyle = palette.window;
      g.globalAlpha = 0.25 + layer.shade * 0.5;
      b.windows.forEach(([wx, wy]) => g.fillRect(b.x + wx, top + wy, 6, 8));
      g.globalAlpha = 1;
      if (b.antenna) {
        g.strokeStyle = palette.window;
        g.globalAlpha = layer.shade;
        g.beginPath();
        g.moveTo(b.x + b.w / 2, top);
        g.lineTo(b.x + b.w / 2, top - 30);
        g.stroke();
        g.globalAlpha = 1;
      }
    });
    return { canvas: c, depth: layer.depth };
  });

  const rain = Array.from({ length: 90 }, () => ({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_HEIGHT,
    s: 8 + Math.random() * 8,
  }));

  return { palette, rendered, rain };
}

// parallax : valeur entre 0 et 1 (position horizontale relative du joueur).
export function drawBackground(ctx, bg, parallax, time) {
  const { palette } = bg;
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(1, palette.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Soleil synthwave
  ctx.save();
  ctx.globalAlpha = 0.5;
  const sun = ctx.createRadialGradient(CANVAS_WIDTH * 0.7, 260, 10, CANVAS_WIDTH * 0.7, 260, 180);
  sun.addColorStop(0, palette.window);
  sun.addColorStop(1, 'transparent');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
  ctx.restore();

  bg.rendered.forEach((layer) => {
    ctx.drawImage(layer.canvas, -parallax * layer.depth * 260, 0);
  });

  // Sol néon en perspective
  ctx.fillStyle = palette.floor;
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  ctx.save();
  ctx.strokeStyle = palette.line;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 + i * 40, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH / 2 + i * 180, CANVAS_HEIGHT);
    ctx.stroke();
  }
  const scroll = (time * 0.04) % 1;
  for (let i = 0; i < 6; i++) {
    const p = (i + scroll) / 6;
    const y = GROUND_Y + p * p * (CANVAS_HEIGHT - GROUND_Y);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.shadowColor = palette.line;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
  ctx.stroke();
  ctx.restore();

  // Pluie (n'avance que lorsqu'une nouvelle frame de simulation a eu lieu)
  const advance = bg.lastTime !== time;
  bg.lastTime = time;
  ctx.save();
  ctx.strokeStyle = 'rgba(180,220,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  bg.rain.forEach((r) => {
    if (advance) {
      r.y += r.s;
      r.x -= 1.5;
    }
    if (r.y > GROUND_Y) {
      r.y = -20;
      r.x = Math.random() * (CANVAS_WIDTH + 100);
    }
    ctx.moveTo(r.x, r.y);
    ctx.lineTo(r.x + 2, r.y + 12);
  });
  ctx.stroke();
  ctx.restore();
}

function limb(ctx, x1, y1, x2, y2, width) {
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * Dessine un combattant humanoïde stylisé.
 * f : { x, y (haut), width, height, facing (1|-1), pose, animTime, attackProgress, flash, alpha }
 */
export function drawFighter(ctx, f, colors, opts = {}) {
  const { x, y, width: w, height: h, facing, pose, animTime = 0 } = f;
  const cx = x + w / 2;
  const feet = y + h;
  const headH = h * 0.2;
  const torsoTop = y + headH + 2;
  const hip = y + h * 0.58;
  const shoulder = torsoTop + h * 0.06;
  const legW = Math.max(6, w * 0.18);
  const armW = Math.max(5, w * 0.14);

  ctx.save();
  if (f.alpha !== undefined) ctx.globalAlpha = f.alpha;

  // Ombre au sol
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y + 4, w * 0.6, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, 0);
  ctx.scale(facing, 1);
  ctx.lineCap = 'round';

  const body = f.flash ? '#ffffff' : colors.body;
  const accent = f.flash ? '#ffffff' : colors.accent;

  // Jambes
  let swing = 0;
  if (pose === 'walk') swing = Math.sin(animTime * 0.3) * 0.5;
  let backFoot = [-w * 0.18 - Math.sin(swing) * h * 0.25, feet];
  let frontFoot = [w * 0.18 + Math.sin(swing) * h * 0.25, feet];
  if (pose === 'jump') {
    backFoot = [-w * 0.25, feet - h * 0.12];
    frontFoot = [w * 0.2, feet - h * 0.18];
  } else if (pose === 'heavy') {
    const p = Math.sin(Math.min(1, f.attackProgress || 0) * Math.PI);
    frontFoot = [w * 0.2 + p * h * 0.42, hip + (feet - hip) * (1 - p * 0.8)];
  } else if (pose === 'dead') {
    backFoot = [-w * 0.4, feet];
    frontFoot = [w * 0.4, feet];
  } else if (pose === 'block') {
    backFoot = [-w * 0.3, feet];
    frontFoot = [w * 0.3, feet];
  }

  ctx.strokeStyle = body;
  ctx.shadowColor = colors.body;
  ctx.shadowBlur = opts.glow === false ? 0 : 10;
  limb(ctx, -w * 0.1, hip, backFoot[0], backFoot[1], legW);
  limb(ctx, w * 0.1, hip, frontFoot[0], frontFoot[1], legW);

  // Torse
  ctx.fillStyle = body;
  const torsoW = w * (opts.bulky ? 0.85 : 0.62);
  ctx.beginPath();
  ctx.moveTo(-torsoW / 2, torsoTop);
  ctx.lineTo(torsoW / 2, torsoTop);
  ctx.lineTo(torsoW * 0.35, hip);
  ctx.lineTo(-torsoW * 0.35, hip);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = accent;
  ctx.fillRect(-torsoW * 0.3, torsoTop + h * 0.08, torsoW * 0.6, 4);
  ctx.fillRect(-2, torsoTop + h * 0.12, 4, h * 0.18);

  // Bras
  const p = Math.sin(Math.min(1, f.attackProgress || 0) * Math.PI);
  let frontHand = [w * 0.35, hip - h * 0.02];
  let backHand = [-w * 0.3, hip - h * 0.02];
  if (pose === 'walk') {
    frontHand = [w * 0.3 - Math.sin(swing) * w * 0.4, hip];
    backHand = [-w * 0.3 + Math.sin(swing) * w * 0.4, hip];
  }
  if (pose === 'light') frontHand = [w * 0.3 + p * h * 0.42, shoulder + h * 0.05];
  if (pose === 'special') {
    frontHand = [w * 0.3 + p * h * 0.4, shoulder + h * 0.02];
    backHand = [w * 0.2 + p * h * 0.3, shoulder + h * 0.08];
  }
  if (pose === 'windup') frontHand = [-w * 0.45, shoulder - h * 0.05];
  if (pose === 'block') {
    frontHand = [w * 0.45, shoulder - h * 0.02];
    backHand = [w * 0.38, shoulder + h * 0.1];
  }
  if (pose === 'hurt') {
    frontHand = [-w * 0.1, shoulder - h * 0.15];
    backHand = [-w * 0.45, shoulder - h * 0.1];
  }
  if (pose === 'jump') {
    frontHand = [w * 0.4, shoulder - h * 0.12];
    backHand = [-w * 0.4, shoulder - h * 0.08];
  }

  ctx.strokeStyle = body;
  limb(ctx, -torsoW * 0.35, shoulder, backHand[0], backHand[1], armW);
  limb(ctx, torsoW * 0.35, shoulder, frontHand[0], frontHand[1], armW);

  // Poing lumineux
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(frontHand[0], frontHand[1], armW * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Arme (archer/mage)
  if (opts.weapon === 'bow') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(frontHand[0], frontHand[1], h * 0.22, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.stroke();
  } else if (opts.weapon === 'staff') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    limb(ctx, frontHand[0], frontHand[1] + h * 0.25, frontHand[0], frontHand[1] - h * 0.35, 4);
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(frontHand[0], frontHand[1] - h * 0.38, 7 + Math.sin(animTime * 0.15) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Tête + visière
  const headW = w * 0.48;
  ctx.fillStyle = body;
  ctx.fillRect(-headW / 2, y, headW, headH);
  ctx.fillStyle = f.flash ? '#fff' : colors.visor || '#fff';
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 12;
  ctx.fillRect(-headW * 0.1, y + headH * 0.3, headW * 0.6, headH * 0.28);
  ctx.shadowBlur = 0;

  // Aura de garde
  if (pose === 'block') {
    ctx.strokeStyle = 'rgba(120,200,255,0.85)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#4fc3ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(w * 0.2, y + h * 0.45, h * 0.55, -Math.PI / 2.5, Math.PI / 2.5);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBoss(ctx, boss, time) {
  const { x, y, width: w, height: h, facing } = boss;
  const cx = x + w / 2;
  const phaseColors = ['#ff9100', '#ff3d00', '#ff1744'];
  const glow = phaseColors[boss.phase - 1];

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, GROUND_Y + 6, w * 0.6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, 0);
  ctx.scale(facing, 1);

  const flash = boss.flash > 0;
  const metal = flash ? '#ffffff' : '#2b2f3a';
  const plate = flash ? '#ffffff' : '#454b5c';
  const telegraph = boss.state === 'windup' && Math.floor(time / 4) % 2 === 0;

  ctx.shadowColor = glow;
  ctx.shadowBlur = telegraph ? 40 : 20;

  // Jambes
  ctx.fillStyle = metal;
  ctx.fillRect(-w * 0.35, y + h * 0.65, w * 0.22, h * 0.35);
  ctx.fillRect(w * 0.13, y + h * 0.65, w * 0.22, h * 0.35);
  // Torse
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, y + h * 0.2);
  ctx.lineTo(w * 0.5, y + h * 0.2);
  ctx.lineTo(w * 0.38, y + h * 0.7);
  ctx.lineTo(-w * 0.38, y + h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // Réacteur
  const pulse = 10 + Math.sin(time * 0.12) * 4;
  ctx.fillStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(0, y + h * 0.42, pulse, 0, Math.PI * 2);
  ctx.fill();
  // Bras canon
  ctx.shadowBlur = 0;
  ctx.fillStyle = metal;
  const armLift = boss.state === 'barrage' ? -h * 0.12 : 0;
  ctx.fillRect(w * 0.42, y + h * 0.25 + armLift, w * 0.45, h * 0.13);
  ctx.fillRect(-w * 0.62, y + h * 0.25, w * 0.18, h * 0.38);
  ctx.fillStyle = glow;
  ctx.fillRect(w * 0.84, y + h * 0.27 + armLift, 8, h * 0.09);
  // Tête
  ctx.fillStyle = plate;
  ctx.fillRect(-w * 0.2, y, w * 0.4, h * 0.2);
  ctx.fillStyle = telegraph ? '#ffffff' : glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 20;
  ctx.fillRect(-w * 0.05, y + h * 0.07, w * 0.22, h * 0.05);
  ctx.restore();
}
