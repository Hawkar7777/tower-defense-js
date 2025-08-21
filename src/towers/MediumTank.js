// ===== FILE: src/towers/MediumTank.js =====
//
// Medium Tank (visuals adjusted): replaces special "ring" particles with
// simple circular particles for muzzle flash circle and explosion circle.
//
// Depends on globals: ctx, enemies, projectiles, particles, dist, TOWER_TYPES
//

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { TOWER_TYPES } from "../config.js";

/* ---------------- Medium Shell (fancier) ---------------- */
class MediumTankShell {
  constructor(start, target, dmg, splash) {
    this.pos = { ...start };
    this.target = target;
    this.speed = 300; // deliberate heavy shell
    this.dmg = dmg;
    this.splash = splash;
    this.dead = false;
    this.done = false;
    this.trailTimer = 0;
    this.size = 6; // chunky projectile
    this.age = 0;
    this.coreColor = ["#ffd46b", "#ffb84d", "#ff9a3d"][
      Math.floor(Math.random() * 3)
    ];
  }

  update(dt) {
    this.age += dt;
    if (!this.target || this.target.dead) {
      this.pos.x += Math.cos(this._lastAngle || 0) * this.speed * dt;
      this.pos.y += Math.sin(this._lastAngle || 0) * this.speed * dt;
      if (this.age > 1.2) this.dead = this.done = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx);
    this._lastAngle = angle;

    if (distance < 14) {
      // Impact: burst, smoke and a single circular shock visual (simple circle)
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 260 + 100;
        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.5 + Math.random() * 0.6,
          r: 3 + Math.random() * 4,
          c: ["#fff2b8", "#ffb65c", "#ff6b3a"][Math.floor(Math.random() * 3)],
          fade: 0.88,
        });
      }

      for (let i = 0; i < 12; i++) {
        particles.push({
          x: this.pos.x + (Math.random() - 0.5) * 20,
          y: this.pos.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 80,
          vy: -20 - Math.random() * 80,
          life: 1.2 + Math.random() * 1.0,
          r: 6 + Math.random() * 6,
          c: "#333333",
          fade: 0.72,
        });
      }

      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 220 + 50;
        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.7 + Math.random() * 0.8,
          r: 2 + Math.random() * 3,
          c: "#7b4a2a",
          fade: 0.9,
        });
      }

      // Replace special "shockwave" tag with a plain circular particle (single circle)
      particles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: 0,
        vy: 0,
        life: 0.45,
        r: this.splash || 20,
        c: "rgba(255,200,100,0.10)", // translucent circle color
        fade: 0.9,
      });

      // Apply splash damage
      if (this.splash > 0) {
        for (const enemy of enemies) {
          if (enemy.dead) continue;
          const edx = enemy.pos.x - this.pos.x;
          const edy = enemy.pos.y - this.pos.y;
          const edist = Math.sqrt(edx * edx + edy * edy);
          if (edist <= this.splash) {
            const dmgMul = 1 - (edist / this.splash) * 0.6;
            enemy.damage(this.dmg * dmgMul);
          }
        }
      } else if (typeof this.target.damage === "function") {
        this.target.damage(this.dmg);
      }

      this.dead = this.done = true;
      return;
    }

    // flight
    const vx = (dx / distance) * this.speed;
    const vy = (dy / distance) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // glowing trail + smoke puffs
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.055;
      particles.push({
        x: this.pos.x - vx * 0.02,
        y: this.pos.y - vy * 0.02,
        vx: vx * -0.06 + (Math.random() - 0.5) * 18,
        vy: vy * -0.06 + (Math.random() - 0.5) * 18,
        life: 0.45 + Math.random() * 0.3,
        r: 1.2 + Math.random() * 2,
        c: this.coreColor,
        fade: 0.9,
      });

      particles.push({
        x: this.pos.x + (Math.random() - 0.5) * 6,
        y: this.pos.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 6,
        life: 0.9 + Math.random() * 0.9,
        r: 2.5 + Math.random() * 3,
        c: "#6d6d6d",
        fade: 0.85,
      });
    }
  }

  draw() {
    ctx.save();
    // bright core glow
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      0,
      this.pos.x,
      this.pos.y,
      this.size * 3
    );
    g.addColorStop(0, this.coreColor);
    g.addColorStop(0.4, "rgba(255,200,120,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // shell body (metal)
    ctx.globalCompositeOperation = "source-over";
    ctx.save();
    const grad = ctx.createLinearGradient(
      this.pos.x - this.size,
      this.pos.y - this.size,
      this.pos.x + this.size,
      this.pos.y + this.size
    );
    grad.addColorStop(0, "#ddd6c9");
    grad.addColorStop(0.5, "#b7a79a");
    grad.addColorStop(1, "#7b6a61");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(
      this.pos.x,
      this.pos.y,
      this.size,
      this.size * 0.9,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = "#3b3733";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();

    // nose/core dot
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(
      this.pos.x + Math.cos(this._lastAngle || 0) * 2,
      this.pos.y + Math.sin(this._lastAngle || 0) * 2,
      this.size * 0.55,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}

/* ---------------- Medium Tank class (fancy visuals) ---------------- */
export class MediumTank extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.mediumTank;
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.28;
    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: Math.round(base.range * (1 + (this.level - 1) * 0.08)),
      splash: Math.round(base.splash * (1 + (this.level - 1) * 0.12)),
    };
  }

  _ensureState() {
    if (!this._s) {
      this._s = {
        trackOffset: 0,
        recoil: 0,
        turretAngle: 0,
        muzzleFlash: 0,
        idleBob: 0,
        heat: 0,
      };
    }
  }

  getAttackOrigin() {
    this._ensureState();
    const ang = this._s.turretAngle || 0;
    return {
      x: this.center.x + Math.cos(ang) * 34,
      y: this.center.y + Math.sin(ang) * 34,
    };
  }

  update(dt, enemiesList) {
    this._ensureState();
    const s = this.spec();
    this.cool -= dt;

    this._s.trackOffset += dt * 1.6;
    this._s.recoil = Math.max(0, this._s.recoil - dt * 2.4);
    this._s.muzzleFlash = Math.max(0, this._s.muzzleFlash - dt * 9);
    this._s.heat = Math.max(0, this._s.heat - dt * 0.6);
    this._s.idleBob = Math.sin(performance.now() / 900) * 0.55;

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

    if (target) {
      const dx = target.pos.x - this.center.x;
      const dy = target.pos.y - this.center.y;
      const want = Math.atan2(dy, dx);
      const diff =
        ((want - this._s.turretAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
      this._s.turretAngle += diff * Math.min(1, dt * 2.8);
    } else {
      this._s.turretAngle += Math.sin(performance.now() / 1200) * dt * 0.02;
    }

    if (this.cool <= 0 && target) {
      this.cool = 1 / s.fireRate;
      projectiles.push(
        new MediumTankShell(this.getAttackOrigin(), target, s.dmg, s.splash)
      );

      this._s.recoil = 1.6;
      this._s.muzzleFlash = 0.35;
      this._s.heat = Math.min(1.6, this._s.heat + 0.9);

      const origin = this.getAttackOrigin();
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: origin.x + (Math.random() - 0.5) * 8,
          y: origin.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 80 - Math.cos(this._s.turretAngle) * 120,
          vy: (Math.random() - 0.5) * 80 - Math.sin(this._s.turretAngle) * 120,
          life: 0.7 + Math.random() * 0.6,
          r: 3 + Math.random() * 3,
          c: ["#ffeaa7", "#ffb76b"][Math.floor(Math.random() * 2)],
          fade: 0.85,
        });
      }

      // Replace lingering "muzzleRing" particle with a simple translucent circle
      particles.push({
        x: origin.x + Math.cos(this._s.turretAngle) * 6,
        y: origin.y + Math.sin(this._s.turretAngle) * 6,
        vx: 0,
        vy: 0,
        life: 0.6,
        r: 12,
        c: "rgba(180,180,180,0.28)",
        fade: 0.9,
      });

      this.center.x += (Math.random() - 0.5) * 2.5;
      this.center.y += (Math.random() - 0.5) * 2.5;
    }
  }

  draw() {
    const { x, y } = this.center;
    this._ensureState();
    const recoil = this._s.recoil;
    const idleBob = this._s.idleBob;

    // SHADOW
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, y + 24, 40, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // BODY
    ctx.save();
    ctx.translate(0, idleBob);

    const hullGrad = ctx.createLinearGradient(x - 36, y - 18, x + 36, y + 18);
    hullGrad.addColorStop(0, "#9a7f58");
    hullGrad.addColorStop(0.5, "#6b4f36");
    hullGrad.addColorStop(1, "#452e1f");
    ctx.fillStyle = hullGrad;
    roundRect(ctx, x - 34, y - 16, 68, 32, 6);

    ctx.fillStyle = "#5b3e25";
    roundRect(ctx, x - 28, y - 18, 56, 18, 5);

    ctx.strokeStyle = "rgba(255,220,170,0.15)";
    ctx.lineWidth = 1;
    roundRectStroke(ctx, x - 34, y - 16, 68, 32, 6);

    ctx.fillStyle = "#2b2018";
    for (let i = -22; i <= 22; i += 11) {
      ctx.beginPath();
      ctx.arc(x + i, y - 10, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(40,30,22,0.12)";
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 2, 14, 8, -0.4, 0, Math.PI * 2);
    ctx.ellipse(x + 16, y + 4, 10, 6, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2d2420";
    ctx.fillRect(x - 36, y + 12, 72, 12);
    ctx.strokeStyle = "#1a1513";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 36, y + 12, 72, 12);

    ctx.fillStyle = "#151214";
    const treadSpacing = 10;
    for (
      let i = -36 + ((this._s.trackOffset * 10) % treadSpacing);
      i <= 36;
      i += treadSpacing
    ) {
      ctx.fillRect(x + i, y + 12, 6, 12);
    }

    ctx.strokeStyle = "#3c3a3a";
    ctx.beginPath();
    ctx.moveTo(x - 36, y + 12);
    ctx.lineTo(x + 36, y + 12);
    ctx.moveTo(x - 36, y + 24);
    ctx.lineTo(x + 36, y + 24);
    ctx.stroke();

    ctx.restore();

    // TURRET
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this._s.turretAngle);

    const turretGrad = ctx.createLinearGradient(-20, -20, 20, 20);
    turretGrad.addColorStop(0, "#7c5a3b");
    turretGrad.addColorStop(1, "#3f2b20");
    ctx.fillStyle = turretGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#251b16";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(-6, -6);
    ctx.fillStyle = "#6a4b33";
    roundRect(ctx, -8, -6, 16, 12, 3);
    ctx.strokeStyle = "#321f16";
    ctx.lineWidth = 1;
    roundRectStroke(ctx, -8, -6, 16, 12, 3);
    ctx.restore();

    ctx.fillStyle = "#2a2118";
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      const rx = Math.cos(a) * 16;
      const ry = Math.sin(a) * 16;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(-recoil * 6, 0);
    ctx.fillStyle = "#333232";
    roundRect(ctx, 6, -6.5, 46 + recoil * 3, 13, 3);
    ctx.fillStyle = "#151515";
    roundRect(ctx, 44 + recoil * 3, -4.5, 6, 9, 1.5);
    ctx.strokeStyle = "rgba(255,240,200,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(40, -3);
    ctx.stroke();
    ctx.restore();

    if (this._s.muzzleFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const mf = this._s.muzzleFlash;
      const originX = x + Math.cos(this._s.turretAngle) * (46 + recoil * 3);
      const originY = y + Math.sin(this._s.turretAngle) * (46 + recoil * 3);

      const g = ctx.createRadialGradient(
        originX,
        originY,
        0,
        originX,
        originY,
        36 * mf
      );
      g.addColorStop(0, "rgba(255,255,220," + Math.min(0.95, mf * 1.1) + ")");
      g.addColorStop(0.3, "rgba(255,170,60," + 0.6 * mf + ")");
      g.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(originX, originY, 36 * mf, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = Math.min(0.85, mf * 1.2);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(
          originX + Math.cos(angle) * (28 * mf + Math.random() * 18),
          originY + Math.sin(angle) * (28 * mf + Math.random() * 18)
        );
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,160,80," + 0.6 * mf + ")";
        ctx.stroke();
      }

      ctx.restore();
    }

    if (this._s.heat > 0.02) {
      ctx.save();
      ctx.globalAlpha = this._s.heat * 0.7;
      ctx.translate(x, y);
      const hx = Math.cos(this._s.turretAngle) * 36;
      const hy = Math.sin(this._s.turretAngle) * 36;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const wob = Math.sin(performance.now() / 120 + i) * 2;
        ctx.moveTo(hx + wob, hy + -i * 4);
        ctx.quadraticCurveTo(
          hx + wob + 8,
          hy - 18 - i * 2,
          hx + wob + 22,
          hy - 30 - i * 2
        );
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(200,200,220,0.12)";
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    // TOP DETAILS
    ctx.save();
    ctx.translate(0, idleBob);
    ctx.fillStyle = "#2f1f13";
    ctx.beginPath();
    ctx.arc(x + 6, y - 4, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b140f";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "10px sans-serif";
    ctx.fillText("M-III", x - 12, y - 12);
    ctx.restore();

    // LEVEL CHEVRONS
    for (let i = 0; i < Math.min(4, this.level); i++) {
      const mx = x - 18 + i * 12;
      const my = y - 28;
      ctx.fillStyle = "#ffd24b";
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 4, my - 6);
      ctx.lineTo(mx + 4, my - 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#b77b00";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

/* ---------- helper drawing funcs (kept local for file independence) ---------- */
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}
