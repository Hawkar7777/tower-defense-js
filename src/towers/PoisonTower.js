// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\PoisonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnPoisonCloud } from "../effects.js";

export class PoisonTower extends BaseTower {
  static SPEC = {
    name: "Poison Tower",
    cost: 190,
    range: 110,
    fireRate: 1.5,
    dmg: 15,
    dotDamage: 8,
    dotDuration: 4,
    spreadRange: 60,
    cloudDuration: 3,
    color: "#4CAF50",
  };

  // Override spec to include poison properties
  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.35;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.08),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: base.dmg * mult,
      dotDamage: base.dotDamage * mult,
      dotDuration: base.dotDuration * (1 + (this.level - 1) * 0.1),
      spreadRange: base.spreadRange * (1 + (this.level - 1) * 0.05),
      cloudDuration: base.cloudDuration * (1 + (this.level - 1) * 0.1),
      color: base.color,
      cost: base.cost,
    };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    if (this.cool <= 0) {
      let best = null;
      let bestScore = -1;

      for (const e of enemiesList) {
        if (e.dead || e.poisoned) continue; // Don't target already poisoned enemies
        const p = e.pos;
        const d = dist(this.center, p);
        if (d <= s.range && e.t > bestScore) {
          best = e;
          bestScore = e.t;
        }
      }

      if (best) {
        this.cool = 1 / s.fireRate;
        this.rot = Math.atan2(
          best.pos.y - this.center.y,
          best.pos.x - this.center.x
        );
        this.firePoison(best, s);
      }
    }
  }

  firePoison(target, spec) {
    const c = this.center;

    // Initial damage
    target.damage(spec.dmg);

    // Apply poison effect
    this.applyPoisonEffect(target, spec);

    // Create poison cloud at target location
    spawnPoisonCloud(
      target.pos.x,
      target.pos.y,
      spec.cloudDuration,
      spec.spreadRange
    );

    // Visual effects
    this.spawnPoisonParticles(c.x, c.y, target.pos.x, target.pos.y);
    this.spawnDrippingEffect(c.x, c.y);
  }

  applyPoisonEffect(enemy, spec) {
    if (enemy.poisoned) return; // Already poisoned

    enemy.poisoned = true;
    enemy.poisonDamage = spec.dotDamage;
    enemy.poisonDuration = spec.dotDuration;
    enemy.poisonStartTime = performance.now();

    // Start poison damage tick
    const poisonInterval = setInterval(() => {
      if (enemy.dead || !enemy.poisoned) {
        clearInterval(poisonInterval);
        return;
      }

      const elapsed = (performance.now() - enemy.poisonStartTime) / 1000;
      if (elapsed >= enemy.poisonDuration) {
        enemy.poisoned = false;
        clearInterval(poisonInterval);
        return;
      }

      // Apply damage
      enemy.damage(enemy.poisonDamage / 4); // Damage 4 times per second

      // Chance to spread to nearby enemies
      if (Math.random() < 0.2) {
        // 20% chance per tick to spread
        this.spreadPoison(enemy, spec);
      }
    }, 250); // Tick 4 times per second
  }

  spreadPoison(sourceEnemy, spec) {
    for (const e of enemies) {
      if (e.dead || e.poisoned || e === sourceEnemy) continue;

      const d = dist(sourceEnemy.pos, e.pos);
      if (d <= spec.spreadRange) {
        this.applyPoisonEffect(e, spec);
        spawnPoisonCloud(
          e.pos.x,
          e.pos.y,
          spec.cloudDuration / 2,
          spec.spreadRange / 2
        );
        break; // Only spread to one enemy at a time
      }
    }
  }

  spawnPoisonParticles(startX, startY, endX, endY) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.atan2(endY - startY, endX - startX);
      const spread = (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 80;
      const size = 2 + Math.random() * 2;
      const life = 0.8 + Math.random() * 0.4;

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        life,
        r: size,
        c: "#4CAF50",
        gravity: 0.3,
        fade: 0.9,
      });
    }
  }

  spawnDrippingEffect(x, y) {
    // Create dripping poison effect from tower
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI - Math.PI / 2; // Mostly downward
      const speed = 40 + Math.random() * 30;
      const size = 1.5 + Math.random() * 1.5;
      const life = 1 + Math.random() * 0.5;

      particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 15,
        vx: Math.cos(angle) * speed * 0.3,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#388E3C",
        gravity: 0.5,
        fade: 0.95,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw toxic base platform
    ctx.fillStyle = "#1a261a";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Toxic glow effect
    const pulse = Math.sin(time * 3) * 0.2 + 0.8;
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, 25);
    gradient.addColorStop(0, `rgba(76, 175, 80, ${0.5 * pulse})`);
    gradient.addColorStop(1, "rgba(76, 175, 80, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Platform border with toxic effect
    ctx.strokeStyle = "#2d4d2d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Draw toxic container body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Main toxic container
    ctx.fillStyle = "#2d4d2d";
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 6);
    ctx.fill();

    // Toxic liquid level (animated)
    const liquidLevel = 0.6 + Math.sin(time * 2) * 0.1;
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.roundRect(-10, 10 - liquidLevel * 20, 20, liquidLevel * 20, 4);
    ctx.fill();

    // Container details
    ctx.strokeStyle = "#388E3C";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 6);
    ctx.stroke();

    // Toxic emitter nozzle
    ctx.fillStyle = "#3d6d3d";
    ctx.beginPath();
    ctx.roundRect(8, -6, 12, 12, 3);
    ctx.fill();

    // Nozzle opening
    ctx.fillStyle = "#1a261a";
    ctx.beginPath();
    ctx.roundRect(16, -4, 4, 8, 1);
    ctx.fill();

    // Bubbles in toxic liquid
    ctx.fillStyle = "#A5D6A7";
    for (let i = 0; i < 3; i++) {
      const bubbleX = -8 + Math.random() * 16;
      const bubbleY = -5 + Math.random() * 10;
      const bubbleSize = 1 + Math.random() * 2;
      const bubblePulse = Math.sin(time * 3 + i) * 0.3 + 1;

      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleSize * bubblePulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hazard symbols
    ctx.strokeStyle = "#FFEB3B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Skull shape
    ctx.arc(0, -5, 4, 0, Math.PI * 2);
    ctx.moveTo(-3, 0);
    ctx.lineTo(3, 0);
    ctx.moveTo(-4, 2);
    ctx.lineTo(4, 2);
    ctx.stroke();

    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // Draw level indicators as toxic bubbles
    // for (let i = 0; i < this.level; i++) {
    //   const indicatorX = x - 10 + i * 6;
    //   const indicatorY = y + 22;
    //   const bubblePulse = Math.sin(time * 4 + i) * 0.5 + 1;

    //   // Bubble glow
    //   ctx.fillStyle = `rgba(76, 175, 80, ${0.4 * bubblePulse})`;
    //   ctx.beginPath();
    //   ctx.arc(indicatorX, indicatorY, 5 * bubblePulse, 0, Math.PI * 2);
    //   ctx.fill();

    //   // Main bubble
    //   ctx.fillStyle = s.color;
    //   ctx.beginPath();
    //   ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
    //   ctx.fill();

    //   // Bubble highlight
    //   ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    //   ctx.beginPath();
    //   ctx.arc(indicatorX - 1, indicatorY - 1, 1, 0, Math.PI * 2);
    //   ctx.fill();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for PoisonTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---

    // Occasional toxic bubbles rising from tower
    if (Math.random() < 0.1) {
      this.drawRisingBubble(x, y, time);
    }

    // Toxic dripping from nozzle
    if (Math.random() < 0.3) {
      this.drawToxicDrip(x, y, time);
    }
  }

  drawRisingBubble(x, y, time) {
    const bubbleX = x + (Math.random() - 0.5) * 15;
    const bubbleY = y - 20 - Math.random() * 10;
    const size = 1 + Math.random() * 1.5;

    ctx.fillStyle = "rgba(165, 214, 167, 0.8)";
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, size, 0, Math.PI * 2);
    ctx.fill();

    // Bubble highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(
      bubbleX - size * 0.3,
      bubbleY - size * 0.3,
      size * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  drawToxicDrip(x, y, time) {
    const dripX = x + 18 + (Math.random() - 0.5) * 2;
    const dripLength = 3 + Math.random() * 4;

    ctx.strokeStyle = "#388E3C";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(dripX, y - 5);
    ctx.lineTo(dripX, y - 5 - dripLength);
    ctx.stroke();

    // Drip end
    ctx.fillStyle = "#388E3C";
    ctx.beginPath();
    ctx.arc(dripX, y - 5 - dripLength, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
