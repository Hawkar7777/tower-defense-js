// ===== FILE: src/towers/WindTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { particles } from "../state.js"; // No longer need to import `enemies`
import { dist } from "../utils.js";

export class WindTower extends BaseTower {
  static SPEC = {
    name: "Wind Tower",
    cost: 200,
    range: 140,
    fireRate: 1.2,
    knockback: 40,
    slowAmount: 0.5,
    slowDuration: 1.5,
    color: "#00bfff",
  };

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      knockback: base.knockback * mult,
      slowAmount: base.slowAmount * (1 + (this.level - 1) * 0.05),
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  // --- MODIFIED --- Moved up to match the new, taller design
  getAttackOrigin() {
    return { x: this.center.x, y: this.center.y - 40 };
  }

  update(dt, enemiesList) {
    const s = this.spec();
    this.cool -= dt;

    // Check if any enemy has their slow expired
    for (const e of enemiesList) {
      if (e.slowedUntil && e.slowedUntil < performance.now()) {
        e.speed = e.originalSpeed;
        e.slowedUntil = null;
      }
    }

    if (this.cool <= 0) {
      let hitAny = false;
      const attackOrigin = this.getAttackOrigin();

      // Create a visual "gust" effect when firing
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 80 + 20;
        particles.push({
          x: attackOrigin.x,
          y: attackOrigin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.6,
          r: 1 + Math.random(),
          c: "rgba(200, 240, 255, 0.7)",
          fade: 0.92,
        });
      }

      for (const e of enemiesList) {
        if (e.dead) continue;
        const d = dist(this.center, e.pos);
        if (d <= s.range) {
          hitAny = true;

          // Apply knockback
          const dx = e.pos.x - this.center.x;
          const dy = e.pos.y - this.center.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          // Apply a gentle push instead of a teleport
          e.vx += (dx / len) * s.knockback * 2;
          e.vy += (dy / len) * s.knockback * 2;

          // Apply temporary slow
          if (e.originalSpeed === undefined) e.originalSpeed = e.speed;
          e.slowedUntil = performance.now() + s.slowDuration * 1000;
          e.speed = e.originalSpeed * (1 - s.slowAmount);
        }
      }

      if (hitAny) {
        this.cool = 1 / s.fireRate;
      }
    }
  }

  // --- COMPLETELY REDESIGNED DRAW METHOD ---
  draw() {
    const { x, y } = this.center;
    const time = performance.now();
    const s = this.spec();

    // 1. Crystalline Base
    ctx.fillStyle = "#65c8ff";
    ctx.strokeStyle = "#c2f2ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + 18);
    ctx.lineTo(x - 12, y + 10);
    ctx.lineTo(x + 12, y + 10);
    ctx.lineTo(x + 18, y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Tall, Sleek Pylon
    const pylonGradient = ctx.createLinearGradient(x - 5, y, x + 5, y);
    pylonGradient.addColorStop(0, "#82d8ff");
    pylonGradient.addColorStop(0.5, "#e0f8ff");
    pylonGradient.addColorStop(1, "#82d8ff");
    ctx.fillStyle = pylonGradient;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 10);
    ctx.lineTo(x - 4, y - 35); // Made much taller
    ctx.lineTo(x + 4, y - 35);
    ctx.lineTo(x + 6, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Glowing Core at the top
    const coreY = y - 40; // New, higher position
    const corePulse = 3 + Math.sin(time / 300) * 1.5;
    const coreGlow = ctx.createRadialGradient(
      x,
      coreY,
      1,
      x,
      coreY,
      corePulse * 2
    );
    coreGlow.addColorStop(0, "rgba(255, 255, 255, 1)");
    coreGlow.addColorStop(1, "rgba(180, 240, 255, 0)");

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, coreY, corePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(x, coreY, corePulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // 4. Animated Swirling Wind Gusts
    const bladeCount = 3;
    for (let i = 0; i < bladeCount; i++) {
      const angle = time / 800 + (i * Math.PI * 2) / bladeCount;
      const startRadius = 5;
      const endRadius = 18 + Math.sin(time / 400 + i) * 4;
      const controlRadius = 25;

      const startX = x + Math.cos(angle) * startRadius;
      const startY = coreY + Math.sin(angle) * startRadius;

      const endX = x + Math.cos(angle + 2) * endRadius;
      const endY = coreY + Math.sin(angle + 2) * endRadius;

      const controlX = x + Math.cos(angle + 1) * controlRadius;
      const controlY = coreY + Math.sin(angle + 1) * controlRadius;

      ctx.strokeStyle = `rgba(220, 250, 255, ${
        0.3 + Math.sin(time / 300 + i) * 0.2
      })`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();
    }

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // 5. Level indicators as glowing lines on the pylon
    // for (let i = 0; i < this.level; i++) {
    //   const levelY = y + 5 - i * 6;
    //   ctx.fillStyle = "#ffffff";
    //   ctx.shadowColor = s.color;
    //   ctx.shadowBlur = 4;
    //   ctx.fillRect(x - 5, levelY, 10, 2);
    // }
    // ctx.shadowBlur = 0;
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for WindTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
  }
}
