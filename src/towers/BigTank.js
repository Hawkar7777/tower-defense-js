// ===== FILE: src/towers/BigTank.js =====
//
// Big Tank: dual-barrel heavy tank with a top gun.
// - Each barrel now fires its own shot (alternating left/right) so visuals match projectiles.
// - Top gun fires continuously (fast, small bullets) while an enemy is visible.
//
// Depends on globals: ctx, enemies, projectiles, particles, dist, TOWER_TYPES
//

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { TOWER_TYPES } from "../config.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

/* ---------------- Big Shell (heavy) ---------------- */
class BigTankShell {
  constructor(start, target, dmg, splash, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed || 220;
    this.dmg = dmg;
    this.splash = splash;
    this.dead = false;
    this.done = false;
    this.trailTimer = 0;
    this.size = 10 + Math.random() * 4; // big chunky shell
    this.age = 0;
    this.coreColor = ["#ffdca0", "#ffb86b", "#ff8f40"][
      Math.floor(Math.random() * 3)
    ];
  }

  update(dt) {
    this.age += dt;

    // --- NEW: always check collisions with any live enemy at current position ---
    // This allows the shell to hit another enemy even if its original target died
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const edx = enemy.pos.x - this.pos.x;
      const edy = enemy.pos.y - this.pos.y;
      const edist = Math.sqrt(edx * edx + edy * edy);
      if (edist < 18) {
        // Detonate on this enemy (same visual + damage as original impact)
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = Math.random() * 260 + 40;
          particles.push({
            x: this.pos.x,
            y: this.pos.y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 0.9 + Math.random() * 1.2,
            r: 2 + Math.random() * 4,
            c: "#6b3f2a",
            fade: 0.92,
          });
        }

        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: 0,
          vy: 0,
          life: 0.9,
          r: this.splash * 0.9,
          c: "rgba(150,110,80,0.12)",
          fade: 0.96,
        });

        if (this.splash > 0) {
          for (const e of enemies) {
            if (e.dead) continue;
            const dx2 = e.pos.x - this.pos.x;
            const dy2 = e.pos.y - this.pos.y;
            const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (d2 <= this.splash) {
              const dmgMul = 1 - (d2 / this.splash) * 0.7;
              e.damage(this.dmg * dmgMul);
            }
          }
        } else if (typeof enemy.damage === "function") {
          enemy.damage(this.dmg);
        }

        this.dead = this.done = true;
        return;
      }
    }
    // --- end collision check ---

    if (!this.target || this.target.dead) {
      // continue on last angle then time out
      this.pos.x += Math.cos(this._lastAngle || 0) * this.speed * dt;
      this.pos.y += Math.sin(this._lastAngle || 0) * this.speed * dt;
      if (this.age > 1.6) this.dead = this.done = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const angle = Math.atan2(dy, dx);
    this._lastAngle = angle;

    if (distance < 18) {
      // big impact: burst of heavy particles and smoke
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 260 + 40;
        particles.push({
          x: this.pos.x,
          y: this.pos.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0.9 + Math.random() * 1.2,
          r: 2 + Math.random() * 4,
          c: "#6b3f2a",
          fade: 0.92,
        });
      }

      // big circular shock visual (simple)
      particles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: 0,
        vy: 0,
        life: 0.9,
        r: this.splash * 0.9,
        c: "rgba(150,110,80,0.12)",
        fade: 0.96,
      });

      // Apply splash damage
      if (this.splash > 0) {
        for (const enemy of enemies) {
          if (enemy.dead) continue;
          const edx = enemy.pos.x - this.pos.x;
          const edy = enemy.pos.y - this.pos.y;
          const edist = Math.sqrt(edx * edx + edy * edy);
          if (edist <= this.splash) {
            const dmgMul = 1 - (edist / this.splash) * 0.7;
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

    // heavy glowing trail + smoke puffs
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.07;
      particles.push({
        x: this.pos.x - vx * 0.02,
        y: this.pos.y - vy * 0.02,
        vx: vx * -0.06 + (Math.random() - 0.5) * 26,
        vy: vy * -0.06 + (Math.random() - 0.5) * 26,
        life: 0.6 + Math.random() * 0.6,
        r: 2 + Math.random() * 3,
        c: this.coreColor,
        fade: 0.9,
      });

      particles.push({
        x: this.pos.x + (Math.random() - 0.5) * 8,
        y: this.pos.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 6,
        life: 1.1 + Math.random() * 1.1,
        r: 3 + Math.random() * 4,
        c: "#5f5f5f",
        fade: 0.88,
      });
    }
  }

  draw() {
    ctx.save();

    // big glow
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      0,
      this.pos.x,
      this.pos.y,
      this.size * 4
    );
    g.addColorStop(0, this.coreColor);
    g.addColorStop(0.4, "rgba(255,210,140,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 4, 0, Math.PI * 2);
    ctx.fill();

    // metal shell
    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(
      this.pos.x - this.size,
      this.pos.y - this.size,
      this.pos.x + this.size,
      this.pos.y + this.size
    );
    grad.addColorStop(0, "#eee3d0");
    grad.addColorStop(0.5, "#c6b49f");
    grad.addColorStop(1, "#8b6f5f");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(
      this.pos.x,
      this.pos.y,
      this.size,
      this.size * 0.95,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = "#472f25";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // core dot
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(
      this.pos.x + Math.cos(this._lastAngle || 0) * 3,
      this.pos.y + Math.sin(this._lastAngle || 0) * 3,
      this.size * 0.6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }
}

/* ---------------- Top gun bullet (fast, continuous) ---------------- */
class TopGunBullet {
  constructor(start, target, dmg, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed || 720;
    this.dmg = dmg || 30;
    this.dead = false;
    this.age = 0;
    this._lastAngle = 0;
  }

  update(dt) {
    this.age += dt;
    if (!this.target || this.target.dead) {
      // fly straight
      this.pos.x += Math.cos(this._lastAngle) * this.speed * dt;
      this.pos.y += Math.sin(this._lastAngle) * this.speed * dt;
      if (this.age > 1.2) this.dead = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distTo = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    this._lastAngle = angle;

    if (distTo < 8) {
      if (typeof this.target.damage === "function") {
        this.target.damage(this.dmg);
      }
      // small impact puff
      particles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 0.28 + Math.random() * 0.18,
        r: 1 + Math.random() * 2,
        c: "#ffdca0",
        fade: 0.9,
      });
      soundManager.playSound("bigTankRifleShoot", 0.3);

      this.dead = true;
      return;
    }

    const vx = (dx / distTo) * this.speed;
    const vy = (dy / distTo) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,220,140,0.95)";
    ctx.arc(this.pos.x, this.pos.y, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ---------------- Big Tank class ---------------- */
export class BigTank extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.bigTank;
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.24;
    // top gun params may be present in config.TOWER_TYPES.bigTank
    const topFireRate = base.topFireRate || 10; // bullets per second
    const topDmg = base.topDmg || 30;
    const topBulletSpeed = base.topBulletSpeed || 720;

    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: Math.round(base.range * (1 + (this.level - 1) * 0.06)),
      splash: Math.round(base.splash * (1 + (this.level - 1) * 0.1)),
      bulletSpeed: Math.round(base.bulletSpeed * (1 + (this.level - 1) * 0.0)),
      topFireRate,
      topDmg,
      topBulletSpeed,
    };
  }

  _ensureState() {
    if (!this._s) {
      this._s = {
        trackOffset: 0,
        recoil: 0,
        // default turret faces LEFT (Math.PI) instead of right (0)
        turretAngle: Math.PI,
        muzzleFlashLeft: 0,
        muzzleFlashRight: 0,
        // top gun also starts facing left
        topGunAngle: Math.PI,
        topGunFlash: 0,
        nextBarrelLeft: true,
        idleBob: 0,
        heat: 0,
        topCool: 0, // cooldown for top gun continuous fire
      };
    }
  }

  // return two attack origins (left & right barrel) for visual/projectile origins
  getAttackOrigins() {
    this._ensureState();
    const ang = this._s.turretAngle || 0;
    // barrels offset slightly from turret center
    const baseDist = 44;
    const sideOffset = 12;
    const left = {
      x: this.center.x + Math.cos(ang) * baseDist - Math.sin(ang) * sideOffset,
      y: this.center.y + Math.sin(ang) * baseDist + Math.cos(ang) * sideOffset,
    };
    const right = {
      x: this.center.x + Math.cos(ang) * baseDist + Math.sin(ang) * sideOffset,
      y: this.center.y + Math.sin(ang) * baseDist - Math.cos(ang) * sideOffset,
    };
    return { left, right };
  }

  // top gun origin (on top of turret)
  getTopGunOrigin() {
    this._ensureState();
    const ang = this._s.topGunAngle || this._s.turretAngle || 0;
    return {
      x: this.center.x + Math.cos(ang) * 16,
      y: this.center.y + Math.sin(ang) * 16 - 8,
    };
  }

  update(dt, enemiesList) {

    // If hexed, don't do any GunTower-specific logic
    if (this.isHexed) return;
    this._ensureState();
    const s = this.spec();
    this.cool -= dt;

    // slower track movement for heavy tank
    this._s.trackOffset += dt * 0.8;
    this._s.recoil = Math.max(0, this._s.recoil - dt * 1.8);
    this._s.muzzleFlashLeft = Math.max(0, this._s.muzzleFlashLeft - dt * 7.0);
    this._s.muzzleFlashRight = Math.max(0, this._s.muzzleFlashRight - dt * 7.0);
    this._s.topGunFlash = Math.max(0, this._s.topGunFlash - dt * 8.0);
    this._s.heat = Math.max(0, this._s.heat - dt * 0.45);
    this._s.idleBob = Math.sin(performance.now() / 1200) * 0.6;
    this._s.topCool = Math.max(0, this._s.topCool - dt);

    // find target
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

    // turret aims at target
    if (target) {
      const dx = target.pos.x - this.center.x;
      const dy = target.pos.y - this.center.y;
      const want = Math.atan2(dy, dx);
      const diff =
        ((want - this._s.turretAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
      this._s.turretAngle += diff * Math.min(1, dt * 1.8); // heavy turret, slower rotation
      // top gun follows turret but with small smoothing
      const topDiff =
        ((want - this._s.topGunAngle + Math.PI) % (2 * Math.PI)) - Math.PI;
      this._s.topGunAngle += topDiff * Math.min(1, dt * 6.0); // top gun tracks quicker
      soundManager.playSound("bigTankShoot", 0.2);
    } else {
      this._s.turretAngle += Math.sin(performance.now() / 1500) * dt * 0.02;
      this._s.topGunAngle += Math.sin(performance.now() / 900) * dt * 0.03;
    }

    // MAIN: fire ONE barrel per shot and alternate left/right so each physical pipe fires its own projectile
    if (this.cool <= 0 && target) {
      this.cool = 1 / s.fireRate;
      const { left, right } = this.getAttackOrigins();

      // choose which barrel fires this shot
      const firingLeft = !!this._s.nextBarrelLeft;
      const origin = firingLeft ? left : right;

      projectiles.push(
        new BigTankShell(origin, target, s.dmg, s.splash, s.bulletSpeed || 220)
      );

      // muzzle flash, recoil, heat for the fired barrel only
      if (firingLeft) {
        this._s.muzzleFlashLeft = 0.52;
      } else {
        this._s.muzzleFlashRight = 0.52;
      }

      // small recoil + heat (shared)
      this._s.recoil = 2.8;
      this._s.heat = Math.min(3.0, this._s.heat + 1.4);

      // slight positional shake on fire
      this.center.x += (Math.random() - 0.5) * 3.0;
      this.center.y += (Math.random() - 0.5) * 3.0;

      // spawn subtle muzzle particles for the fired barrel only
      const muzzleAngle = this._s.turretAngle;
      const particleOffset = firingLeft ? -12 : 12;
      particles.push({
        x: origin.x + Math.cos(muzzleAngle) * 8,
        y: origin.y + Math.sin(muzzleAngle) * 8,
        vx: 0,
        vy: 0,
        life: 0.7,
        r: 14,
        c: "rgba(200,160,110,0.36)",
        fade: 0.95,
      });

      // toggle which barrel fires next
      this._s.nextBarrelLeft = !this._s.nextBarrelLeft;
    }

    // TOP GUN: continuous small bullets while target present
    // top gun settings taken from spec(): topFireRate, topDmg, topBulletSpeed
    if (target) {
      // if top gun cooldown expired -> fire a bullet
      if (this._s.topCool <= 0) {
        const origin = this.getTopGunOrigin();
        projectiles.push(
          new TopGunBullet(origin, target, s.topDmg, s.topBulletSpeed)
        );
        this._s.topCool = 1 / (s.topFireRate || 10);
        this._s.topGunFlash = 0.16;
        // slight heat from continuous firing
        this._s.heat = Math.min(3.2, this._s.heat + 0.06);
      }
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
    ctx.ellipse(x, y + 28, 52, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // BODY (bigger)
    ctx.save();
    ctx.translate(0, idleBob);

    const hullGrad = ctx.createLinearGradient(x - 46, y - 22, x + 46, y + 22);
    // green / olive palette for a real-tank look
    hullGrad.addColorStop(0, "#2f5a2a");
    hullGrad.addColorStop(0.5, "#5a7f3a");
    hullGrad.addColorStop(1, "#1e3a1a");
    ctx.fillStyle = hullGrad;
    roundRect(ctx, x - 44, y - 20, 88, 40, 8);

    ctx.fillStyle = "#3a5a33";
    roundRect(ctx, x - 36, y - 22, 72, 22, 6);

    ctx.strokeStyle = "rgba(255,220,170,0.12)";
    ctx.lineWidth = 1;
    roundRectStroke(ctx, x - 44, y - 20, 88, 40, 8);

    // top plating details (darker olive)
    ctx.fillStyle = "#1f381f";
    ctx.fillRect(x - 44, y + 18, 88, 14);
    ctx.strokeStyle = "#122112";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 44, y + 18, 88, 14);

    // Treads
    ctx.fillStyle = "#0c0f0c";
    const treadSpacing = 12;
    for (
      let i = -44 + ((this._s.trackOffset * 8) % treadSpacing);
      i <= 44;
      i += treadSpacing
    ) {
      ctx.fillRect(x + i, y + 18, 8, 14);
    }

    ctx.restore();

    // TURRET (big circular)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this._s.turretAngle);

    const turretGrad = ctx.createLinearGradient(-28, -28, 28, 28);
    turretGrad.addColorStop(0, "#3a6a3a");
    turretGrad.addColorStop(1, "#163116");
    ctx.fillStyle = turretGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#0f2a10";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();

    // turret hatch
    ctx.fillStyle = "#355032";
    roundRect(ctx, -10, -10, 20, 10, 3);
    ctx.strokeStyle = "#16341f";
    ctx.lineWidth = 1;
    roundRectStroke(ctx, -10, -10, 20, 10, 3);

    // draw the two DISTINCT barrels (left & right) as separate pipes
    const sideOffset = 12;
    const barrelLength = 44 + recoil * 3;
    const barrelBodyW = 13;
    const barrelInset = -10 + recoil * -1.2;

    // LEFT BARREL
    ctx.save();
    ctx.translate(-sideOffset, 0); // move left from turret center
    // barrel body (slightly green-tinted dark metal)
    ctx.fillStyle = "#2e342e";
    roundRect(ctx, barrelInset, -6.5, barrelLength, barrelBodyW, 3);
    // muzzle cap (tip)
    ctx.fillStyle = "#171717";
    roundRect(ctx, barrelInset + barrelLength, -4.5, 6, 9, 2);
    // small rim at muzzle
    ctx.strokeStyle = "#0f0f0f";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(barrelInset + barrelLength, -4.5, 6, 9);
    ctx.restore();

    // RIGHT BARREL
    ctx.save();
    ctx.translate(sideOffset, 0); // move right from turret center
    // barrel body
    ctx.fillStyle = "#2e342e";
    roundRect(ctx, barrelInset, -6.5, barrelLength, barrelBodyW, 3);
    // muzzle cap (tip)
    ctx.fillStyle = "#171717";
    roundRect(ctx, barrelInset + barrelLength, -4.5, 6, 9, 2);
    // small rim at muzzle
    ctx.strokeStyle = "#0f0f0f";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(barrelInset + barrelLength, -4.5, 6, 9);
    ctx.restore();

    // muzzle flashes for left & right (local turret coordinates)
    if (this._s.muzzleFlashLeft > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const mf = this._s.muzzleFlashLeft;
      // left muzzle local pos:
      const originX = -sideOffset + (barrelInset + barrelLength + 3);
      const originY = 0;
      const g = ctx.createRadialGradient(
        originX,
        originY,
        0,
        originX,
        originY,
        36 * mf
      );
      g.addColorStop(0, "rgba(255,250,220," + Math.min(0.95, mf * 1.1) + ")");
      g.addColorStop(0.3, "rgba(255,170,60," + 0.6 * mf + ")");
      g.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(originX, originY, 36 * mf, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this._s.muzzleFlashRight > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const mf = this._s.muzzleFlashRight;
      // right muzzle local pos:
      const originX = sideOffset + (barrelInset + barrelLength + 3);
      const originY = 0;
      const g = ctx.createRadialGradient(
        originX,
        originY,
        0,
        originX,
        originY,
        36 * mf
      );
      g.addColorStop(0, "rgba(255,250,220," + Math.min(0.95, mf * 1.1) + ")");
      g.addColorStop(0.3, "rgba(255,170,60," + 0.6 * mf + ")");
      g.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(originX, originY, 36 * mf, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // heat shimmer lines off the barrels when hot
    if (this._s.heat > 0.02) {
      ctx.save();
      ctx.globalAlpha = this._s.heat * 0.6;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const wob = Math.sin(performance.now() / 140 + i) * 2;
        ctx.moveTo(20 + i * 6 + wob, -i * 2);
        ctx.quadraticCurveTo(36 + wob, -18 - i * 2, 52 + wob, -28 - i * 2);
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(200,200,220,0.12)";
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore(); // turret group

    // TOP GUN: small machine-gun style turret on top (visual)
    ctx.save();
    ctx.translate(x, y - 8 + idleBob);
    ctx.rotate(this._s.topGunAngle);
    ctx.fillStyle = "#2b372f";
    roundRect(ctx, -6, -6, 12, 8, 2);
    // barrel
    ctx.fillStyle = "#0c140d";
    roundRect(ctx, 6, -3.5, 14, 4.5, 1.5);
    if (this._s.topGunFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const mf = this._s.topGunFlash;
      const ox = 20;
      const oy = 0;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 12 * mf);
      g.addColorStop(0, "rgba(255,230,170," + Math.min(0.95, mf * 1.2) + ")");
      g.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, 12 * mf, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // TOP DETAILS & LABEL
    ctx.save();
    ctx.translate(0, idleBob);
    ctx.fillStyle = "#274227";
    ctx.beginPath();
    ctx.arc(x + 10, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#162a18";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "10px sans-serif";
    ctx.fillText("B-X", x - 14, y - 14);
    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // LEVEL CHEVRONS
    // for (let i = 0; i < Math.min(4, this.level); i++) {
    //   const mx = x - 22 + i * 12;
    //   const my = y - 36;
    //   ctx.fillStyle = "#ffd24b";
    //   ctx.beginPath();
    //   ctx.moveTo(mx, my);
    //   ctx.lineTo(mx - 4, my - 6);
    //   ctx.lineTo(mx + 4, my - 6);
    //   ctx.closePath();
    //   ctx.fill();
    //   ctx.strokeStyle = "#b77b00";
    //   ctx.lineWidth = 1;
    //   ctx.stroke();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for BigTank ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 35); // Adjusted y to avoid overlapping with base
    // --- END NEW CODE ---
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
