import { ctx } from "../core.js";
import { clamp, dist } from "../utils.js";
// --- CHANGE 1: Import 'towers' and 'updateOccupiedCells' ---
import { state, towers, projectiles } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { spawnExplosion } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js"; // Needed for when towers are destroyed

export class Juggernaut extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Juggernaut;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    this.attackRange = bossType.attackRange;
    this.attackDamage = bossType.attackDamage * difficultyMult;
    this.attackRate = bossType.attackRate;
    this.attackCooldown = 0;
    // --- CHANGE 2: Rename target variable ---
    this.targetTower = null;
    this.turretRotation = 0;
  }

  // --- CHANGE 3: Logic now finds towers, not enemies ---
  findTargetTower() {
    let closestTower = null;
    let minDistance = Infinity;

    for (const tower of towers) {
      if (tower.hp > 0) {
        // Make sure the tower is not already destroyed
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
    super.update(dt); // This handles movement
    if (this.dead) return;

    this.attackCooldown -= dt;
    this.targetTower = this.findTargetTower();

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

  // --- CHANGE 4: Logic now shoots towers, using Sapper's projectile as a base ---
  shootTower(target) {
    const projectile = {
      x: this.pos.x,
      y: this.pos.y,
      target: target,
      speed: 300,
      damage: this.attackDamage,
      dead: false,
      // Use the 'isEnemyProjectile' flag so the main loop can handle it
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
          spawnExplosion(this.x, this.y, 20, "#fca311");

          // Handle tower destruction
          if (this.target.hp <= 0) {
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
        ctx.fillStyle = "#fca311";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
      },
    };
    projectiles.push(projectile);
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.turretRotation);
    ctx.fillStyle = this.detailColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.fillRect(0, -5, this.r, 10);
    ctx.restore();

    const w = 60,
      h = 7;
    const barY = y - this.r - 24;
    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle =
      hpPercent > 0.5 ? "#6f6" : hpPercent > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);
  }
}
