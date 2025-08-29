// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\IceTower.js =====

import { BaseTower } from "./BaseTower.js";
import { projectiles } from "../state.js";
import { spawnMuzzle } from "../effects.js";
import { Bullet } from "../bullet.js";
import { ctx } from "../core.js";
import { soundManager } from "../assets/sounds/SoundManager.js"; // Import the sound manager
import { dist } from "../utils.js"; // Import dist for update method, though it's not directly in this file, often needed in BaseTower
import { TOWER_TYPES } from "../config.js";

export class IceTower extends BaseTower {
  // Override spec to include ice properties
  // ✅ Use config.js values at runtime
  spec() {
    const base = TOWER_TYPES.ice; // <-- comes from config.js
    const mult = 1 + (this.level - 1) * 0.35;

    return {
      name: base.name,
      range: base.range * (1 + (this.level - 1) * 0.08),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      dmg: base.dmg * mult,
      slowAmount: base.slowAmount,
      slowDuration: base.slowDuration * (1 + (this.level - 1) * 0.1),
      freezeChance: base.freezeChance + (this.level - 1) * 0.05,
      bulletSpeed: base.bulletSpeed,
      color: base.color,
      cost: base.cost,
      hp: base.hp,
      unlockPrice: base.unlockPrice,
      upgradePriceBase: base.upgradePriceBase,
    };
  }

  fireProjectile(center, target, spec) {
    // Create ice projectile with special properties
    const iceBullet = new Bullet(center.x, center.y, target, spec);

    // Add ice-specific properties to the bullet
    iceBullet.isIce = true;
    iceBullet.slowAmount = spec.slowAmount;
    iceBullet.slowDuration = spec.slowDuration;
    iceBullet.freezeChance = spec.freezeChance;

    projectiles.push(iceBullet);
    spawnMuzzle(center.x, center.y, this.rot, spec.color);

    // Add frost particles effect
    this.spawnFrostParticles(center.x, center.y);

    // --- SOUND IMPLEMENTATION START ---
    soundManager.playSound("iceShoot", 0.2); // Play the ice shoot sound, adjust volume as needed
    // --- SOUND IMPLEMENTATION END ---
  }

  spawnFrostParticles(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const size = 2 + Math.random() * 3;

      // Add to particles array (you might need to import it)
      const particles = window.particles || []; // Ensure particles is imported or defined
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        r: size,
        c: "#a0f0ff",
        gravity: 0.2,
        fade: 0.95,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw icy base platform
    ctx.fillStyle = "#0e1a2a";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Icy glow effect
    const gradient = ctx.createRadialGradient(x, y, 12, x, y, 22);
    gradient.addColorStop(0, "rgba(108, 250, 255, 0.4)");
    gradient.addColorStop(1, "rgba(108, 250, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Icy platform border
    ctx.strokeStyle = "#2a5a7a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Draw tower body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Main icy structure
    ctx.fillStyle = "#a0e0f0";
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 6);
    ctx.fill();

    // Ice crystal details
    ctx.fillStyle = "#d0f8ff";
    this.drawIceCrystal(-5, -5, 4, time);
    this.drawIceCrystal(5, -5, 3, time);
    this.drawIceCrystal(0, 5, 5, time);

    // Frost emitter (main crystal)
    const pulse = Math.sin(time * 3) * 1.5;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(12, 0, 4 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner crystal glow
    ctx.fillStyle = "rgba(176, 240, 255, 0.7)";
    ctx.beginPath();
    ctx.arc(12, 0, 2 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Frost patterns on body
    ctx.strokeStyle = "rgba(200, 240, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 2);
    ctx.lineTo(-2, -2);
    ctx.lineTo(2, 3);
    ctx.lineTo(6, -1);
    ctx.stroke();

    ctx.restore();

    // --- NEW CODE: Display Level as Text for IceTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---

    // Occasional snowflake particles
    if (Math.random() < 0.05) {
      this.drawSnowflake(x, y, time);
    }
  }

  drawIceCrystal(x, y, size, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time);

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawIceShard(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.7, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.7, y);
    ctx.closePath();
    ctx.fill();
  }

  drawSnowflake(x, y, time) {
    const flakeX = x + (Math.random() - 0.5) * 30;
    const flakeY = y + (Math.random() - 0.5) * 30 - 20;
    const size = 1 + Math.random() * 2;

    ctx.save();
    ctx.translate(flakeX, flakeY);
    ctx.rotate(time);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1;

    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 2, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size * 0.7, -size * 0.7);
      ctx.lineTo(size * 0.7, size * 0.7);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Add roundRect method to CanvasRenderingContext2D if it doesn't exist
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius
  ) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;

    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
  };
}
