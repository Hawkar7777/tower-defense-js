// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\TeslaTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies } from "../state.js";
import { spawnLightningArc, spawnElectricExplosion } from "../effects.js";
import { particles } from "../state.js";
import { dist } from "../utils.js";

export class TeslaTower extends BaseTower {
  static SPEC = {
    name: "Tesla Tower",
    cost: 300,
    range: 140,
    fireRate: 1.3,
    dmg: 25,
    chainCount: 3,
    chainRange: 80,
    stunChance: 0.3,
    stunDuration: 1.5,
    color: "#9d4edd",
  };

  // Override spec to include tesla properties
  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.35;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.08),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: base.dmg * mult,
      chainCount: base.chainCount + Math.floor(this.level / 2), // +1 chain every 2 levels
      chainRange: base.chainRange * (1 + (this.level - 1) * 0.05),
      stunChance: base.stunChance + (this.level - 1) * 0.05,
      stunDuration: base.stunDuration * (1 + (this.level - 1) * 0.1),
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
        if (e.dead) continue;
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
        this.fireLightning(best, s);
      }
    }
  }

  fireLightning(primaryTarget, spec) {
    const c = this.center;
    const hitEnemies = new Set([primaryTarget]);

    // Damage primary target
    primaryTarget.damage(spec.dmg);
    this.applyStun(primaryTarget, spec);

    // Create primary lightning arc
    spawnLightningArc(c, primaryTarget.pos, spec.color);
    spawnElectricExplosion(primaryTarget.pos.x, primaryTarget.pos.y);

    // Chain to additional targets
    let currentTarget = primaryTarget;
    for (let i = 0; i < spec.chainCount; i++) {
      const nextTarget = this.findNextChainTarget(
        currentTarget,
        hitEnemies,
        spec.chainRange
      );
      if (!nextTarget) break;

      // Damage chained target (reduced damage)
      const chainDmg = spec.dmg * (0.6 - i * 0.1); // 60%, 50%, 40%, etc.
      nextTarget.damage(chainDmg);
      this.applyStun(nextTarget, spec);

      // Create chain lightning arc
      spawnLightningArc(currentTarget.pos, nextTarget.pos, spec.color);
      spawnElectricExplosion(nextTarget.pos.x, nextTarget.pos.y);

      hitEnemies.add(nextTarget);
      currentTarget = nextTarget;
    }

    // Visual effects on the tower itself
    this.spawnElectricParticles(c.x, c.y);
  }

  findNextChainTarget(currentTarget, hitEnemies, chainRange) {
    let bestTarget = null;
    let bestDistance = Infinity;

    for (const e of enemies) {
      if (e.dead || hitEnemies.has(e)) continue;

      const d = dist(currentTarget.pos, e.pos);
      if (d <= chainRange && d < bestDistance) {
        bestTarget = e;
        bestDistance = d;
      }
    }

    return bestTarget;
  }

  applyStun(enemy, spec) {
    if (Math.random() < spec.stunChance && !enemy.stunned) {
      enemy.stunned = true;
      enemy.originalSpeed = enemy.speed;
      enemy.speed = 0;

      // Set timeout to remove stun
      setTimeout(() => {
        if (!enemy.dead) {
          enemy.stunned = false;
          enemy.speed = enemy.originalSpeed;
          enemy.electricEffect = false;
        }
      }, spec.stunDuration * 1000);

      enemy.electricEffect = true;
      enemy.electricEffectTime = spec.stunDuration;
    }
  }

  spawnElectricParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const size = 1 + Math.random() * 2;
      const life = 0.3 + Math.random() * 0.2;

      // Use the imported particles array instead of window.particles
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#e0aaff",
        gravity: 0.1,
        fade: 0.9,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw electrified base platform
    ctx.fillStyle = "#1a1426";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Electric glow effect
    const pulse = Math.sin(time * 5) * 0.2 + 0.8;
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, 25);
    gradient.addColorStop(0, `rgba(157, 78, 221, ${0.6 * pulse})`);
    gradient.addColorStop(1, "rgba(157, 78, 221, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Platform border with electric effect
    ctx.strokeStyle = "#5a2d91";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Tesla coil body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Main coil base
    ctx.fillStyle = "#2a1a3a";
    ctx.beginPath();
    ctx.roundRect(-12, -14, 24, 28, 8);
    ctx.fill();

    // Tesla coil primary
    ctx.fillStyle = "#3a2a4a";
    ctx.beginPath();
    ctx.roundRect(-8, -16, 16, 32, 6);
    ctx.fill();

    // Coil windings
    ctx.strokeStyle = "#7d5ba6";
    ctx.lineWidth = 2;
    for (let i = -12; i <= 12; i += 4) {
      ctx.beginPath();
      ctx.arc(0, i, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Top electrode (Tesla ball)
    ctx.fillStyle = "#e0aaff";
    ctx.beginPath();
    ctx.arc(0, -20, 6, 0, Math.PI * 2);
    ctx.fill();

    // Electric arc effect from top electrode
    const arcPulse = Math.sin(time * 10) * 2;
    ctx.strokeStyle = `rgba(224, 170, 255, ${0.7 + Math.sin(time * 15) * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = -30 - i * 4 + (Math.random() - 0.5) * 3;
      ctx.lineTo(offsetX, offsetY);
    }
    ctx.stroke();

    // Secondary coils
    ctx.fillStyle = "#4a3a5a";
    ctx.beginPath();
    ctx.roundRect(10, -10, 6, 20, 2);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-16, -10, 6, 20, 2);
    ctx.fill();

    // Energy conduits
    ctx.strokeStyle = "#9d4edd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(-12, 16);
    ctx.moveTo(8, 12);
    ctx.lineTo(12, 16);
    ctx.stroke();

    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // Draw level indicators as electric orbs
    // for (let i = 0; i < this.level; i++) {
    //   const indicatorX = x - 12 + i * 6;
    //   const indicatorY = y + 25;
    //   const orbPulse = Math.sin(time * 4 + i) * 0.5 + 1;

    //   // Energy glow
    //   ctx.fillStyle = `rgba(157, 78, 221, ${0.4 * orbPulse})`;
    //   ctx.beginPath();
    //   ctx.arc(indicatorX, indicatorY, 5 * orbPulse, 0, Math.PI * 2);
    //   ctx.fill();

    //   // Main orb
    //   ctx.fillStyle = s.color;
    //   ctx.beginPath();
    //   ctx.arc(indicatorX, indicatorY, 3, 0, Math.PI * 2);
    //   ctx.fill();

    //   // Electric spark effect for higher levels
    //   if (this.level > 3 && i >= this.level - 3) {
    //     this.drawElectricSpark(indicatorX, indicatorY, time);
    //   }
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for TeslaTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---

    // Random electric arcs between tower parts
    if (Math.random() < 0.1) {
      this.drawRandomArc(x, y, time);
    }
  }

  drawElectricSpark(x, y, time) {
    const angle = Math.random() * Math.PI * 2;
    const length = 5 + Math.random() * 8;

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + Math.sin(time * 20) * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 0; i < 3; i++) {
      const segX = x + (Math.cos(angle) * length * (i + 1)) / 3;
      const segY = y + (Math.sin(angle) * length * (i + 1)) / 3;
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetY = (Math.random() - 0.5) * 3;
      ctx.lineTo(segX + offsetX, segY + offsetY);
    }

    ctx.stroke();
  }

  drawRandomArc(x, y, time) {
    const startAngle = Math.random() * Math.PI * 2;
    const endAngle = startAngle + (Math.random() - 0.5) * Math.PI;
    const startDist = 15 + Math.random() * 10;
    const endDist = 5 + Math.random() * 8;

    const startX = x + Math.cos(startAngle) * startDist;
    const startY = y + Math.sin(startAngle) * startDist;
    const endX = x + Math.cos(endAngle) * endDist;
    const endY = y + Math.sin(endAngle) * endDist;

    ctx.strokeStyle = `rgba(224, 170, 255, ${0.7 + Math.sin(time * 20) * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Create jagged lightning effect
    const segments = 5;
    const dx = (endX - startX) / segments;
    const dy = (endY - startY) / segments;

    for (let i = 1; i <= segments; i++) {
      const segX = startX + dx * i;
      const segY = startY + dy * i;
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 8;
      ctx.lineTo(segX + offsetX, segY + offsetY);
    }

    ctx.stroke();
  }
}
