import { ctx } from "../core.js";
import { dist, clamp, lerp } from "../utils.js";
import { state, towers, projectiles } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { spawnExplosion, spawnMuzzle } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js";
import { roundRect } from "../helpers.js";
import { pointAt } from "../path.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

/**
 * A redesigned Reaper boss, inspired by modern attack helicopters.
 * It features a more aggressive design and a versatile weapon system.
 */
export class Reaper extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Reaper;
    const difficultyMult = 1 + state.wave * 0.15;

    super(bossType, difficultyMult);

    // --- ENHANCED: Military-grade color scheme ---
    this.color = "#3B4D4D"; // Dark olive drab
    this.detailColor = "#2C3A3A"; // Darker accent
    this.cockpitColor = "#22A7F0"; // Reflective blue

    // --- NEW: Dual weapon system ---
    this.attackRange = 450;
    this.attackDamage = 120 * difficultyMult;
    this.attackRate = 2.0; // Fires twice per second
    this.attackCooldown = 0;
    this.targetTower = null;
    this.weaponRotation = 0;

    // --- NEW: Animation properties ---
    this.bobOffset = Math.random() * Math.PI * 2;
    this.lastRotation = 0;
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
    this.targetTower = closestTower;
  }

  update(dt) {
    super.update(dt);
    if (this.dead) return;

    soundManager.playSound("blackHawkMove", 0.1);

    this.attackCooldown -= dt;
    this.bobOffset += dt * 4; // Update bobbing animation

    this.findTargetTower();

    if (this.targetTower) {
      const targetPos = this.targetTower.center;
      const targetAngle = Math.atan2(
        targetPos.y - this.pos.y,
        targetPos.x - this.pos.x
      );
      // Smoothly rotate the weapon towards the target
      this.weaponRotation = lerp(this.weaponRotation, targetAngle, 0.1);

      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1 / this.attackRate;
        this.shootAt(this.targetTower);
      }
    }
  }

  shootAt(target) {
    soundManager.playSound("reaperShoot", 0.3);
    const muzzleOffset = this.r * 1.2;
    const muzzleX = this.pos.x + Math.cos(this.weaponRotation) * muzzleOffset;
    const muzzleY = this.pos.y + Math.sin(this.weaponRotation) * muzzleOffset;

    spawnMuzzle(muzzleX, muzzleY, this.weaponRotation, "#FFD700", 2);

    const projectile = {
      x: muzzleX,
      y: muzzleY,
      target: target,
      speed: 500,
      damage: this.attackDamage,
      dead: false,
      isEnemyProjectile: true,
      rotation: this.weaponRotation,

      update: function (dt) {
        if (!this.target || this.target.hp <= 0) {
          this.dead = true;
          return;
        }
        const dx = this.target.center.x - this.x;
        const dy = this.target.center.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d < 10) {
          this.dead = true;
          this.target.hp -= this.damage;
          spawnExplosion(this.x, this.y, 30, "#FFC300");

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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2); // Tracer round shape
        ctx.fill();
        ctx.restore();
      },
    };
    projectiles.push(projectile);
  }

  // --- DRAW METHOD REFACTORED FOR CLARITY ---
  draw() {
    // Draw base health bar and other base visuals
    super.draw();
    if (this.dead) return;

    // --- Numeric HP ABOVE the health bar (bigger bosses look better with it above) ---
    const { x, y } = this.pos;
    const w = 55,
      h = 6;
    const barY = y - this.r - 18; // base bar placement used by BaseBoss (Warlock-style)
    // place the text above the bar
    const textY = barY - h - 10;

    const hpText = `${Math.round(this.hp)}/${Math.round(this.maxHp)}`;

    ctx.font = "14px sans-serif"; // slightly larger for big boss
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dark stroke for readability
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(hpText, x, textY);

    // White fill on top
    ctx.fillStyle = "#fff";
    ctx.fillText(hpText, x, textY);

    // --- continue original drawing ---
    const r = this.r;
    const lookAheadPos = pointAt(this.t + 0.01);
    const bodyRotation = Math.atan2(lookAheadPos.y - y, lookAheadPos.x - x);

    // --- NEW: Banking effect for turns ---
    const rotationDiff = bodyRotation - this.lastRotation;
    const bankAngle = clamp(rotationDiff * 10, -0.4, 0.4);
    this.lastRotation = bodyRotation;

    ctx.save();
    ctx.translate(x, y);

    this.drawShadow(r, bodyRotation);

    // --- NEW: Bobbing animation ---
    const bob = Math.sin(this.bobOffset) * 2;
    ctx.translate(0, bob);

    ctx.rotate(bodyRotation);
    ctx.rotate(bankAngle); // Apply banking rotation

    this.drawBody(r);
    this.drawRotors(r);
    this.drawWeapons(r);

    ctx.restore();
  }

  drawShadow(r, rotation) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, this.altitude, r * 1.6, r * 0.7, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBody(r) {
    // --- Tail Boom ---
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(-r * 1.5, -r * 0.1, -r * 2.8, -r * 0.3);
    ctx.lineTo(-r * 2.9, r * 0.4);
    ctx.quadraticCurveTo(-r * 1.5, r * 0.1, -r * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Main Fuselage ---
    roundRect(
      -r * 1.4,
      -r * 0.7,
      r * 3,
      r * 1.4,
      12,
      this.color,
      true,
      "#1a1a1a"
    );

    // --- Cockpit ---
    const cockpitGrad = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
    cockpitGrad.addColorStop(0, this.cockpitColor);
    cockpitGrad.addColorStop(1, "#112");
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.moveTo(r * 1.6, 0); // Sharp nose
    ctx.quadraticCurveTo(r * 1.2, -r * 0.7, r * 0.5, -r * 0.6);
    ctx.lineTo(r * 0.2, -r * 0.6);
    ctx.lineTo(r * 0.2, r * 0.6);
    ctx.lineTo(r * 0.5, r * 0.6);
    ctx.quadraticCurveTo(r * 1.2, r * 0.7, r * 1.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Tail Fin ---
    ctx.fillStyle = this.detailColor;
    ctx.beginPath();
    ctx.moveTo(-r * 2.7, -r * 0.3);
    ctx.lineTo(-r * 3.0, -r * 0.8);
    ctx.lineTo(-r * 2.5, -r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawRotors(r) {
    // --- Tail Rotor ---
    ctx.save();
    ctx.translate(-r * 2.8, r * 0.05);
    ctx.rotate(this.animationOffset * 50);
    ctx.fillStyle = "rgba(50, 50, 50, 0.6)";
    ctx.fillRect(-r * 0.05, -r * 0.5, r * 0.1, r * 1);
    ctx.fillRect(-r * 0.5, -r * 0.05, r * 1, r * 0.1);
    ctx.restore();

    // --- Main Rotor ---
    ctx.save();
    ctx.rotate(this.animationOffset * 30);
    // Blur effect
    ctx.fillStyle = "rgba(20, 20, 20, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.2, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.ellipse(0, 0, r * 0.4, r * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Blades
    ctx.fillStyle = "#222";
    ctx.fillRect(-r * 2.2, -r * 0.15, r * 4.4, r * 0.3);
    ctx.fillRect(-r * 0.15, -r * 2.2, r * 0.3, r * 4.4);
    ctx.restore();

    // --- Rotor Hub ---
    ctx.fillStyle = this.detailColor;
    ctx.strokeStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawWeapons(r) {
    // --- Stub Wings ---
    const wingY = r * 0.9;
    roundRect(
      -r * 0.6,
      -wingY - 10,
      r,
      20,
      6,
      this.detailColor,
      true,
      "#1a1a1a"
    );
    roundRect(
      -r * 0.6,
      wingY - 10,
      r,
      20,
      6,
      this.detailColor,
      true,
      "#1a1a1a"
    );

    // --- Rocket Pods (Visual) ---
    ctx.fillStyle = "#222";
    ctx.fillRect(-r * 0.2, -wingY - 15, r * 0.5, 30);
    ctx.fillRect(-r * 0.2, wingY - 15, r * 0.5, 30);

    // --- Chin-Mounted Turret ---
    ctx.save();
    ctx.rotate(-this.lastRotation); // Counter-rotate from body
    ctx.rotate(this.weaponRotation); // Aim towards target
    ctx.fillStyle = this.detailColor;
    ctx.fillRect(r * 0.8, -4, 25, 8);
    ctx.beginPath();
    ctx.arc(r * 0.8, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
