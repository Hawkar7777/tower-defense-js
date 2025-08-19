import { particles, beams, circles, pulses } from "./state.js";
import { rand, TAU, clamp } from "./utils.js";
import { ctx } from "./core.js";

export function spawnMuzzle(x, y, rot, color) {
  for (let i = 0; i < 6; i++)
    particles.push({
      x,
      y,
      vx: Math.cos(rot + rand(0.5, -0.25)) * rand(220, 60),
      vy: Math.sin(rot + rand(0.5, -0.25)) * rand(220, 60),
      life: rand(0.15, 0.06),
      r: rand(2.5, 1),
      c: color,
    });
}
export function spawnHit(x, y, color) {
  for (let i = 0; i < 8; i++)
    particles.push({
      x,
      y,
      vx: rand(180, -180),
      vy: rand(180, -180),
      life: rand(0.25, 0.12),
      r: rand(2.5, 1),
      c: color,
    });
}
export function spawnExplosion(x, y, R, color) {
  for (let i = 0; i < 18; i++) {
    const a = rand(TAU);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * rand(220, 60),
      vy: Math.sin(a) * rand(220, 60),
      life: rand(0.45, 0.25),
      r: rand(4, 2),
      c: color,
    });
  }
  circles.push({ x, y, R, life: 0.3, c: color });
}
export function spawnDeath(p) {
  for (let i = 0; i < 16; i++) {
    const a = rand(TAU);
    particles.push({
      x: p.x,
      y: p.y,
      vx: Math.cos(a) * rand(240, 80),
      vy: Math.sin(a) * rand(240, 80),
      life: rand(0.55, 0.25),
      r: rand(4, 2),
      c: "#9ff",
    });
  }
  pulses.push({ text: "+$", x: 0, y: 0, life: 1.2, c: "#9f9" });
}
export function spawnBeam(a, b, color) {
  beams.push({ a: { ...a }, b: { ...b }, life: 0.06, c: color });
}

export function updateEffects(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
  }
  for (let i = particles.length - 1; i >= 0; i--)
    if (particles[i].life <= 0) particles.splice(i, 1);
  for (const b of beams) {
    b.life -= dt;
  }
  for (let i = beams.length - 1; i >= 0; i--) if (beams[i].life <= 0) beams.splice(i, 1);
  for (const c of circles) {
    c.life -= dt;
  }
  for (let i = circles.length - 1; i >= 0; i--) if (circles[i].life <= 0) circles.splice(i, 1);
}

export function drawEffects() {
  // Beams
  for (const b of beams) {
    ctx.strokeStyle = b.c;
    ctx.globalAlpha = clamp(b.life / 0.06, 0, 1);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.a.x, b.a.y);
    ctx.lineTo(b.b.x, b.b.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Expanding shock circles
  for (const c of circles) {
    const a = clamp(c.life / 0.3, 0, 1);
    ctx.strokeStyle = c.c;
    ctx.globalAlpha = a;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, (1 - a) * c.R, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Particles
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life * 4, 0, 1);
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

