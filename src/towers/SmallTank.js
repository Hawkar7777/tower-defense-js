// ===== FILE: src/towers/SmallTank.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { TOWER_TYPES } from "../config.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

// Tank Shell projectile
class TankShell {
  constructor(start, target, dmg, splash) {
    this.pos = { ...start };
    this.start = { ...start }; // Keep start for visual purposes
    this.target = target;
    this.speed = 380;
    this.dmg = dmg;
    this.splash = splash;
    this.dead = false;
    this.done = false;
    this.trailTimer = 0;
    this.size = 3;
  }

  update(dt) {
    if (!this.target || this.target.dead) {
      this.dead = this.done = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      // Explosion effect
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 180 + 60;
        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.4 + Math.random() * 0.3,
          r: 2 + Math.random() * 3,
          c: ["#ffaa33", "#ff7722", "#ff5500"][Math.floor(Math.random() * 3)],
          fade: 0.85,
        });
      }

      // Smoke cloud
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: this.pos.x + (Math.random() - 0.5) * 20,
          y: this.pos.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 40,
          vy: -20 - Math.random() * 30,
          life: 1.2 + Math.random() * 0.8,
          r: 5 + Math.random() * 4,
          c: "#444444",
          fade: 0.7,
        });
      }

      // Apply splash damage to nearby enemies
      if (this.splash > 0) {
        for (const enemy of enemies) {
          if (enemy.dead) continue;
          const edx = enemy.pos.x - this.pos.x;
          const edy = enemy.pos.y - this.pos.y;
          const edist = Math.sqrt(edx * edx + edy * edy);

          if (edist <= this.splash) {
            // Damage falls off with distance
            const damageMultiplier = 1 - (edist / this.splash) * 0.5;
            enemy.damage(this.dmg * damageMultiplier);
          }
        }
      } else if (typeof this.target.damage === "function") {
        this.target.damage(this.dmg);
      }

      this.dead = this.done = true;
      return;
    }

    const vx = (dx / distance) * this.speed;
    const vy = (dy / distance) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // Smoke trail
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.05;
      particles.push({
        x: this.pos.x - vx * 0.02,
        y: this.pos.y - vy * 0.02,
        vx: vx * -0.1 + (Math.random() - 0.5) * 20,
        vy: vy * -0.1 + (Math.random() - 0.5) * 20,
        life: 0.5 + Math.random() * 0.3,
        r: 1.5 + Math.random() * 1.5,
        c: "#888888",
        fade: 0.8,
      });
    }
  }

  draw() {
    ctx.save();
    ctx.beginPath();

    // Shell body with gradient
    const gradient = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      0,
      this.pos.x,
      this.pos.y,
      this.size
    );
    gradient.addColorStop(0, "#ffcc44");
    gradient.addColorStop(1, "#cc6600");

    ctx.fillStyle = gradient;
    ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Shell tip
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class SmallTank extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.smallTank;
  }
  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: Math.round(base.range * (1 + (this.level - 1) * 0.1)),
      splash: Math.round(base.splash * (1 + (this.level - 1) * 0.15)),
    };
  }

  // Initialize tank-specific state
  _ensureState() {
    if (!this._s) {
      this._s = {
        trackOffset: 0,
        recoil: 0,
        turretAngle: 0,
        muzzleFlash: 0,
        idleBob: 0,
      };
    }
  }

  getAttackOrigin() {
    this._ensureState();
    const ang = this._s.turretAngle || 0;
    return {
      x: this.center.x + Math.cos(ang) * 22,
      y: this.center.y + Math.sin(ang) * 22,
    };
  }

  update(dt, enemiesList) {
    this._ensureState();
    const s = this.spec();
    this.cool -= dt;

    // Update tank state
    this._s.trackOffset += dt * 2;
    this._s.recoil = Math.max(0, this._s.recoil - dt * 3);
    this._s.muzzleFlash = Math.max(0, this._s.muzzleFlash - dt * 10);
    this._s.idleBob = Math.sin(performance.now() / 800) * 0.5;

    // Find target
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

    // Rotate turret toward target
    if (target) {
      const dx = target.pos.x - this.center.x;
      const dy = target.pos.y - this.center.y;
      const want = Math.atan2(dy, dx);
      const diff =
        ((want - this._s.turretAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
      this._s.turretAngle += diff * Math.min(1, dt * 5);
      soundManager.playSound("smallTankShoot", 0.2);
    }

    // Fire if ready
    if (this.cool <= 0 && target) {
      this.cool = 1 / s.fireRate;
      projectiles.push(
        new TankShell(this.getAttackOrigin(), target, s.dmg, s.splash)
      );

      // Recoil effect
      this._s.recoil = 1.0;

      // Muzzle flash
      this._s.muzzleFlash = 0.2;

      // Smoke from barrel
      for (let i = 0; i < 5; i++) {
        const origin = this.getAttackOrigin();
        particles.push({
          x: origin.x,
          y: origin.y,
          vx: (Math.random() - 0.5) * 40 - Math.cos(this._s.turretAngle) * 60,
          vy: (Math.random() - 0.5) * 40 - Math.sin(this._s.turretAngle) * 60,
          life: 0.6 + Math.random() * 0.4,
          r: 3 + Math.random() * 2,
          c: "#888888",
          fade: 0.8,
        });
      }

      // Tank shake
      this.center.x += (Math.random() - 0.5) * 3;
      this.center.y += (Math.random() - 0.5) * 3;
    }
  }

  draw() {
    const { x, y } = this.center;
    this._ensureState();
    const s = this.spec();
    const recoil = this._s.recoil;
    const idleBob = this._s.idleBob;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tank body (with camo pattern)
    ctx.save();
    ctx.translate(0, idleBob);

    // Main body
    ctx.fillStyle = "#556b2f";
    roundRect(ctx, x - 24, y - 12, 48, 24, 4);

    // Camo pattern - dark green spots
    ctx.fillStyle = "#3d5229";
    ctx.beginPath();
    ctx.arc(x - 10, y - 5, 6, 0, Math.PI * 2);
    ctx.arc(x + 15, y + 2, 5, 0, Math.PI * 2);
    ctx.arc(x - 15, y + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Body outline
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#2f3d1c";
    roundRectStroke(ctx, x - 24, y - 12, 48, 24, 4);

    // Tank tracks
    ctx.fillStyle = "#333333";
    ctx.fillRect(x - 28, y + 10, 56, 8);

    // Track treads
    ctx.fillStyle = "#222222";
    for (let i = -26; i <= 26; i += 8) {
      ctx.fillRect(x + i - 4, y + 10, 4, 8);
    }

    // Track highlights
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 28, y + 10);
    ctx.lineTo(x + 28, y + 10);
    ctx.moveTo(x - 28, y + 18);
    ctx.lineTo(x + 28, y + 18);
    ctx.stroke();

    // Track movement effect
    ctx.strokeStyle = "#777777";
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = this._s.trackOffset;
    ctx.beginPath();
    ctx.moveTo(x - 28, y + 14);
    ctx.lineTo(x + 28, y + 14);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();

    // Turret
    ctx.save();
    ctx.translate(x, y);

    // Rotate turret
    ctx.rotate(this._s.turretAngle);

    // Apply recoil effect
    ctx.translate(-recoil * 4, 0);

    // Turret base
    ctx.fillStyle = "#556b2f";
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Turret outline
    ctx.strokeStyle = "#2f3d1c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Gun barrel
    ctx.fillStyle = "#444444";
    roundRect(ctx, 0, -4, 28 + recoil * 2, 8, 2);

    // Barrel details
    ctx.fillStyle = "#222222";
    ctx.fillRect(26 + recoil * 2, -5, 4, 10);

    // Muzzle flash
    if (this._s.muzzleFlash > 0) {
      const flashSize = this._s.muzzleFlash * 15;
      ctx.save();
      ctx.translate(28 + recoil * 2, 0);

      // Flash core
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flashSize);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.3, "#ffaa00");
      gradient.addColorStop(1, "rgba(255, 100, 0, 0)");

      ctx.globalAlpha = Math.min(1, this._s.muzzleFlash * 5);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, flashSize, 0, Math.PI * 2);
      ctx.fill();

      // Flash spikes
      ctx.globalAlpha = Math.min(0.7, this._s.muzzleFlash * 3);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spikeLength = flashSize * (1.5 + Math.random() * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(angle) * spikeLength,
          Math.sin(angle) * spikeLength
        );
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffaa44";
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();

    // Tank details (hatch, vision ports, etc.)
    ctx.save();
    ctx.translate(0, idleBob);

    // Commander's hatch
    ctx.fillStyle = "#3d5229";
    ctx.beginPath();
    ctx.arc(x, y - 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2f3d1c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 2, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Vision ports
    ctx.fillStyle = "#222222";
    ctx.fillRect(x - 18, y - 4, 4, 3);
    ctx.fillRect(x + 14, y - 4, 4, 3);

    // Headlights
    ctx.fillStyle = "#444444";
    ctx.fillRect(x - 26, y - 8, 3, 4);
    ctx.fillRect(x + 23, y - 8, 3, 4);

    ctx.fillStyle = "#ffffaa";
    ctx.fillRect(x - 26, y - 8, 2, 4);
    ctx.fillRect(x + 23, y - 8, 2, 4);

    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // Level indicator
    // for (let i = 0; i < Math.min(4, this.level); i++) {
    //   const markerX = x - 18 + i * 12;
    //   const markerY = y - 20;

    //   ctx.fillStyle = "#ffcc00";
    //   ctx.beginPath();
    //   ctx.moveTo(markerX, markerY);
    //   ctx.lineTo(markerX - 4, markerY - 6);
    //   ctx.lineTo(markerX + 4, markerY - 6);
    //   ctx.closePath();
    //   ctx.fill();

    //   ctx.strokeStyle = "#aa7700";
    //   ctx.lineWidth = 1;
    //   ctx.beginPath();
    //   ctx.moveTo(markerX, markerY);
    //   ctx.lineTo(markerX - 4, markerY - 6);
    //   ctx.lineTo(markerX + 4, markerY - 6);
    //   ctx.closePath();
    //   ctx.stroke();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for SmallTank ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
  }
}

/* ---------- helper drawing funcs ---------- */

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
