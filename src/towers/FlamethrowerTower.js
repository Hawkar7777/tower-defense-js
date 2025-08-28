// ===== FILE: FlamethrowerTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnExplosion } from "../effects.js";
import { soundManager } from "../assets/sounds/SoundManager.js"; // Import the sound manager

export class FlamethrowerTower extends BaseTower {
  static SPEC = {
    name: "Flamethrower",
    cost: 140,
    range: 80,
    fireRate: 15, // High fire rate for continuous stream
    dmg: 8,
    burnDamage: 6,
    burnDuration: 3,
    coneAngle: Math.PI / 3, // 60 degree cone
    spreadChance: 0.4,
    spreadRange: 40,
    // fuelCapacity: 500, // Removed fuel capacity
    color: "#FF6B35",
  };

  constructor(gx, gy, key) {
    super(gx, gy, key);
    // this.fuel = this.constructor.SPEC.fuelCapacity; // Removed fuel property
    // this.refuelCooldown = 0; // Removed refuel cooldown
    this.isFiring = false;
    // this.fireStream = []; // Not explicitly needed with new particle approach
    this.targetAngle = 0;
    this.flameThrowerEffect = 0;
    if (this.rot === undefined) this.rot = 0;
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.4; // Higher multiplier for damage
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.1),
      fireRate: base.fireRate * 1,
      dmg: base.dmg * mult,
      burnDamage: base.burnDamage * mult,
      burnDuration: base.burnDuration * (1 + (this.level - 1) * 0.1),
      coneAngle: base.coneAngle + (this.level - 1) * 0.05, // Wider cone at higher levels
      spreadChance: base.spreadChance + (this.level - 1) * 0.05,
      spreadRange: base.spreadRange * (1 + (this.level - 1) * 0.05),
      // fuelCapacity: base.fuelCapacity * (1 + (this.level - 1) * 0.2), // Removed fuel scaling
      color: base.color,
      cost: base.cost,
    };
  }

  normalizeAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  update(dt, enemiesList) {

    // If hexed, don't do any GunTower-specific logic
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;
    // this.refuelCooldown -= dt; // Removed refuel cooldown update
    this.flameThrowerEffect = Math.max(0, this.flameThrowerEffect - dt * 3);

    // No refueling logic needed

    const inRange = [];
    const center = this.center;
    for (const enemy of enemiesList) {
      if (enemy.dead) continue;
      const d = dist(center, enemy.pos);
      if (d <= s.range) {
        const angle = Math.atan2(
          enemy.pos.y - center.y,
          enemy.pos.x - center.x
        );
        inRange.push({ enemy, d, angle });
      }
    }

    // Fire continuously if targets are in range
    if (inRange.length > 0) {
      // Removed fuel check here
      inRange.sort((a, b) => a.d - b.d);
      const closest = inRange[0];
      this.targetAngle = closest.angle;

      const angleDiff = this.normalizeAngle(this.targetAngle - this.rot);
      const rotateSpeed = 5;
      const step = angleDiff * Math.min(1, dt * rotateSpeed);
      this.rot = this.normalizeAngle(this.rot + step);

      const enemiesInCone = this.getEnemiesInConeByCenter(
        enemiesList,
        s,
        this.targetAngle
      );

      if (enemiesInCone.length > 0) {
        if (this.cool <= 0) {
          this.cool = 1 / s.fireRate;
          this.fireFlame(enemiesInCone, s);
        }
        this.isFiring = true;
        // No fuel consumption
        this.flameThrowerEffect = 1.0;
      } else {
        this.isFiring = false;
      }
    } else {
      this.isFiring = false;
    }

    // No fire stream update needed if using the direct draw flame
    // this.updateFireStream(dt);
  }

  getEnemiesInConeByCenter(enemiesList, spec, centerAngle) {
    const enemiesInCone = [];
    const center = this.center;

    for (const enemy of enemiesList) {
      if (enemy.dead) continue;

      const d = dist(center, enemy.pos);
      if (d > spec.range) continue;

      const angleToEnemy = Math.atan2(
        enemy.pos.y - center.y,
        enemy.pos.x - center.x
      );

      let angleDiff = angleToEnemy - centerAngle;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

      if (Math.abs(angleDiff) <= spec.coneAngle / 2) {
        enemiesInCone.push(enemy);
      }
    }
    return enemiesInCone;
  }

  getEnemiesInCone(enemiesList, spec) {
    return this.getEnemiesInConeByCenter(enemiesList, spec, this.rot);
  }

  fireFlame(enemiesInCone, spec) {
    const center = this.center;
    // Removed fuelRatio and damageMultiplier

    for (const enemy of enemiesInCone) {
      const d = dist(center, enemy.pos);
      const damageFalloff = Math.max(0.3, 1 - d / spec.range);

      const finalDamage = spec.dmg * damageFalloff; // Removed damageMultiplier
      enemy.damage(finalDamage);

      const burnDamage = spec.burnDamage; // Removed damageMultiplier
      this.applyBurnEffect(enemy, { ...spec, burnDamage });

      if (Math.random() < spec.spreadChance) {
        this.spreadFire(enemy, spec);
      }
    }

    this.createFireStream(center, spec);
    this.spawnFlameParticles(center, spec);

    // Use the sound manager to play the flamethrower sound
    soundManager.playSound("flameThrougherShoot", 0.15); // Play sound via manager with specific volume
  }

  applyBurnEffect(enemy, spec) {
    if (enemy.burning) {
      enemy.burnDuration = spec.burnDuration;
      return;
    }

    enemy.burning = true;
    enemy.burnDamage = spec.burnDamage;
    enemy.burnDuration = spec.burnDuration;
    enemy.burnStartTime = performance.now();

    const burnInterval = setInterval(() => {
      if (enemy.dead || !enemy.burning) {
        clearInterval(burnInterval);
        return;
      }

      const elapsed = (performance.now() - enemy.burnStartTime) / 1000;
      if (elapsed >= enemy.burnDuration) {
        enemy.burning = false;
        clearInterval(burnInterval);
        return;
      }

      enemy.damage(enemy.burnDamage / 2);
    }, 500);
  }

  spreadFire(sourceEnemy, spec) {
    for (const e of enemies) {
      if (e.dead || e.burning || e === sourceEnemy) continue;

      const d = dist(sourceEnemy.pos, e.pos);
      if (d <= spec.spreadRange) {
        this.applyBurnEffect(e, spec);
        this.spawnSpreadFireEffect(sourceEnemy.pos, e.pos);
        break;
      }
    }
  }

  createFireStream(center, spec) {
    const streamLength = spec.range;
    const particleCount = 8; // More dense particles for a better stream feel

    for (let i = 0; i < particleCount; i++) {
      const distance = (i / particleCount) * streamLength;
      const spread = (spec.coneAngle / 2) * (distance / streamLength);

      const angle = this.rot + (Math.random() - 0.5) * spread;
      const x = center.x + Math.cos(angle) * 20; // Start closer to nozzle
      const y = center.y + Math.sin(angle) * 20;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * 80 + (Math.random() - 0.5) * 40, // Stronger initial push
        vy: Math.sin(angle) * 80 + (Math.random() - 0.5) * 40,
        life: 0.4 + Math.random() * 0.3,
        r: 4 + Math.random() * 3, // Larger particles
        c: this.getFlameColor(),
        gravity: -0.2,
        fade: 0.85,
      });
    }
  }

  spawnFlameParticles(center, spec) {
    for (let i = 0; i < 15; i++) {
      // Increased particle count
      const angle = this.rot + (Math.random() - 0.5) * spec.coneAngle * 0.8; // Confine spread slightly
      const speed = 100 + Math.random() * 80; // Faster particles
      const distance = Math.random() * spec.range * 0.9;

      const startX = center.x + Math.cos(angle) * 15; // Start closer to nozzle
      const startY = center.y + Math.sin(angle) * 15;

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * 0.7,
        vy: Math.sin(angle) * speed * 0.7,
        life: 0.5 + Math.random() * 0.4,
        r: 3 + Math.random() * 3,
        c: this.getFlameColor(),
        gravity: -0.15,
        fade: 0.88,
      });
    }
  }

  spawnSpreadFireEffect(from, to) {
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        life: 0.6 + Math.random() * 0.4,
        r: 3 + Math.random() * 3,
        c: this.getFlameColor(),
        gravity: -0.1,
        fade: 0.85,
      });
    }
  }

  // updateFireStream is no longer needed if flame stream is entirely particle-based
  // updateFireStream(dt) {
  //   this.fireStream = this.fireStream.filter((p) => p.life > 0);
  // }

  getFlameColor() {
    const colors = ["#FF6B35", "#FF8C42", "#FF4500", "#FFA500", "#FFFF00"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw industrial base platform
    ctx.fillStyle = "#2a1a1a";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Heat glow effect when firing
    if (this.flameThrowerEffect > 0) {
      const intensity = this.flameThrowerEffect;
      const gradient = ctx.createRadialGradient(x, y, 10, x, y, 30);
      gradient.addColorStop(0, `rgba(255, 107, 53, ${0.6 * intensity})`);
      gradient.addColorStop(1, "rgba(255, 107, 53, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Platform border
    ctx.strokeStyle = "#4d3d3d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Draw flamethrower body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Main body - industrial tank design
    ctx.fillStyle = "#3a3a4a";
    ctx.beginPath();
    ctx.roundRect(-14, -12, 28, 24, 6);
    ctx.fill();

    // Tank details
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1.5;
    for (let i = -6; i <= 6; i += 4) {
      ctx.beginPath();
      ctx.arc(0, i, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Flamethrower nozzle
    ctx.fillStyle = "#4a4a5a";
    ctx.beginPath();
    ctx.roundRect(8, -6, 14, 12, 3);
    ctx.fill();

    // Nozzle tip
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath();
    ctx.ellipse(22, 0, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pilot light (always on)
    ctx.fillStyle = "#0066FF";
    ctx.beginPath();
    ctx.arc(20, -8, 2, 0, Math.PI * 2);
    ctx.fill();

    // Fuel lines (kept for design aesthetic, no actual fuel function)
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(8, 4);
    ctx.lineTo(16, 0);
    ctx.stroke();

    // Pressure gauges (kept for design aesthetic)
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-8, -6, 3, 0, Math.PI * 2);
    ctx.arc(8, -8, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Gauge needles (kept for design aesthetic)
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 1.5;
    const gaugeAngle = time * 3 + Math.sin(time * 5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-8 + Math.cos(gaugeAngle) * 2, -6 + Math.sin(gaugeAngle) * 2);
    ctx.stroke();

    // Warning labels (kept for design aesthetic)
    ctx.fillStyle = "#FFEB3B";
    ctx.fillRect(-6, 2, 3, 2);
    ctx.fillRect(4, -2, 3, 2);

    // --- NEW: Dynamic Flame Visual at Nozzle ---
    if (this.isFiring) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter"; // Blending for fire effects
      ctx.translate(22, 0); // Start at nozzle tip

      const flameLength = s.range * 0.7; // Visual length of the flame
      const baseWidth = 10; // Width at the nozzle

      // Outer, wider flame (orange/red)
      const outerFlameGrad = ctx.createLinearGradient(0, 0, flameLength, 0);
      outerFlameGrad.addColorStop(0, this.getFlameColor());
      outerFlameGrad.addColorStop(1, "rgba(255, 69, 0, 0)"); // Fades to transparent red
      ctx.fillStyle = outerFlameGrad;
      ctx.beginPath();
      ctx.moveTo(0, -baseWidth / 2);
      ctx.quadraticCurveTo(flameLength * 0.5, -baseWidth * 0.8, flameLength, 0);
      ctx.quadraticCurveTo(
        flameLength * 0.5,
        baseWidth * 0.8,
        0,
        baseWidth / 2
      );
      ctx.closePath();
      ctx.fill();

      // Inner, brighter flame (yellow/white)
      const innerFlameGrad = ctx.createLinearGradient(
        0,
        0,
        flameLength * 0.7,
        0
      );
      innerFlameGrad.addColorStop(0, "rgba(255, 255, 100, 1)"); // Bright yellow
      innerFlameGrad.addColorStop(1, "rgba(255, 165, 0, 0)"); // Fades to transparent orange
      ctx.fillStyle = innerFlameGrad;
      ctx.beginPath();
      ctx.moveTo(0, -baseWidth / 4);
      ctx.quadraticCurveTo(
        flameLength * 0.3,
        -baseWidth * 0.5,
        flameLength * 0.7,
        0
      );
      ctx.quadraticCurveTo(
        flameLength * 0.3,
        baseWidth * 0.5,
        0,
        baseWidth / 4
      );
      ctx.closePath();
      ctx.fill();

      ctx.restore(); // End dynamic flame save
      ctx.globalCompositeOperation = "source-over"; // Reset blend mode
    }

    ctx.restore(); // End main tower rotation save

    // Display Level as Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);

    // Heat shimmer effect when firing
    if (this.isFiring && Math.random() < 0.3) {
      this.drawHeatShimmer(x, y, time);
    }
  }

  // drawFuelMeter removed as fuel functionality is removed
  // drawMiniFlame removed as its style is replaced

  drawHeatShimmer(x, y, time) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 3; i++) {
      const shimmerX = x + (Math.random() - 0.5) * 40;
      const shimmerY = y - 10 - i * 8;
      const wave = Math.sin(time * 15 + i) * 3;

      ctx.beginPath();
      ctx.moveTo(shimmerX, shimmerY);
      ctx.quadraticCurveTo(
        shimmerX + wave,
        shimmerY - 8,
        shimmerX,
        shimmerY - 16
      );
      ctx.stroke();
    }
  }
}
