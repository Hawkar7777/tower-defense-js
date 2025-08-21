// ===== FILE: FlamethrowerTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnExplosion } from "../effects.js";

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
    fuelCapacity: 500,
    color: "#FF6B35",
  };

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this.fuel = this.constructor.SPEC.fuelCapacity;
    this.refuelCooldown = 0;
    this.isFiring = false;
    this.fireStream = [];
    this.targetAngle = 0;
    this.flameThrowerEffect = 0;
    // ensure rot exists (BaseTower probably sets it; if not, default)
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
      fuelCapacity: base.fuelCapacity * (1 + (this.level - 1) * 0.2),
      color: base.color,
      cost: base.cost,
    };
  }

  // small helper to normalize angles to [-PI, PI]
  normalizeAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;
    this.refuelCooldown -= dt;
    this.flameThrowerEffect = Math.max(0, this.flameThrowerEffect - dt * 3);

    // Refuel when not firing and cooldown is ready
    if (
      !this.isFiring &&
      this.refuelCooldown <= 0 &&
      this.fuel < s.fuelCapacity
    ) {
      this.fuel = Math.min(
        s.fuelCapacity,
        this.fuel + s.fuelCapacity * dt * 0.5
      );
    }

    // 1) Collect enemies that are within range (all directions)
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

    // 2) If any in range, pick the closest and set targetAngle to it
    if (inRange.length > 0 && this.fuel > 0) {
      inRange.sort((a, b) => a.d - b.d);
      const closest = inRange[0];
      this.targetAngle = closest.angle;

      // Smoothly rotate toward targetAngle (shortest path)
      const angleDiff = this.normalizeAngle(this.targetAngle - this.rot);
      const rotateSpeed = 5; // tweak this to rotate faster / slower
      // scale by dt, but clamp to avoid overshoot when dt large
      const step = angleDiff * Math.min(1, dt * rotateSpeed);
      this.rot = this.normalizeAngle(this.rot + step);

      // 3) Now find enemies inside the cone centered on targetAngle
      const enemiesInCone = this.getEnemiesInConeByCenter(
        enemiesList,
        s,
        this.targetAngle
      );

      if (enemiesInCone.length > 0) {
        // Fire at fireRate; continuous effect handled visually when isFiring is true
        if (this.cool <= 0) {
          this.cool = 1 / s.fireRate;
          this.fireFlame(enemiesInCone, s);
        }
        this.isFiring = true;
        // consume fuel continuously while firing
        this.fuel = Math.max(0, this.fuel - dt * 20);
        this.flameThrowerEffect = 1.0;
      } else {
        this.isFiring = false;
      }
    } else {
      this.isFiring = false;
    }

    // Update fire stream particles
    this.updateFireStream(dt);
  }

  // Checks cone centered on given centerAngle (so detection is independent of current rot)
  getEnemiesInConeByCenter(enemiesList, spec, centerAngle) {
    const enemiesInCone = [];
    const center = this.center;

    for (const enemy of enemiesList) {
      if (enemy.dead) continue;

      const d = dist(center, enemy.pos);
      if (d > spec.range) continue;

      // Calculate angle to enemy
      const angleToEnemy = Math.atan2(
        enemy.pos.y - center.y,
        enemy.pos.x - center.x
      );

      // Calculate angle difference relative to the cone center (centerAngle)
      let angleDiff = angleToEnemy - centerAngle;
      // Normalize angle difference to [-π, π]
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

      // Check if enemy is within cone
      if (Math.abs(angleDiff) <= spec.coneAngle / 2) {
        enemiesInCone.push(enemy);
      }
    }

    return enemiesInCone;
  }

  // kept your original getEnemiesInCone for compatibility if other code uses it
  getEnemiesInCone(enemiesList, spec) {
    return this.getEnemiesInConeByCenter(enemiesList, spec, this.rot);
  }

  fireFlame(enemiesInCone, spec) {
    const center = this.center;
    const fuelRatio = Math.max(0, this.fuel / spec.fuelCapacity); // 0 to 1

    // Determine damage multiplier based on fuel
    let damageMultiplier = 1;
    if (fuelRatio >= 0.5) {
      damageMultiplier = 1; // full damage
    } else if (fuelRatio > 0) {
      damageMultiplier = 0.8; // 20% reduction
    } else {
      damageMultiplier = 0.5; // 50% reduction
    }

    for (const enemy of enemiesInCone) {
      const d = dist(center, enemy.pos);
      const damageFalloff = Math.max(0.3, 1 - d / spec.range);

      const finalDamage = spec.dmg * damageFalloff * damageMultiplier;
      enemy.damage(finalDamage);

      // Burn effect can also be scaled if desired
      const burnDamage = spec.burnDamage * damageMultiplier;
      this.applyBurnEffect(enemy, { ...spec, burnDamage });

      if (Math.random() < spec.spreadChance) {
        this.spreadFire(enemy, spec);
      }
    }

    this.createFireStream(center, spec);
    this.spawnFlameParticles(center, spec);
  }

  applyBurnEffect(enemy, spec) {
    if (enemy.burning) {
      // Refresh burn duration
      enemy.burnDuration = spec.burnDuration;
      return;
    }

    enemy.burning = true;
    enemy.burnDamage = spec.burnDamage;
    enemy.burnDuration = spec.burnDuration;
    enemy.burnStartTime = performance.now();

    // Start burn damage tick
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

      // Apply burn damage
      enemy.damage(enemy.burnDamage / 2); // Damage 2 times per second
    }, 500); // Tick every 0.5 seconds
  }

  spreadFire(sourceEnemy, spec) {
    for (const e of enemies) {
      if (e.dead || e.burning || e === sourceEnemy) continue;

      const d = dist(sourceEnemy.pos, e.pos);
      if (d <= spec.spreadRange) {
        this.applyBurnEffect(e, spec);
        this.spawnSpreadFireEffect(sourceEnemy.pos, e.pos);
        break; // Only spread to one enemy at a time
      }
    }
  }

  createFireStream(center, spec) {
    // Create continuous flame stream effect
    const streamLength = spec.range;
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const distance = (i / particleCount) * streamLength;
      const spread = (spec.coneAngle / 2) * (distance / streamLength); // Cone gets wider with distance

      const angle = this.rot + (Math.random() - 0.5) * spread;
      const x = center.x + Math.cos(angle) * distance;
      const y = center.y + Math.sin(angle) * distance;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * 50 + (Math.random() - 0.5) * 30,
        vy: Math.sin(angle) * 50 + (Math.random() - 0.5) * 30,
        life: 0.3 + Math.random() * 0.2,
        r: 3 + Math.random() * 2,
        c: this.getFlameColor(),
        gravity: -0.2, // Fire rises
        fade: 0.85,
      });
    }
  }

  spawnFlameParticles(center, spec) {
    for (let i = 0; i < 12; i++) {
      const angle = this.rot + (Math.random() - 0.5) * spec.coneAngle;
      const speed = 80 + Math.random() * 60;
      const distance = Math.random() * spec.range * 0.7;

      const startX = center.x + Math.cos(angle) * distance;
      const startY = center.y + Math.sin(angle) * distance;

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed * 0.5,
        vy: Math.sin(angle) * speed * 0.5,
        life: 0.4 + Math.random() * 0.3,
        r: 2 + Math.random() * 3,
        c: this.getFlameColor(),
        gravity: -0.15,
        fade: 0.9,
      });
    }
  }

  spawnSpreadFireEffect(from, to) {
    for (let i = 0; i < 6; i++) {
      const t = i / 5; // Interpolation factor
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        life: 0.5 + Math.random() * 0.3,
        r: 2 + Math.random() * 2,
        c: this.getFlameColor(),
        gravity: -0.1,
        fade: 0.9,
      });
    }
  }

  updateFireStream(dt) {
    // Clean up old fire stream particles
    this.fireStream = this.fireStream.filter((p) => p.life > 0);
  }

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

    // Fuel tank
    ctx.fillStyle = "#2a2a3a";
    ctx.beginPath();
    ctx.roundRect(-12, -10, 24, 20, 4);
    ctx.fill();

    // Fuel level indicator
    const fuelLevel = this.fuel / s.fuelCapacity;
    ctx.fillStyle =
      fuelLevel > 0.5 ? "#4CAF50" : fuelLevel > 0.25 ? "#FFC107" : "#F44336";
    ctx.beginPath();
    ctx.roundRect(-10, 8 - fuelLevel * 16, 20, fuelLevel * 16, 2);
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

    // Fuel lines
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(8, 4);
    ctx.lineTo(16, 0);
    ctx.stroke();

    // Pressure gauges
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-8, -6, 3, 0, Math.PI * 2);
    ctx.arc(8, -8, 3, 0, Math.PI * 2);
    ctx.stroke();

    // Gauge needles
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 1.5;
    const gaugeAngle = time * 3 + Math.sin(time * 5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(-8 + Math.cos(gaugeAngle) * 2, -6 + Math.sin(gaugeAngle) * 2);
    ctx.stroke();

    // Warning labels
    ctx.fillStyle = "#FFEB3B";
    ctx.fillRect(-6, 2, 3, 2);
    ctx.fillRect(4, -2, 3, 2);

    // Ignition system
    if (this.isFiring) {
      // Show active flame at nozzle
      ctx.fillStyle = this.getFlameColor();
      ctx.beginPath();
      ctx.ellipse(24, 0, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame stream
      for (let i = 1; i <= 5; i++) {
        const flameX = 24 + i * 8;
        const flameSize = 6 - i;
        const flameSpread = i * 2;

        ctx.fillStyle = this.getFlameColor();
        ctx.globalAlpha = 0.7 - i * 0.1;
        ctx.beginPath();
        ctx.ellipse(flameX, 0, flameSize, flameSpread, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Draw level indicators as fuel canisters
    for (let i = 0; i < this.level; i++) {
      const indicatorX = x - 12 + i * 6;
      const indicatorY = y + 25;

      // Canister
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.roundRect(indicatorX - 2, indicatorY - 4, 4, 8, 1);
      ctx.fill();

      // Canister top
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Flame effect for higher levels
      if (this.level > 3 && i >= this.level - 3) {
        this.drawMiniFlame(indicatorX, indicatorY - 6, time);
      }
    }

    // Draw fuel meter
    this.drawFuelMeter(x, y - 30, s);

    // Heat shimmer effect when firing
    if (this.isFiring && Math.random() < 0.3) {
      this.drawHeatShimmer(x, y, time);
    }
  }

  drawFuelMeter(x, y, spec) {
    const fuelPercent = this.fuel / spec.fuelCapacity;
    const meterWidth = 30;
    const meterHeight = 4;

    // Meter background
    ctx.fillStyle = "#333";
    ctx.fillRect(x - meterWidth / 2, y, meterWidth, meterHeight);

    // Fuel level
    const fuelColor =
      fuelPercent > 0.5
        ? "#4CAF50"
        : fuelPercent > 0.25
        ? "#FFC107"
        : "#F44336";
    ctx.fillStyle = fuelColor;
    ctx.fillRect(x - meterWidth / 2, y, meterWidth * fuelPercent, meterHeight);

    // Meter border
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - meterWidth / 2, y, meterWidth, meterHeight);
  }

  drawMiniFlame(x, y, time) {
    const flameHeight = 3 + Math.sin(time * 10) * 1;

    ctx.fillStyle = "#FF6B35";
    ctx.beginPath();
    ctx.ellipse(x, y, 1.5, flameHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.ellipse(
      x,
      y + flameHeight * 0.3,
      0.8,
      flameHeight * 0.6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

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
