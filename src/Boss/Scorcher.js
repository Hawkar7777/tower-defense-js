import { ctx } from "../core.js";
import { dist } from "../utils.js";
import { state, towers, projectiles } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { spawnExplosion } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js";
import { pointAt } from "../path.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class Scorcher extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Scorcher;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    // Initialize stats from the config file
    this.attackRange = bossType.attackRange;
    this.attackDamage = bossType.attackDamage * difficultyMult;
    this.attackRate = bossType.attackRate;
    this.aoeRadius = bossType.aoeRadius; // New AoE stat

    // State variables
    this.attackCooldown = 1 / this.attackRate; // Start ready to fire
    this.targetTower = null;
    this.launcherRotation = 0;
  }

  findTargetTower() {
    let closestTower = null;
    let minDistance = Infinity;
    for (const tower of towers) {
      if (tower.hp > 0) {
        const d = dist(this.pos, tower.center);
        if (d < this.attackRange && d < minDistance) {
          minDistance = d;
          closestTower = tower;
        }
      }
    }
    return closestTower;
  }

  update(dt) {
    super.update(dt);
    if (this.dead) return;

    this.attackCooldown -= dt;

    if (
      !this.targetTower ||
      this.targetTower.hp <= 0 ||
      dist(this.pos, this.targetTower.center) > this.attackRange
    ) {
      this.targetTower = this.findTargetTower();
    }

    if (this.targetTower) {
      const targetPos = this.targetTower.center;
      this.launcherRotation = Math.atan2(
        targetPos.y - this.pos.y,
        targetPos.x - this.pos.x
      );

      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1 / this.attackRate;
        this.shootTower(this.targetTower);
      }
    }
  }

  shootTower(target) {
    soundManager.playSound("scorcherMissle", 0.3);

    // Fire from the launcher's position, not the center of the vehicle
    const launcherCenter = {
      x: this.pos.x + Math.cos(this.launcherRotation - 0.1) * (this.r * 1.1),
      y: this.pos.y + Math.sin(this.launcherRotation - 0.1) * (this.r * 1.1),
    };

    const missile = {
      x: launcherCenter.x,
      y: launcherCenter.y,
      target: target,
      speed: 200, // Missiles are slower than bullets
      damage: this.attackDamage,
      aoeRadius: this.aoeRadius,
      rotation: 0,
      dead: false,
      isEnemyProjectile: true,

      update: function (dt) {
        if (this.target.hp <= 0 || this.dead) {
          this.dead = true;
          return;
        }
        const dx = this.target.center.x - this.x;
        const dy = this.target.center.y - this.y;
        this.rotation = Math.atan2(dy, dx);
        const d = Math.hypot(dx, dy);

        if (d < 10) {
          this.dead = true;

          // Play explosion sound on hit
          soundManager.playSound("scorcherExplode", 0.3);

          // Spawn visual explosion and apply AoE damage
          spawnExplosion(this.x, this.y, this.aoeRadius, "#ff8c00");

          const destroyedTowers = [];
          for (const tower of towers) {
            if (dist(this, tower.center) <= this.aoeRadius) {
              tower.hp -= this.damage;
              if (tower.hp <= 0) {
                destroyedTowers.push(tower);
              }
            }
          }

          if (destroyedTowers.length > 0) {
            for (let i = towers.length - 1; i >= 0; i--) {
              if (destroyedTowers.includes(towers[i])) {
                towers.splice(i, 1);
              }
            }
            updateOccupiedCells();
          }
        } else {
          this.x += (dx / d) * this.speed * dt;
          this.y += (dy / d) * this.speed * dt;
        }
      },
      draw: function () {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = "rgba(0,0,0,0.5)"; // Shadow
        ctx.beginPath();
        ctx.ellipse(-2, 2, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        const glowSize = Math.random() * 6 + 6; // Brighter trail
        const grd = ctx.createRadialGradient(-15, 0, 1, -15, 0, glowSize * 1.5);
        grd.addColorStop(0, "#ffffff");
        grd.addColorStop(0.3, "#ffcc00");
        grd.addColorStop(1, "rgba(255, 100, 0, 0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(-15, 0, glowSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#aaa";
        ctx.fillRect(-12, -4, 24, 8);
        ctx.fillStyle = "#d00";
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(18, 0);
        ctx.lineTo(12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      },
    };
    projectiles.push(missile);
  }

  // --- NEW "VERY NICE" HIGH-DETAIL DRAW METHOD (with HP number under the bar) ---
  draw() {
    // Draw the health bar (via BaseBoss)
    super.draw();
    if (this.dead) return;

    // --- Numeric HP under the health bar (Warlock-style placement) ---
    const { x, y } = this.pos;
    const w = 55,
      h = 6;
    const barY = y - this.r - 18; // same placement as Warlock
    const hpText = `${Math.round(this.hp)}/${Math.round(this.maxHp)}`;
    const textY = barY + h + 10; // place just under the bar

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dark stroke for readability
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(hpText, x, textY);

    // White fill on top
    ctx.fillStyle = "#fff";
    ctx.fillText(hpText, x, textY);

    // --- The rest of the Scorcher drawing (vehicle, launcher, etc.) ---
    const r = this.r;

    const lookAheadPos = pointAt(this.t + 0.01);
    const bodyRotation = Math.atan2(lookAheadPos.y - y, lookAheadPos.x - x);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bodyRotation);

    // --- Shadow ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 6, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Treads ---
    const treadWidth = r * 0.4;
    const treadY = r * 0.7;
    // Outer tread shape
    ctx.fillStyle = "#333";
    ctx.fillRect(-r * 0.9, -treadY - treadWidth / 2, r * 1.8, treadWidth);
    ctx.fillRect(-r * 0.9, treadY - treadWidth / 2, r * 1.8, treadWidth);
    // Inner road wheels for detail
    ctx.fillStyle = "#444";
    for (let i = 0; i < 5; i++) {
      const wheelX = -r * 0.7 + i * (r * 0.35);
      ctx.beginPath();
      ctx.arc(wheelX, -treadY, r * 0.15, 0, Math.PI * 2);
      ctx.arc(wheelX, treadY, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Main Hull ---
    ctx.strokeStyle = "#1a1e0b";
    ctx.lineWidth = 3;
    // Bottom layer (darker)
    ctx.fillStyle = this.detailColor;
    ctx.beginPath();
    ctx.moveTo(r, -r * 0.5);
    ctx.lineTo(-r * 0.8, -r * 0.6);
    ctx.lineTo(-r * 0.8, r * 0.6);
    ctx.lineTo(r, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top layer (main color)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(r * 0.9, -r * 0.4);
    ctx.lineTo(-r * 0.7, -r * 0.5);
    ctx.lineTo(-r * 0.7, r * 0.5);
    ctx.lineTo(r * 0.9, r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Cabin & Details ---
    ctx.fillStyle = this.detailColor;
    ctx.fillRect(r * 0.3, -r * 0.35, r * 0.4, r * 0.7); // Cabin block
    ctx.fillStyle = "rgba(50, 150, 255, 0.4)";
    ctx.fillRect(r * 0.68, -r * 0.3, 4, r * 0.6); // Viewport slit

    // Vents
    ctx.fillStyle = "#222";
    ctx.fillRect(-r * 0.6, -r * 0.4, 15, 8);
    ctx.fillRect(-r * 0.6, r * 0.4 - 8, 15, 8);

    // Antenna
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.4);
    ctx.lineTo(-r * 0.4, -r * 0.4 - 20);
    ctx.stroke();

    // --- Missile Launcher ---
    ctx.save();
    ctx.rotate(this.launcherRotation - bodyRotation);
    const launcherX = -r * 0.1;
    const launcherY = 0;

    // Turret Base
    ctx.fillStyle = this.detailColor;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(launcherX, launcherY, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rocket Pod (angled up)
    ctx.translate(launcherX, launcherY);
    ctx.rotate(-0.2);

    // Pod Casing
    ctx.fillStyle = this.color;
    ctx.strokeRect(0, -r * 0.3, r * 1.2, r * 0.6);
    ctx.fillRect(0, -r * 0.3, r * 1.2, r * 0.6);

    // Individual Rocket Tubes
    ctx.fillStyle = "#222";
    const tubeY = r * 0.15;
    const tubeXOffset = r * 0.2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(tubeXOffset + i * tubeXOffset, -tubeY, 5, 0, Math.PI * 2);
      ctx.arc(tubeXOffset + i * tubeXOffset, tubeY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // Restore from launcher rotation
    ctx.restore(); // Restore from body rotation
  }
}
