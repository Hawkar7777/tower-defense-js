// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\PoisonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnPoisonCloud } from "../effects.js";
import { soundManager } from "../assets/sounds/SoundManager.js"; // Import the sound manager

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
    color: "#4CAF50", // Main color (green)
  };

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

  // The poison should originate from the nozzle of the rotating dispenser
  getAttackOrigin() {
    const { x, y } = this.center;
    // Offset for the nozzle based on the new drawing
    const nozzleOffset = 22; // Local X position of the nozzle tip

    // Calculate world coordinates from the center, rotated by this.rot
    return {
      x: x + Math.cos(this.rot) * nozzleOffset,
      y: y + Math.sin(this.rot) * nozzleOffset,
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
        // Aim the dispenser (rotates with the 'this.rot' variable)
        this.rot = Math.atan2(
          best.pos.y - this.center.y,
          best.pos.x - this.center.x
        );
        this.firePoison(best, s);
      }
    }
  }

  firePoison(target, spec) {
    // Get precise origin from the nozzle
    const c = this.getAttackOrigin();

    // Play poison shoot sound
    soundManager.playSound("poisonShoot", 0.3);

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

    // Visual effects from the tower's origin towards the target
    this.spawnPoisonParticles(c.x, c.y, target.pos.x, target.pos.y);
    this.spawnDrippingEffect(c.x, c.y); // Dripping from the tower itself
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

  // Adjust dripping effect to come from the new dispenser
  spawnDrippingEffect(x, y) {
    // Current rotation of the tower's dispenser
    const angle = this.rot;
    // Local coordinates of the dispenser tip in the new design (around 22,0)
    const dispenserTipX = x + Math.cos(angle) * 22;
    const dispenserTipY = y + Math.sin(angle) * 22;

    for (let i = 0; i < 3; i++) {
      const dropAngle = angle + (Math.random() - 0.5) * 0.5; // Slight spread from dispenser direction
      const speed = 40 + Math.random() * 30;
      const size = 1.5 + Math.random() * 1.5;
      const life = 1 + Math.random() * 0.5;

      particles.push({
        x:
          dispenserTipX +
          Math.cos(dropAngle + Math.PI / 2) * (Math.random() - 0.5) * 5, // Slightly off-center drop
        y:
          dispenserTipY +
          Math.sin(dropAngle + Math.PI / 2) * (Math.random() - 0.5) * 5,
        vx: Math.cos(dropAngle) * speed * 0.3,
        vy: Math.sin(dropAngle) * speed, // Drops mostly downward relative to barrel
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

    // 1. Dark, ornate base
    ctx.fillStyle = "#2c3e50"; // Dark blue-gray
    ctx.strokeStyle = "#4a5458";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y + 15, 25, 12, 0, 0, Math.PI * 2); // Wide, oval base
    ctx.fill();
    ctx.stroke();

    // Base hazard stripes/pattern
    ctx.fillStyle = "#f1c40f"; // Yellow
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 10);
    ctx.lineTo(x - 15, y + 20);
    ctx.lineTo(x - 5, y + 20);
    ctx.lineTo(x, y + 10);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 5, y + 10);
    ctx.lineTo(x + 10, y + 20);
    ctx.lineTo(x + 20, y + 20);
    ctx.lineTo(x + 25, y + 10);
    ctx.closePath();
    ctx.fill();

    // 2. Central toxic liquid chamber (glass/crystal)
    const chamberY = y - 5;
    const chamberHeight = 30;
    const chamberWidth = 15;

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; // Dark transparent background for liquid
    ctx.beginPath();
    ctx.roundRect(
      x - chamberWidth / 2,
      chamberY - chamberHeight / 2,
      chamberWidth,
      chamberHeight,
      5
    );
    ctx.fill();
    ctx.strokeStyle = "#a2d9a5"; // Light green/cyan glass outline
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Toxic liquid (animated bubbling)
    const liquidLevel = 0.8 + Math.sin(time * 1.5) * 0.05;
    const currentLiquidHeight = chamberHeight * liquidLevel;
    ctx.fillStyle = s.color; // Main green poison color
    ctx.beginPath();
    ctx.roundRect(
      x - chamberWidth / 2 + 1,
      chamberY + chamberHeight / 2 - currentLiquidHeight + 1,
      chamberWidth - 2,
      currentLiquidHeight - 2,
      4
    );
    ctx.fill();

    // Bubbles within liquid
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const bubbleX = x + (Math.random() - 0.5) * (chamberWidth - 5);
      const bubbleY =
        chamberY + chamberHeight / 2 - Math.random() * currentLiquidHeight;
      const bubbleSize = 1 + Math.random() * 1.5;
      ctx.fillStyle = `rgba(255, 255, 255, ${
        0.5 + Math.sin(time * 5 + i) * 0.3
      })`;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over"; // Reset blend mode

    // 3. Rotating Dispenser (Skull-like or menacing)
    ctx.save();
    ctx.translate(x, chamberY - chamberHeight / 2); // Pivot point at top of chamber
    ctx.rotate(this.rot); // Rotates with aiming

    ctx.fillStyle = "#3a3a3a"; // Dark grey metallic dispenser
    ctx.beginPath();
    // Simplified skull shape
    ctx.arc(0, 0, 12, 0, Math.PI * 2); // Head
    ctx.roundRect(-8, 5, 16, 5, 2); // Jaw/chin
    ctx.fill();

    // Eye sockets (dark)
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(-4, -3, 2, 0, Math.PI * 2);
    ctx.arc(4, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Nozzle / mouth opening
    ctx.fillStyle = s.color; // Glowing green
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(18, 0, 6, 3, 0, 0, Math.PI * 2); // Emitter mouth
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Toxic mist from nozzle (always active, pulsates)
    ctx.globalCompositeOperation = "lighter";
    const mistStrength = 0.5 + Math.sin(time * 3) * 0.2;
    const mistRadius = 15 + Math.sin(time * 2) * 5;
    const mistGrad = ctx.createRadialGradient(18, 0, 0, 18, 0, mistRadius);
    mistGrad.addColorStop(0, `rgba(76, 175, 80, ${mistStrength})`);
    mistGrad.addColorStop(1, "rgba(76, 175, 80, 0)");
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(18, 0, mistRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.restore(); // End dispenser rotation

    // --- Display Level as Text for PoisonTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the base platform
    ctx.fillText(`Lv. ${this.level}`, x, y + 35);
    // --- END NEW CODE ---

    // Toxic dripping from nozzle - adjusted to come from the new dispenser
    if (Math.random() < 0.3) {
      this.drawToxicDrip(x, y, time);
    }
  }

  // Adjusted drawToxicDrip to account for the new dispenser's local coordinates and rotation
  drawToxicDrip(x, y, time) {
    // Calculate the pivot point of the dispenser
    const dispenserPivotX = x;
    const dispenserPivotY = y - 5 - 30 / 2; // y - 5 (chamberY) - chamberHeight/2

    // Local coordinates of the nozzle tip relative to its pivot (18, 0)
    const localNozzleX = 18;
    const localNozzleY = 0;

    // Rotate these local coordinates by this.rot around the dispenser's pivot
    const cosRot = Math.cos(this.rot);
    const sinRot = Math.sin(this.rot);

    const rotatedNozzleX = localNozzleX * cosRot - localNozzleY * sinRot;
    const rotatedNozzleY = localNozzleX * sinRot + localNozzleY * cosRot;

    // Add the rotated local coordinates to the dispenser's pivot to get world coordinates
    const dripOriginX = dispenserPivotX + rotatedNozzleX;
    const dripOriginY = dispenserPivotY + rotatedNozzleY;

    const dripLength = 3 + Math.random() * 4;

    ctx.strokeStyle = "#388E3C";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(dripOriginX, dripOriginY);
    ctx.lineTo(dripOriginX, dripOriginY + dripLength); // Drips downwards from nozzle
    ctx.stroke();

    // Drip end
    ctx.fillStyle = "#388E3C";
    ctx.beginPath();
    ctx.arc(dripOriginX, dripOriginY + dripLength, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // drawRisingBubble is no longer needed with the new design
  // drawRisingBubble(x, y, time) { ... }
}
