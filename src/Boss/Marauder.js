import { ctx } from "../core.js";
import { dist } from "../utils.js";
import { state, towers, projectiles } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { spawnExplosion, spawnMuzzle } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js";
import { pointAt } from "../path.js"; // Needed for drawing rotation
import { soundManager } from "../assets/sounds/SoundManager.js";

export class Marauder extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Marauder;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    // Initialize stats from the config file
    this.attackRange = bossType.attackRange;
    this.attackDamage = bossType.attackDamage * difficultyMult;
    this.attackRate = bossType.attackRate;

    // State variables
    this.attackCooldown = 0;
    this.targetTower = null;
    this.turretRotation = 0;
  }

  // This function is identical to Juggernaut's
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
    super.update(dt); // Handles movement and leaking
    if (this.dead) return;

    soundManager.playSound("marauderMove", 0.3);

    this.attackCooldown -= dt;

    // If target is gone or out of range, find a new one
    if (
      !this.targetTower ||
      this.targetTower.hp <= 0 ||
      dist(this.pos, this.targetTower.center) > this.attackRange
    ) {
      this.targetTower = this.findTargetTower();
    }

    if (this.targetTower) {
      // Aim the turret
      const targetPos = this.targetTower.center;
      this.turretRotation = Math.atan2(
        targetPos.y - this.pos.y,
        targetPos.x - this.pos.x
      );

      // Fire if ready
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1 / this.attackRate;
        this.shootTower(this.targetTower);
      }
    }
  }

  shootTower(target) {
    soundManager.playSound("marauderRifle", 0.3);
    const muzzlePos = {
      x: this.pos.x + Math.cos(this.turretRotation) * (this.r * 1.2),
      y: this.pos.y + Math.sin(this.turretRotation) * (this.r * 1.2),
    };

    spawnMuzzle(muzzlePos.x, muzzlePos.y, this.turretRotation, this.glowColor);

    const projectile = {
      x: muzzlePos.x,
      y: muzzlePos.y,
      target: target,
      speed: 450, // Fast machine gun bullets
      damage: this.attackDamage,
      dead: false,
      isEnemyProjectile: true,

      update: function (dt) {
        if (this.target.hp <= 0) {
          this.dead = true;
          return;
        }
        const dx = this.target.center.x - this.x;
        const dy = this.target.center.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 10) {
          this.target.hp -= this.damage;
          this.dead = true;

          if (this.target.hp <= 0) {
            spawnExplosion(this.x, this.y, 25, "#fca311");
            const index = towers.indexOf(this.target);
            if (index > -1) {
              towers.splice(index, 1);
              updateOccupiedCells();
            }
          }
        } else {
          this.x += (dx / d) * this.speed * dt;
          this.y += (dy / d) * this.speed * dt;
        }
      },
      draw: function () {
        ctx.strokeStyle = "#ffdd00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        const angle = Math.atan2(
          this.target.center.y - this.y,
          this.target.center.x - this.x
        );
        ctx.lineTo(this.x - Math.cos(angle) * 7, this.y - Math.sin(angle) * 7);
        ctx.stroke();
      },
    };
    projectiles.push(projectile);
  }

  // --- NEW, HIGH-DETAIL DRAW METHOD ---
  // --- REPLACEMENT DRAW METHOD (Marauder) ---
  draw() {
    super.draw(); // Draws the health bar
    if (this.dead) return;

    const { x, y } = this.pos;
    const r = this.r;

    // --- Numeric HP under the health bar (Warlock-style position) ---
    // Match Warlock's bar placement: barY = y - r - 18
    const w = 55,
      h = 6;
    const barY = y - r - 18;
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

    // --- Continue existing Marauder drawing (truck, turret, etc.) ---
    // Make the truck body point in the direction it's moving
    const lookAheadPos = pointAt(this.t + 0.01);
    const bodyRotation = Math.atan2(lookAheadPos.y - y, lookAheadPos.x - x);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bodyRotation);

    // --- Truck Shadow ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 5, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Wheels ---
    const wheelRadius = r * 0.28;
    const wheelYOffset = r * 0.6;
    const wheelXOffset = r * 0.55;

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(wheelXOffset, -wheelYOffset, wheelRadius, 0, Math.PI * 2); // Front right
    ctx.arc(wheelXOffset, wheelYOffset, wheelRadius, 0, Math.PI * 2); // Back right
    ctx.arc(-wheelXOffset, -wheelYOffset, wheelRadius, 0, Math.PI * 2); // Front left
    ctx.arc(-wheelXOffset, wheelYOffset, wheelRadius, 0, Math.PI * 2); // Back left
    ctx.fill();

    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.arc(wheelXOffset, -wheelYOffset, wheelRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(wheelXOffset, wheelYOffset, wheelRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(-wheelXOffset, -wheelYOffset, wheelRadius * 0.5, 0, Math.PI * 2);
    ctx.arc(-wheelXOffset, wheelYOffset, wheelRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // --- Truck Body ---
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r * 0.95, -r * 0.4); // Front top corner
    ctx.lineTo(r, -r * 0.3); // Front bumper
    ctx.lineTo(r, r * 0.3); // Bottom front bumper
    ctx.lineTo(r * 0.95, r * 0.4); // Underside front
    ctx.lineTo(-r * 0.8, r * 0.5); // Main underside
    ctx.lineTo(-r, r * 0.4); // Back bumper
    ctx.lineTo(-r, -r * 0.4); // Top of truck bed
    ctx.lineTo(-r * 0.5, -r * 0.5); // Back of cabin
    ctx.lineTo(-r * 0.4, -r * 0.6); // Top back of cabin roof
    ctx.lineTo(r * 0.3, -r * 0.6); // Front of cabin roof
    ctx.lineTo(r * 0.4, -r * 0.5); // Top of hood
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Cabin Windshield ---
    ctx.fillStyle = "rgba(100, 200, 255, 0.7)";
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.5);
    ctx.lineTo(r * 0.85, -r * 0.4);
    ctx.lineTo(r * 0.85, r * 0.4);
    ctx.lineTo(r * 0.35, r * 0.5);
    ctx.closePath();
    ctx.fill();

    // --- Headlights & Taillights ---
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(r * 0.98, -r * 0.25, 4, 0, Math.PI * 2);
    ctx.arc(r * 0.98, r * 0.25, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d00";
    ctx.fillRect(-r - 1.5, -r * 0.35, 3, 6);
    ctx.fillRect(-r - 1.5, r * 0.35 - 6, 3, 6);

    // --- Turret and Gun ---
    ctx.save();
    ctx.rotate(this.turretRotation - bodyRotation);

    const turretX = -r * 0.2; // Mount the turret on the truck bed

    ctx.fillStyle = "#3d4033"; // Ammo Box
    ctx.fillRect(turretX - 20, -15, 15, 30);

    ctx.fillStyle = this.detailColor; // Turret Base
    ctx.beginPath();
    ctx.arc(turretX, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Machine Gun Barrel
    ctx.fillStyle = "#444";
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(turretX, -4);
    ctx.lineTo(turretX + r + 5, -4);
    ctx.lineTo(turretX + r + 15, -3); // Muzzle brake
    ctx.lineTo(turretX + r + 15, 3);
    ctx.lineTo(turretX + r + 5, 4);
    ctx.lineTo(turretX, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Restore from turret rotation
    ctx.restore(); // Restore from body rotation
  }
}
