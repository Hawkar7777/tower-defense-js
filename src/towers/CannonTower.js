// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\CannonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";

export class CannonTower extends BaseTower {
  constructor(gx, gy, key) {
    // This is the most important line.
    // It calls the BaseTower's constructor with the necessary information.
    super(gx, gy, key);
    // --- FINAL CORRECTION: Using an absolute path from the web server's root ---
    // The server root (http://127.0.0.1:5500/) is assumed to be the 'Tower' folder.
    // So the path to the sound is '/src/assets/sounds/cannonTower.mp3'.
    // This should work regardless of where CannonTower.js itself is in the hierarchy.
    this.shootSound = new Audio("./assets/sounds/cannonTower.mp3"); // Corrected to absolute path
    this.shootSound.volume = 0.6; // Adjust volume as needed (0.0 to 1.0)
    this.shootSound.load(); // Preload the sound
  }

  // --- NEW: Method to play the sound ---
  playShootSound() {
    if (this.shootSound) {
      this.shootSound.pause(); // Stop if already playing
      this.shootSound.currentTime = 0; // Rewind to start
      this.shootSound.play().catch((e) => {
        // This catch handles potential "NotAllowedError" if the user hasn't interacted
        // with the page yet, which prevents autoplay.
        // It also catches if the browser still has issues loading the source (e.g. if the file is corrupted)
        console.warn(
          "Sound playback prevented (user interaction needed or source issue?):",
          e
        );
      });
    }
  }

  // --- NEW: Override fireProjectile to play sound when a projectile is actually fired ---
  fireProjectile(center, target, spec) {
    // Call the original BaseTower's fireProjectile.
    // It now returns true if a projectile was launched, false if it missed.
    const projectileFired = super.fireProjectile(center, target, spec);

    if (projectileFired) {
      this.playShootSound(); // Play sound ONLY if a projectile was successfully fired (not a miss)
    }
  }

  // --- COMPLETELY REDESIGNED DRAW METHOD ---
  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    // 1. Armored Hexagonal Base
    ctx.fillStyle = "#4a4a5a"; // Dark gray metal
    ctx.strokeStyle = "#8a8a9a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6; // Rotated for a flat front
      const hx = x + 20 * Math.cos(angle);
      const hy = y + 20 * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Rotating Turret Assembly
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Turret Base
    const turretGradient = ctx.createLinearGradient(0, -12, 0, 12);
    turretGradient.addColorStop(0, "#95a5a6");
    turretGradient.addColorStop(1, "#7f8c8d");
    ctx.fillStyle = turretGradient;
    ctx.strokeStyle = "#546363";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-15, -12, 20, 24, 6);
    ctx.fill();
    ctx.stroke();

    // --- 3. Recoil Animation Logic ---
    // Calculate what percentage of the cooldown is left.
    // This will be 1.0 right after firing, and 0.0 when ready to fire again.
    const recoilRatio = this.cool / (1 / s.fireRate);
    // Use Math.sin to create a smooth kickback and return animation.
    const recoilDistance = Math.sin(recoilRatio * Math.PI) * 6; // Kicks back 6px

    // --- 4. Draw the Cannon Barrel with Recoil ---
    ctx.save();
    ctx.translate(-recoilDistance, 0); // Apply the recoil to the barrel's position

    // Barrel Casing
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(-5, -8, 15, 16);

    // Main Barrel
    const barrelGradient = ctx.createLinearGradient(0, -6, 0, 6);
    barrelGradient.addColorStop(0, "#c5c5c5");
    barrelGradient.addColorStop(0.5, "#ffffff");
    barrelGradient.addColorStop(1, "#c5c5c5");
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(10, -6, 25, 12);

    // Muzzle Brake
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(35, -7, 5, 14);
    ctx.fillRect(32, -8, 3, 2); // Top vent
    ctx.fillRect(32, 6, 3, 2); // Bottom vent

    // Barrel Opening
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(40, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Gold Accent Ring
    ctx.fillStyle = s.color;
    ctx.fillRect(8, -7, 4, 14);

    ctx.restore(); // End of barrel drawing

    ctx.restore(); // End of turret rotation

    // --- NEW CODE: Display Level as Text for CannonTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
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
