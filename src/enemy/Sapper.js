import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "../enemy/enemyTypes.js";
import { state, towers, projectiles } from "../state.js";
import { dist } from "../utils.js";
import { spawnExplosion } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js";
import { ctx } from "../core.js";

let difficultyMult = () => 1 + state.wave * 0.15;

export class Sapper extends BaseEnemy {
  constructor(tier) {
    super("sapper", tier);
    const spec = ENEMY_TYPES.sapper;
    this.attackRange = spec.attackRange;
    this.attackDamage = spec.attackDamage;
    this.attackRate = spec.attackRate;
    this.attackCooldown = 0;
    this.targetTower = null;
  }

  update(dt) {
    if (this.dead) return;

    this.attackCooldown -= dt;
    let closestTower = null;
    let minDistance = Infinity;

    for (const tower of towers) {
      if (tower.hp > 0) {
        const d = dist(this.pos, tower.center);
        if (d < minDistance) {
          minDistance = d;
          closestTower = tower;
        }
      }
    }
    this.targetTower = closestTower;

    // If a tower is in range, stop and attack
    if (this.targetTower && minDistance <= this.attackRange) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1 / this.attackRate;
        this.shootTower(this.targetTower);
      }
    } else {
      // If no tower is in range, use the parent's movement logic
      super.update(dt);
    }
  }

  shootTower(tower) {
    const projectile = {
      x: this.pos.x,
      y: this.pos.y,
      target: tower,
      speed: 250,
      color: this.color,
      isEnemyProjectile: true,
      damage: this.attackDamage * difficultyMult(),
      dead: false,
      update: function (dt) {
        if (this.target.hp <= 0) {
          this.dead = true;
          return;
        }
        const dx = this.target.center.x - this.x,
          dy = this.target.center.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 10) {
          this.target.hp -= this.damage;
          this.dead = true;
          if (this.target.hp <= 0) {
            spawnExplosion(
              this.target.center.x,
              this.target.center.y,
              30,
              "#f88"
            );
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
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      },
    };
    projectiles.push(projectile);
  }

  // Override the core drawing to be a square
  drawCore() {
    const { x, y } = this.pos;
    ctx.fillStyle = "#fff";
    const eyeSize = 5 - this.tier * 0.5;
    ctx.fillRect(x - eyeSize / 2, y - eyeSize / 2, eyeSize, eyeSize);
  }
}
