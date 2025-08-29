import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnMuzzle, spawnHit } from "../effects.js";
import { SniperBullet } from "../sniperBullet.js";
import { soundManager } from "../assets/sounds/SoundManager.js";
import { TOWER_TYPES } from "../config.js"; // <- unified tower stats

export class SniperTower extends BaseTower {
  spec() {
    const base = TOWER_TYPES.sniper;
    const mult = 1 + (this.level - 1) * 0.5;
    return {
      ...base,
      dmg: base.dmg * mult,
      range: base.range * (1 + (this.level - 1) * 0.15),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.1),
      penetration: base.penetration + Math.floor((this.level - 1) / 2),
      critChance: base.critChance + (this.level - 1) * 0.05,
      critMultiplier: base.critMultiplier + (this.level - 1) * 0.1,
    };
  }

  getAttackOrigin() {
    const c = this.center;
    const muzzleOffset = 50; // matches barrel tip in draw()
    return {
      x: c.x + Math.cos(this.rot) * muzzleOffset,
      y: c.y + Math.sin(this.rot) * muzzleOffset,
    };
  }

  update(dt, enemiesList) {
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;

    // prioritize farthest along path
    let best = null,
      bestScore = -1;
    for (const e of enemiesList) {
      if (e.dead) continue;
      const d = dist(this.center, e.pos);
      if (d <= s.range && e.t > bestScore) {
        best = e;
        bestScore = e.t;
      }
    }

    if (best)
      this.rot = Math.atan2(
        best.pos.y - this.center.y,
        best.pos.x - this.center.x
      );

    if (this.cool <= 0 && best) {
      this.cool = 1 / s.fireRate;
      this.fireSniperShot(best, s);
    }
  }

  fireSniperShot(target, spec) {
    const origin = this.getAttackOrigin();
    projectiles.push(new SniperBullet(origin.x, origin.y, this.rot, spec));
    spawnMuzzle(origin.x, origin.y, this.rot, spec.color);
    this.spawnSniperSmoke(origin.x, origin.y);
    this.drawLaserSight(target);
    soundManager.playSound("sniperShoot", 0.2);
  }

  spawnSniperSmoke(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = this.rot + (Math.random() - 0.5) * 0.3;
      const speed = 40 + Math.random() * 40;
      const size = 2 + Math.random() * 2;
      const life = 0.8 + Math.random() * 0.4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: size,
        life,
        c: "#888888",
        gravity: 0.05,
        fade: 0.93,
        shrink: 0.97,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    ctx.save();
    ctx.translate(x, y);

    // Shadow and base
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(4, 4, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#34495e";
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Energy lines
    ctx.strokeStyle = `rgba(45, 150, 255, ${0.4 + Math.sin(time * 2) * 0.2})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + time * 0.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 7);
      ctx.lineTo(Math.cos(angle + 0.5) * 22, Math.sin(angle + 0.5) * 10);
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(this.rot);

    // Weapon mount
    ctx.fillStyle = "#5d6d7e";
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 5);
    ctx.fill();
    ctx.strokeStyle = "#4a5458";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Barrel
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.roundRect(-10, -5, 60, 10, 3);
    ctx.fill();
    ctx.strokeStyle = "#1a1f21";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Muzzle
    ctx.fillStyle = "#2b4ff2";
    ctx.beginPath();
    ctx.arc(50, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(50, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Scope
    ctx.fillStyle = "#34495e";
    ctx.beginPath();
    ctx.roundRect(10, -15, 15, 10, 3);
    ctx.fill();
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(45, 150, 255, 0.7)";
    ctx.beginPath();
    ctx.ellipse(18, -10, 4, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(16, -12, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, 0, 28);

    ctx.restore();

    if (this.cool > 0.1) this.drawLaserSight();
  }

  drawLaserSight(target = null) {
    const s = this.spec();
    const { x, y } = this.center;
    const angle = this.rot;
    let endX, endY;

    if (target) {
      endX = target.pos.x;
      endY = target.pos.y;
    } else {
      endX = x + Math.cos(angle) * s.range;
      endY = y + Math.sin(angle) * s.range;
    }

    ctx.strokeStyle = `rgba(255, 50, 50, 0.4)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (target) {
      ctx.fillStyle = "rgba(255, 50, 50, 0.6)";
      ctx.beginPath();
      ctx.arc(endX, endY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
