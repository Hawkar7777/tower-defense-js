// ===== FILE: src/towers/LightningTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx, TILE } from "../core.js";
import { particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnBeam } from "../effects.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class LightningTower extends BaseTower {
  static SPEC = {
    name: "Lightning Tower",
    cost: 300,
    range: 150,
    fireRate: 1.5,
    dmg: 30,
    chainCount: 4,
    chainRange: 100,
    stunChance: 0.2,
    stunDuration: 1.2,
    color: "#00ffff", // Main color (bright cyan)
    size: { align: "T", occupy: 3 },
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.3;
    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.1),
      fireRate: base.fireRate,
      dmg: base.dmg * mult,
      chainCount: base.chainCount,
      chainRange: base.chainRange,
      stunChance: base.stunChance,
      stunDuration: base.stunDuration,
      color: base.color,
      cost: base.cost,
      size: base.size,
    };
  }

  // The lightning should originate from the top conductor of the new design
  getLightningOrigin() {
    const { x, y } = this.center;
    const time = performance.now() / 500;
    // Top of the pulsating energy sphere
    const topSphereY = y - 45 + Math.sin(time * 0.7) * 2; // Matches draw method's top sphere
    return { x: x, y: topSphereY - 8 }; // Slightly above the sphere
  }

  update(dt, enemiesList) {
    super.update(dt, enemiesList);

    // If hexed, don't do any GunTower-specific logic
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;

    let target = null;
    let minDist = Infinity;
    for (const e of enemiesList) {
      if (e.dead) continue;
      const d = dist(this.center, e.pos);
      if (d <= s.range && d < minDist) {
        target = e;
        minDist = d;
      }
    }

    if (this.cool <= 0 && target) {
      this.cool = 1 / s.fireRate;
      this.fireLightning(target, s, enemiesList);
    }
  }

  fireLightning(startEnemy, spec, enemiesList) {
    const hitEnemies = new Set();
    let current = startEnemy;
    let prevPos = this.getLightningOrigin();

    for (let i = 0; i <= spec.chainCount; i++) {
      if (!current || current.dead || hitEnemies.has(current)) break;

      if (typeof current.damage === "function") current.damage(spec.dmg);
      if (
        Math.random() < spec.stunChance &&
        typeof current.stun === "function"
      ) {
        current.stun(spec.stunDuration);
      }

      spawnBeam(prevPos, current.pos, spec.color, 2 + Math.random() * 1.5);
      for (let s = 0; s < 5; s++) {
        particles.push({
          x: prevPos.x + (current.pos.x - prevPos.x) * Math.random(),
          y: prevPos.y + (current.pos.y - prevPos.y) * Math.random(),
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          life: 0.3 + Math.random() * 0.3,
          r: 1 + Math.random() * 2,
          c: spec.color,
          fade: 0.85,
        });
      }
      hitEnemies.add(current);
      prevPos = current.pos;

      let nextEnemy = null;
      let minDist = Infinity;
      for (const e of enemiesList) {
        if (e.dead || hitEnemies.has(e)) continue;
        const d = dist(current.pos, e.pos);
        if (d <= spec.chainRange && d < minDist) {
          nextEnemy = e;
          minDist = d;
        }
      }
      current = nextEnemy;
    }
    soundManager.playSound("lightningShoot", 0.2);
  }

  draw() {
    const s = this.spec();
    const time = performance.now() / 500; // For animations

    const x = this.center.x;
    const y = this.center.y; // Use center for base positioning

    // Calculate hover for the whole tower
    const hoverOffset = Math.sin(time * 0.4) * 1.5;
    ctx.save();
    ctx.translate(0, hoverOffset);

    // 1. Arcane Base Platform
    ctx.fillStyle = "#1a2a3a"; // Dark blue-grey
    ctx.strokeStyle = "#3a4a5a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 25, 12, 0, 0, Math.PI * 2); // Wider, oval base
    ctx.fill();
    ctx.stroke();

    // Base energy veins (glowing)
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + time * 0.15;
      const veinX1 = x + Math.cos(angle) * 18;
      const veinY1 = y + 15 + Math.sin(angle) * 8;
      const veinX2 = x + Math.cos(angle + 0.3) * 23;
      const veinY2 = y + 15 + Math.sin(angle + 0.3) * 10;
      ctx.strokeStyle = `rgba(0, 255, 255, ${
        0.6 + Math.sin(time * 0.8 + i) * 0.3
      })`;
      ctx.beginPath();
      ctx.moveTo(veinX1, veinY1);
      ctx.lineTo(veinX2, veinY2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 2. Central Crystal Spire
    const spireBaseY = y + 10;
    const spireTopY = y - 40;
    ctx.fillStyle = "#2c3e50"; // Dark metallic blue
    ctx.beginPath();
    ctx.moveTo(x - 8, spireBaseY);
    ctx.lineTo(x - 4, spireTopY); // Taper to a point
    ctx.lineTo(x + 4, spireTopY);
    ctx.lineTo(x + 8, spireBaseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#5d6d7e";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Spire energy glow (vertical)
    const spireGrad = ctx.createLinearGradient(x, spireBaseY, x, spireTopY);
    spireGrad.addColorStop(0, "rgba(0, 200, 255, 0.2)");
    spireGrad.addColorStop(0.5, "rgba(0, 255, 255, 0.6)");
    spireGrad.addColorStop(1, "rgba(0, 200, 255, 0.2)");
    ctx.fillStyle = spireGrad;
    ctx.beginPath();
    ctx.moveTo(x - 6, spireBaseY);
    ctx.lineTo(x - 2, spireTopY);
    ctx.lineTo(x + 2, spireTopY);
    ctx.lineTo(x + 6, spireBaseY);
    ctx.closePath();
    ctx.fill();

    // 3. Orbiting Energy Rings
    const ringCount = 3;
    const ringOffsetY = -10; // Offset relative to tower center
    const ringBaseRadius = 25;
    const ringHeight = 5;

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < ringCount; i++) {
      const ringAngle = time * 0.8 + (i * Math.PI * 2) / ringCount;
      const ringRadius = ringBaseRadius + Math.sin(time * 1.2 + i * 0.5) * 3; // Pulsating radius
      const ringAlpha = 0.6 + Math.sin(time * 1.5 + i * 0.7) * 0.3; // Pulsating alpha

      // Draw as a rotating ellipse
      ctx.strokeStyle = `rgba(0, 255, 255, ${ringAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y + ringOffsetY,
        ringRadius,
        ringHeight,
        ringAngle,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over"; // Reset blend mode

    // 4. Top Energy Conductor (pulsating sphere)
    const topSphereY = y - 45; // Top of the spire
    const spherePulseSize = 6 + Math.sin(time * 0.7) * 2; // Pulsating effect

    // Outer glow for the sphere
    ctx.globalCompositeOperation = "lighter";
    const outerSphereGrad = ctx.createRadialGradient(
      x,
      topSphereY,
      0,
      x,
      topSphereY,
      spherePulseSize * 2
    );
    outerSphereGrad.addColorStop(
      0,
      `rgba(0, 255, 255, ${0.8 + Math.sin(time * 1.2) * 0.2})`
    );
    outerSphereGrad.addColorStop(1, "rgba(0, 255, 255, 0)");
    ctx.fillStyle = outerSphereGrad;
    ctx.beginPath();
    ctx.arc(x, topSphereY, spherePulseSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main sphere body
    const sphereGrad = ctx.createRadialGradient(
      x,
      topSphereY,
      0,
      x,
      topSphereY,
      spherePulseSize
    );
    sphereGrad.addColorStop(0, "#E0FFFF"); // Light cyan
    sphereGrad.addColorStop(0.5, "#80FFFF"); // Medium cyan
    sphereGrad.addColorStop(1, "#00CCCC"); // Darker cyan
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(x, topSphereY, spherePulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over"; // Reset blend mode

    // --- Display Level as Text for LightningTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the base platform
    ctx.fillText(`Lv. ${this.level}`, x, y + 35 - hoverOffset); // Account for hover
    // --- END NEW CODE ---

    ctx.restore(); // End hover translation
  }
}
