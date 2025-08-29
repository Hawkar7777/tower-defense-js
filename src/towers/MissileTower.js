import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { spawnExplosion, spawnMuzzle } from "../effects.js";
import { Missile } from "../missile.js"; // We'll create this special projectile
import { soundManager } from "../assets/sounds/SoundManager.js"; // Import the sound manager
import { TOWER_TYPES } from "../config.js";

export class MissileTower extends BaseTower {
  // Override spec to include missile properties
  spec() {
    const base = TOWER_TYPES.missile;
    const mult = 1 + (this.level - 1) * 0.4;
    return {
      ...base,
      dmg: base.dmg * mult,
      splash: base.splash * (1 + (this.level - 1) * 0.08),
      range: base.range * (1 + (this.level - 1) * 0.1),
      fireRate: base.fireRate * (1 + (this.level - 1) * 0.05),
      homingStrength: base.homingStrength + (this.level - 1) * 0.02,
    };
  }

  update(dt, enemiesList) {
    // If hexed, don't do any GunTower-specific logic
    if (this.isHexed) return;
    const s = this.spec();
    this.cool -= dt;

    // pick best target as before
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

    // If we found a best right now => lock onto it
    if (best) {
      this.lockedTarget = best;
      this.lockTimer = this.LOCK_HOLD;
    } else {
      // If no immediate best, but we have a locked target, keep it for a short time
      if (this.lockedTarget && !this.lockedTarget.dead) {
        const d = dist(this.center, this.lockedTarget.pos);
        if (d <= s.range && this.lockTimer > 0) {
          this.lockTimer -= dt;
          best = this.lockedTarget; // keep aiming at the locked target
        } else {
          // lock expired or target out of range -> clear lock
          this.lockedTarget = null;
          this.lockTimer = 0;
        }
      } else {
        // no locked target, ensure timer cleared
        this.lockTimer = 0;
        this.lockedTarget = null;
      }
    }

    // Only rotate if we have a target (either new best or locked one)
    if (best) {
      // local coordinates of the missile nose (must match drawMissileInSilo & fireMissile)
      const localX = 0;
      const localY = -30;

      // Include recoil translation used in draw() (translate(0, this.recoilEffect * 2) before rotate)
      const recoilLocal =
        this.recoilEffect && this.recoilEffect > 0 ? this.recoilEffect * 2 : 0;
      const localYWithRecoil = localY + recoilLocal;

      // If target sits exactly at tower centre, do nothing
      if (!(best.pos.x === this.center.x && best.pos.y === this.center.y)) {
        // Start with a reasonable guess (center -> target) but add PI/2 because nose points -Y
        let rotGuess =
          Math.atan2(best.pos.y - this.center.y, best.pos.x - this.center.x) +
          Math.PI / 2;

        // Iterate: compute nose world position for rotGuess, then compute angle from that nose to the target,
        // then add PI/2 to get the rotation that orients the launcher so the nose faces the target.
        for (let i = 0; i < 4; i++) {
          const sx =
            this.center.x +
            Math.cos(rotGuess) * localX -
            Math.sin(rotGuess) * localYWithRecoil;
          const sy =
            this.center.y +
            Math.sin(rotGuess) * localX +
            Math.cos(rotGuess) * localYWithRecoil;

          // angle from nose (sx,sy) to target, then +PI/2 to convert to launcher rotation
          rotGuess = Math.atan2(best.pos.y - sy, best.pos.x - sx) + Math.PI / 2;
        }

        // instant set — or lerp for smooth turning (see notes)
        this.rot = rotGuess;
      }
    }

    // Fire if cooldown is ready and there's a target
    if (this.cool <= 0 && best) {
      this.cool = 1 / s.fireRate;
      this.fireMissile(best, s);

      // keep locked target after firing so it doesn't snap away
      this.lockedTarget = best;
      this.lockTimer = this.LOCK_HOLD;
    }
  }

  fireMissile(target, spec) {
    const c = this.center;

    // Local coordinates of the missile nose in the launcher space
    // (matches drawMissileInSilo: nose cone goes up to about -30)
    const localX = 0;
    const localY = -30;

    // Transform local -> world using rotation matrix (rotate, then translate)
    const startX =
      c.x + Math.cos(this.rot) * localX - Math.sin(this.rot) * localY;
    const startY =
      c.y + Math.sin(this.rot) * localX + Math.cos(this.rot) * localY;

    // Compute initial rotation based on spawn position toward the target
    const initialRot = Math.atan2(target.pos.y - startY, target.pos.x - startX);

    // Create homing missile at the correct position — pass initial rotation
    const missile = new Missile(startX, startY, target, spec, initialRot);
    projectiles.push(missile);

    // Muzzle flash and smoke at the launch position
    spawnMuzzle(startX, startY, initialRot, spec.color);
    this.spawnLaunchSmoke(startX, startY);

    // Tower recoil effect
    this.recoilEffect = 0.3;

    // Use the sound manager to play the missile launch sound
    soundManager.playSound("missleShoot", 0.3); // Play sound via manager with specific volume
  }

  spawnLaunchSmoke(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = this.rot + Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 60;
      const size = 3 + Math.random() * 3;
      const life = 1 + Math.random() * 0.5;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#888888",
        gravity: 0.1,
        fade: 0.92,
        shrink: 0.95,
      });
    }

    // Add some forward thrust particles too
    for (let i = 0; i < 6; i++) {
      const angle = this.rot + (Math.random() - 0.5) * 0.2;
      const speed = 100 + Math.random() * 100;
      const size = 2 + Math.random() * 2;
      const life = 0.5 + Math.random() * 0.3;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        r: size,
        c: "#FF5722",
        gravity: 0.05,
        fade: 0.95,
      });
    }
  }

  draw() {
    const s = this.spec();
    const { x, y } = this.center;
    const time = performance.now() / 1000;

    // Draw missile base platform
    ctx.fillStyle = "#261a1a";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Rocket launch pad glow
    const pulse = Math.sin(time * 4) * 0.2 + 0.8;
    const gradient = ctx.createRadialGradient(x, y, 12, x, y, 28);
    gradient.addColorStop(0, `rgba(255, 87, 34, ${0.6 * pulse})`);
    gradient.addColorStop(1, "rgba(255, 87, 34, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Platform border
    ctx.strokeStyle = "#4d2d2d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Draw missile launcher
    ctx.save();
    ctx.translate(x, y);

    // Apply recoil effect if recently fired
    if (this.recoilEffect > 0) {
      ctx.translate(0, this.recoilEffect * 2);
      this.recoilEffect -= 0.05;
    }

    ctx.rotate(this.rot);

    // Launcher base
    ctx.fillStyle = "#3d2d2d";
    ctx.beginPath();
    ctx.roundRect(-14, -10, 28, 20, 5);
    ctx.fill();

    // Launch rails
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -15);
    ctx.lineTo(-8, 15);
    ctx.moveTo(8, -15);
    ctx.lineTo(8, 15);
    ctx.stroke();

    // Missile silo (if no recent fire)
    if (!this.recoilEffect || this.recoilEffect <= 0) {
      this.drawMissileInSilo();
    }

    // Targeting system
    ctx.fillStyle = "#2196F3";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Targeting reticle
    ctx.strokeStyle = "#2196F3";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();

    ctx.restore();

    // Display Level as Text for MissileTower
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tower. Adjust y + 25 as needed for spacing.
    ctx.fillText(`Lv. ${this.level}`, x, y + 25);

    // Random targeting laser effect
    if (Math.random() < 0.05) {
      this.drawTargetingLaser(x, y, time);
    }
  }

  drawMissileInSilo() {
    // Missile body - positioned to fire forward
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(-4, -24, 8, 24, 3); // Moved forward (negative Y)
    ctx.fill();

    // Missile stripes
    ctx.fillStyle = "#FF5722";
    ctx.fillRect(-4, -16, 8, 3); // Adjusted positions
    ctx.fillRect(-4, -9, 8, 3); // Adjusted positions

    // Missile nose cone - pointing forward
    ctx.fillStyle = "#FF5722";
    ctx.beginPath();
    ctx.moveTo(-4, -24);
    ctx.lineTo(4, -24);
    ctx.lineTo(0, -30); // Pointing forward (negative Y)
    ctx.closePath();
    ctx.fill();

    // Fins - adjusted position
    ctx.fillStyle = "#FF5722";
    ctx.beginPath();
    ctx.moveTo(-4, -2); // Adjusted position
    ctx.lineTo(-8, -2); // Adjusted position
    ctx.lineTo(-4, 2); // Adjusted position
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(4, -2); // Adjusted position
    ctx.lineTo(8, -2); // Adjusted position
    ctx.lineTo(4, 2); // Adjusted position
    ctx.closePath();
    ctx.fill();
  }

  drawMiniExhaust(x, y, time) {
    const pulse = Math.sin(time * 8) * 0.5 + 1;

    ctx.fillStyle = `rgba(255, 87, 34, ${0.8 * pulse})`;
    ctx.beginPath();
    ctx.arc(x - 4, y, 2 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTargetingLaser(x, y, time) {
    const angle = this.rot + (Math.random() - 0.5) * 0.2;
    const length = 30 + Math.random() * 20;

    ctx.strokeStyle = `rgba(33, 150, 243, ${0.6 + Math.sin(time * 10) * 0.4})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
