// ===== FILE: src/towers/CarM249Tower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { TOWER_TYPES } from "../config.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

// Bullet projectile (with tracer)
class Bullet {
  constructor(start, target, dmg) {
    this.pos = { ...start };
    this.target = target;
    this.speed = 700;
    this.dmg = dmg;
    this.dead = false;
    this.done = false;
    // give a tiny random offset so tracers look varied
    this.offset = (Math.random() - 0.5) * 2;
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.dead = this.done = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 6) {
      if (typeof this.target.damage === "function")
        this.target.damage(this.dmg);

      // impact sparks
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 120 + 40;
        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.35 + Math.random() * 0.25,
          r: 1 + Math.random() * 2,
          c: ["#ffdd55", "#ffaa33", "#ff8866"][Math.floor(Math.random() * 3)],
          fade: 0.9,
        });
      }

      this.dead = this.done = true;
      return;
    }

    const vx = (dx / distance) * this.speed;
    const vy = (dy / distance) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // short tracer particle
    particles.push({
      x: this.pos.x + this.offset,
      y: this.pos.y,
      vx: 0,
      vy: 0,
      life: 0.08,
      r: 0.9,
      c: "#fff9a8",
      fade: 0.7,
    });
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "#fff9a8";
    ctx.arc(this.pos.x, this.pos.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class CarM249Tower extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.carM249;
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.22;
    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: Math.round(base.range * (1 + (this.level - 1) * 0.08)),
    };
  }

  // lazy per-instance state (wheel spin, recoil, turret angle, muzzle timer)
  _ensureState() {
    if (!this._s)
      this._s = { wheelRot: 0, recoil: 0, turretAngle: 0, muzzle: 0 };
  }

  getAttackOrigin() {
    this._ensureState();
    const ang = this._s.turretAngle || 0;
    // muzzle sits a bit forward of turret center
    return {
      x: this.center.x + Math.cos(ang) * 18,
      y: this.center.y - 10 + Math.sin(ang) * 6,
    };
  }

  update(dt, enemiesList) {
    this._ensureState();
    const s = this.spec();
    this.cool -= dt;

    // wheel spin - tied to time and slightly to firing
    this._s.wheelRot += dt * 8 * (1 + Math.min(1, s.fireRate / 5));

    // recoil decay & muzzle decay
    this._s.recoil = Math.max(0, this._s.recoil - dt * 6);
    this._s.muzzle = Math.max(0, this._s.muzzle - dt * 12);

    // find target (closest in range)
    let target = null;
    let minDist = Infinity;
    for (const e of enemiesList) {
      if (e.dead) continue;
      const d = dist(this.center, e.pos);
      if (d <= s.range && d < minDist) {
        target = e;
        minDist = d;
      }
    }

    // smoothly rotate turret toward target
    if (target) {
      const dx = target.pos.x - this.center.x;
      const dy = target.pos.y - (this.center.y - 10);
      const want = Math.atan2(dy, dx);
      // smooth interpolate
      const diff =
        ((want - this._s.turretAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
      this._s.turretAngle += diff * Math.min(1, dt * 10);
    } else {
      // idle drift
      this._s.turretAngle += Math.sin(performance.now() / 1000) * 0.001;
    }

    if (this.cool <= 0 && target) {
      this.cool = 1 / s.fireRate;
      projectiles.push(new Bullet(this.getAttackOrigin(), target, s.dmg));

      // trigger recoil + muzzle
      this._s.recoil = Math.min(1.2, this._s.recoil + 0.9);
      this._s.muzzle = 0.16 + Math.random() * 0.05;
      soundManager.playSound("carM249Shoot", 0.1);

      // big muzzle particle
      particles.push({
        x: this.center.x + Math.cos(this._s.turretAngle) * 18,
        y: this.center.y - 10 + Math.sin(this._s.turretAngle) * 6,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 40,
        life: 0.14,
        r: 4 + Math.random() * 2,
        c: "#ffd07a",
        fade: 0.85,
      });

      // small heat/smoke puffs at exhaust
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: this.center.x - 16 + Math.random() * 8,
          y: this.center.y + 6 + Math.random() * 2,
          vx: -20 - Math.random() * 40,
          vy: -20 - Math.random() * 10,
          life: 0.7 + Math.random() * 0.6,
          r: 4 + Math.random() * 3,
          c: "#444444",
          fade: 0.65,
        });
      }
    }
  }

  draw() {
    const { x, y } = this.center;
    const t = performance.now() / 1000;
    this._ensureState();
    const s = this.spec();

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, y + 16, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // car body gradient + shine
    ctx.save();
    const grad = ctx.createLinearGradient(x - 18, y - 12, x + 18, y + 12);
    grad.addColorStop(0, "#2f7bff");
    grad.addColorStop(0.6, "#2a9bff");
    grad.addColorStop(1, "#7fc7ff");
    ctx.fillStyle = grad;
    roundRect(ctx, x - 20, y - 16, 40, 28, 6);
    ctx.fill();

    // body stroke
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "#07223a";
    roundRectStroke(ctx, x - 20, y - 16, 40, 28, 6);

    // windshield (glass)
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 14);
    ctx.quadraticCurveTo(x, y - 22, x + 8, y - 14);
    ctx.lineTo(x + 8, y - 6);
    ctx.quadraticCurveTo(x, y - 10, x - 8, y - 6);
    ctx.closePath();
    ctx.fill();

    // headlights
    ctx.fillStyle = "#fff7d1";
    ctx.beginPath();
    ctx.ellipse(x - 18 + 6, y + 2, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 18 - 6, y + 2, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // wheels (with spin)
    ctx.save();
    const wheelOffset = 14;
    const rot = this._s.wheelRot;
    for (let wx of [-wheelOffset, wheelOffset]) {
      drawWheel(ctx, x + wx, y + 12, 6, rot * (wx > 0 ? 1 : -1));
    }
    ctx.restore();

    // turret base (on roof)
    ctx.save();
    ctx.translate(x, y - 10);
    // slight bob and small scale depending on recoil
    const recoil = this._s.recoil;
    const baseScale = 1 - recoil * 0.02;
    ctx.scale(baseScale, baseScale);

    // turret mounting plate
    ctx.fillStyle = "#33363a";
    ctx.beginPath();
    ctx.ellipse(0, 2, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // rotate turret (gun) toward target
    ctx.rotate(this._s.turretAngle);

    // gun
    ctx.save();
    const gunRecoil = -recoil * 6; // move barrel back when recoil
    ctx.translate(gunRecoil, 0);

    // ammo box
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(-14, -6, 10, 12);
    // small ammo detail
    ctx.fillStyle = "#bfa24a";
    ctx.fillRect(-12, -4, 6, 8);

    // barrel
    ctx.fillStyle = "#666";
    roundRect(ctx, 0, -3, 28, 6, 3); // long barrel to right
    // barrel tip
    ctx.fillStyle = "#222";
    roundRect(ctx, 26, -4, 6, 8, 3);
    ctx.restore();

    // ammo belt draped (simple curved tri)
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.quadraticCurveTo(-2, -8, 8, -6);
    ctx.lineTo(8, -3);
    ctx.quadraticCurveTo(-2, -4, -8, -2);
    ctx.closePath();
    ctx.fillStyle = "#3b3b3b";
    ctx.fill();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // muzzle flash (if active)
    if (this._s.muzzle > 0) {
      const m = this._s.muzzle;
      const flashX = 20;
      const flashY = 0;
      ctx.save();
      ctx.globalAlpha = Math.min(1, m * 6);
      ctx.beginPath();
      ctx.moveTo(flashX, flashY);
      ctx.lineTo(
        flashX + 8 + Math.random() * 8,
        flashY - 3 - Math.random() * 6
      );
      ctx.lineTo(
        flashX + 8 + Math.random() * 8,
        flashY + 3 + Math.random() * 6
      );
      ctx.closePath();
      ctx.fillStyle = `rgba(255,200,120,${0.6 * m})`;
      ctx.fill();
      ctx.restore();

      // heat glow on barrel end
      ctx.save();
      ctx.globalAlpha = 0.25 * m;
      ctx.fillStyle = "#ffbb88";
      ctx.beginPath();
      ctx.arc(26, 0, 8 * m, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // end turret translation/rotation

    // small roof detail / emblem
    ctx.save();
    ctx.fillStyle = "#ffffff33";
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 6);
    ctx.lineTo(x, y - 10);
    ctx.lineTo(x + 5, y - 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // level markers (nice little chevrons)
    // for (let i = 0; i < Math.min(4, this.level); i++) {
    //   const ix = x - 12 + i * 8;
    //   const iy = y + 20;
    //   ctx.fillStyle = "#ffd87a";
    //   ctx.beginPath();
    //   ctx.moveTo(ix, iy);
    //   ctx.lineTo(ix + 4, iy + 6);
    //   ctx.lineTo(ix - 4, iy + 6);
    //   ctx.closePath();
    //   ctx.fill();
    //   ctx.strokeStyle = "#7b5a2a";
    //   ctx.lineWidth = 0.7;
    //   ctx.stroke();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for CarM249Tower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the car. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
  }
}

/* ---------- helper drawing funcs ---------- */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  const rx = r;
  ctx.moveTo(x + rx, y);
  ctx.arcTo(x + w, y, x + w, y + h, rx);
  ctx.arcTo(x + w, y + h, x, y + h, rx);
  ctx.arcTo(x, y + h, x, y, rx);
  ctx.arcTo(x, y, x + w, y, rx);
  ctx.closePath();
  ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  const rx = r;
  ctx.moveTo(x + rx, y);
  ctx.arcTo(x + w, y, x + w, y + h, rx);
  ctx.arcTo(x + w, y + h, x, y + h, rx);
  ctx.arcTo(x, y + h, x, y, rx);
  ctx.arcTo(x, y, x + w, y, rx);
  ctx.closePath();
  ctx.stroke();
}

function drawWheel(ctx, cx, cy, radius, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  // rim
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  // hub
  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // spokes
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos((i / 6) * Math.PI * 2) * radius * 0.85,
      Math.sin((i / 6) * Math.PI * 2) * radius * 0.85
    );
    ctx.stroke();
  }
  ctx.restore();
}
