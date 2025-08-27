import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { Bullet } from "../bullet.js";
import { projectiles, particles } from "../state.js";
import { dist, clamp } from "../utils.js";
import { spawnMuzzle } from "../effects.js";

export class GunTower extends BaseTower {
  constructor(gx, gy, key) {
    super(gx, gy, key);
    this._s = {
      muzzleFlashEffect: 0,
    };
    this.shootSound = new Audio("./assets/sounds/gunnerTower.mp3");
    this.shootSound.volume = 0.6;
    this.shootSound.load();
  }

  playShootSound() {
    if (this.shootSound) {
      this.shootSound.pause();
      this.shootSound.currentTime = 0;
      this.shootSound.play().catch((e) => {
        console.warn("GunTower sound playback prevented:", e);
      });
    }
  }

  fireProjectile(center, target, spec) {
    const barrelTipOffset = 18;

    const startX = center.x + Math.cos(this.rot) * barrelTipOffset;
    const startY = center.y + Math.sin(this.rot) * barrelTipOffset;

    if (this.missChance > 0 && Math.random() < this.missChance) {
      spawnMuzzle(startX, startY, this.rot, "#ff5555");
      return;
    }

    projectiles.push(new Bullet(startX, startY, target, spec));
    spawnMuzzle(startX, startY, this.rot, spec.color);

    this._s.muzzleFlashEffect = 1;

    this.playShootSound();
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    this._s.muzzleFlashEffect = Math.max(0, this._s.muzzleFlashEffect - dt * 5);

    let best = null,
      bestScore = -1;

    for (const e of enemiesList) {
      if (e.dead) continue;
      const p = e.pos;
      const d = dist(this.center, p);
      if (d <= s.range && e.t > bestScore) {
        best = e;
        bestScore = e.t;
      }
    }

    if (!best) return;
    const c = this.center,
      bp = best.pos;
    this.rot = Math.atan2(bp.y - c.y, bp.x - c.x);

    if (this.cool <= 0) {
      this.cool = 1 / (s.fireRate * this.slowMultiplier);
      this.fireProjectile(c, best, s);
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now();

    ctx.fillStyle = "#34495e";
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 8, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    ctx.fillStyle = "#636e72";
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 5);
    ctx.fill();
    ctx.strokeStyle = "#4a5458";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.roundRect(0, -3, 20, 6, 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1f21";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.roundRect(18, -4, 4, 8, 1);
    ctx.fill();

    if (this._s.muzzleFlashEffect > 0) {
      const flashStrength = this._s.muzzleFlashEffect;
      ctx.save();
      ctx.translate(22, 0);
      ctx.globalCompositeOperation = "lighter";

      const outerGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        15 * flashStrength
      );
      outerGrad.addColorStop(0, `rgba(255, 170, 0, ${0.8 * flashStrength})`);
      outerGrad.addColorStop(1, "rgba(255, 170, 0, 0)");
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 15 * flashStrength, 0, Math.PI * 2);
      ctx.fill();

      const innerGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        8 * flashStrength
      );
      innerGrad.addColorStop(0, `rgba(255, 255, 200, ${flashStrength})`);
      innerGrad.addColorStop(1, `rgba(255, 200, 100, ${0.5 * flashStrength})`);
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 8 * flashStrength, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
  }
}
