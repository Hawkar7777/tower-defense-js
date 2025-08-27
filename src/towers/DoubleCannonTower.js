// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\towers\DoubleCannonTower.js =====

import { BaseTower } from "./BaseTower.js";
import { projectiles } from "../state.js";
import { spawnMuzzle } from "../effects.js";
import { Bullet } from "../bullet.js";
import { ctx } from "../core.js";

export class DoubleCannonTower extends BaseTower {
  static SPEC = {
    name: "Double Canon",
    cost: 160,
    range: 120,
    fireRate: 0.9,
    dmg: 75,
    splash: 55,
    bulletSpeed: 240,
    color: "#ff3333",
  };

  constructor(gx, gy, key) {
    super(gx, gy, key);
    // --- NEW: Load the sound effect for Double Cannon ---
    // Path: relative to the web server's root (Tower folder)
    this.shootSound = new Audio("./assets/sounds/doubleCannon.mp3");
    this.shootSound.volume = 0.7; // Adjust volume as needed (0.0 to 1.0)
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
        console.warn("Sound playback prevented (user interaction needed?):", e);
      });
    }
  }

  // --- MODIFIED fireProjectile to include miss chance and play sound ---
  fireProjectile(center, target, spec) {
    // Check for the miss chance first, inherited from BaseTower
    if (this.missChance > 0 && Math.random() < this.missChance) {
      // The shot misses! Spawn a red "fizzle" effect at the tower's center.
      // We don't have separate barrel miss effects here, so a central one will do.
      spawnMuzzle(center.x, center.y, this.rot, "#ff5555");
      return false; // Indicate that no projectiles were launched
    }

    const offset = 8; // Distance of each barrel from the center line
    const barrelLength = 22; // The visual length of the barrel from the turret pivot
    const sin = Math.sin(this.rot);
    const cos = Math.cos(this.rot);

    // Calculate the exact tip position of each barrel
    const muzzle1X = center.x + cos * barrelLength - sin * offset;
    const muzzle1Y = center.y + sin * barrelLength + cos * offset;
    const muzzle2X = center.x + cos * barrelLength + sin * offset;
    const muzzle2Y = center.y + sin * barrelLength - cos * offset;

    // Fire one projectile from the tip of each barrel
    // --- TYPO FIX HERE: muuzzle1X changed to muzzle1X ---
    projectiles.push(new Bullet(muzzle1X, muzzle1Y, target, spec));
    projectiles.push(new Bullet(muzzle2X, muzzle2Y, target, spec));

    // Spawn muzzle flash at the same barrel tip positions
    spawnMuzzle(muzzle1X, muzzle1Y, this.rot, spec.color);
    spawnMuzzle(muzzle2X, muzzle2Y, this.rot, spec.color);

    // --- Play the sound AFTER successful firing ---
    this.playShootSound();

    return true; // Indicate that projectiles were successfully launched
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;

    // 1. Heavy Hexagonal Base
    ctx.fillStyle = "#2c3e50";
    ctx.strokeStyle = "#567a9e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + 20 * Math.cos(angle);
      const hy = y + 20 * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Rotating Turret
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rot);

    // Armored Turret Body
    const turretGradient = ctx.createLinearGradient(0, -12, 0, 12);
    turretGradient.addColorStop(0, "#95a5a6");
    turretGradient.addColorStop(1, "#7f8c8d");
    ctx.fillStyle = turretGradient;
    ctx.strokeStyle = "#546363";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(10, -12);
    ctx.lineTo(10, 12);
    ctx.lineTo(-8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Recoil Animation Logic
    const recoilRatio = this.cool / (1 / s.fireRate);
    const recoilDistance = Math.sin(recoilRatio * Math.PI) * 5;

    // 4. Draw Cannons with Recoil
    this.drawCannonBarrel(-8, recoilDistance, s.color); // Left Barrel
    this.drawCannonBarrel(8, recoilDistance, s.color); // Right Barrel

    // Central turret pivot
    ctx.fillStyle = "#546363";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- NEW CODE: Display Level as Text for DoubleCannonTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);
    // --- END NEW CODE ---
  }

  drawCannonBarrel(yOffset, recoil, color) {
    ctx.save();
    ctx.translate(-10 - recoil, yOffset);

    // Barrel Base
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(0, -6, 8, 12);

    // Main Barrel
    const barrelGradient = ctx.createLinearGradient(0, -5, 0, 5);
    barrelGradient.addColorStop(0, "#bababa");
    barrelGradient.addColorStop(0.5, "#fdfdfd");
    barrelGradient.addColorStop(1, "#bababa");
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(8, -5, 24, 10);

    // Muzzle Brake
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(32, -6, 4, 12);
    ctx.fillRect(28, -7, 4, 2);
    ctx.fillRect(28, 5, 4, 2);

    // Barrel opening
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath();
    ctx.arc(36, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Red accent rings
    ctx.fillStyle = color;
    ctx.fillRect(10, -6, 3, 12);
    ctx.fillRect(20, -6, 3, 12);

    ctx.restore();
  }
}
