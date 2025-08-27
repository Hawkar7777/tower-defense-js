import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist } from "../utils.js";
import { TOWER_TYPES } from "../config.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

/* ---------------- Behemoth Shell (Heavy Gauss Cannon Style) ---------------- */
class BehemothShell {
  constructor(start, target, dmg, splash, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed;
    this.dmg = dmg;
    this.splash = splash;
    this.dead = false;
    this.size = 12; // Larger shell
    this.age = 0;
    this.coreColor = "#a8e0ff"; // Bright blue energy core
    this.trail = [];
  }

  update(dt) {
    this.age += dt;

    // Persist the trail for a smooth visual effect
    this.trail.push({ ...this.pos });
    if (this.trail.length > 20) {
      this.trail.shift();
    }

    // Impact detection with any nearby enemy
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (dist(this.pos, enemy.pos) < 20) {
        this.detonate();
        return; // Stop processing once detonated
      }
    }

    // If the original target is lost, fly straight and then fizzle out
    if (!this.target || this.target.dead) {
      this.pos.x += Math.cos(this._lastAngle || 0) * this.speed * dt;
      this.pos.y += Math.sin(this._lastAngle || 0) * this.speed * dt;
      if (this.age > 2) this.dead = true;
      return;
    }

    // Move towards the current target position
    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    this._lastAngle = angle;

    const vx = (dx / distance) * this.speed;
    const vy = (dy / distance) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;
  }

  detonate() {
    this.dead = true;

    // Create a huge blue energy explosion visual
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 350 + 50; // High velocity particles
      particles.push({
        x: this.pos.x,
        y: this.pos.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1.0 + Math.random() * 1.5,
        r: 2 + Math.random() * 4,
        c: `rgba(168, 224, 255, ${0.5 + Math.random() * 0.5})`,
        fade: 0.94,
      });
    }

    // Add a large, expanding shockwave particle
    particles.push({
      x: this.pos.x,
      y: this.pos.y,
      vx: 0,
      vy: 0,
      life: 0.8,
      r: this.splash,
      c: "rgba(168, 224, 255, 0.2)",
      fade: 0.95,
      isShockwave: true,
    });

    // Apply splash damage to all enemies in the radius
    for (const e of enemies) {
      if (e.dead) continue;
      const d = dist(e.pos, this.pos);
      if (d <= this.splash) {
        // Damage falls off less at the edges compared to smaller explosions
        const dmgMultiplier = 1 - (d / this.splash) * 0.5;
        e.damage(this.dmg * dmgMultiplier);
      }
    }
  }

  draw() {
    ctx.save();

    // Draw the bright energy trail behind the shell
    if (this.trail.length > 1) {
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        const p = this.trail[i];
        const prev = this.trail[i - 1];
        // Use quadratic curves for a smoother trail
        ctx.quadraticCurveTo(
          prev.x,
          prev.y,
          (p.x + prev.x) / 2,
          (p.y + prev.y) / 2
        );
      }
      const trailGrad = ctx.createLinearGradient(
        this.trail[0].x,
        this.trail[0].y,
        this.pos.x,
        this.pos.y
      );
      trailGrad.addColorStop(0, "rgba(168, 224, 255, 0)");
      trailGrad.addColorStop(1, "rgba(168, 224, 255, 0.5)");
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Draw the main projectile's outer glow
    const g = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      0,
      this.pos.x,
      this.pos.y,
      this.size * 3
    );
    g.addColorStop(0, "#fff");
    g.addColorStop(0.3, this.coreColor);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw the projectile's physical core
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#1e2a4a"; // Dark blue metallic core
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ---------------- Top gun bullet (fast, continuous) ---------------- */
class TopGunBullet {
  constructor(start, target, dmg, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed;
    this.dmg = dmg;
    this.dead = false;
    this.age = 0;
    this._lastAngle = 0;
  }

  update(dt) {
    this.age += dt;
    if (!this.target || this.target.dead) {
      this.pos.x += Math.cos(this._lastAngle) * this.speed * dt;
      this.pos.y += Math.sin(this._lastAngle) * this.speed * dt;
      if (this.age > 1.0) this.dead = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distTo = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    this._lastAngle = angle;

    if (distTo < 8) {
      if (typeof this.target.damage === "function") {
        this.target.damage(this.dmg);
      }
      this.dead = true;
      return;
    }

    const vx = (dx / distTo) * this.speed;
    const vy = (dy / distTo) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;
  }

  draw() {
    ctx.fillStyle = "rgba(255,220,140,0.95)";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------------- Behemoth Tank Class ---------------- */
export class BehemothTank extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.behemothTank;
  }

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this._s = {
      // +++ CHANGE: Set default angle to Math.PI (180 degrees) to face LEFT +++
      turretAngle: Math.PI,
      topGunAngle: Math.PI,
      recoil: 0,
      muzzleFlash: 0,
      topGunFlash: 0,
      heat: 0,
      topCool: 0,
      idleBob: Math.random() * Math.PI * 2,
    };
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.3; // Has stronger level scaling
    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: Math.round(base.range * (1 + (this.level - 1) * 0.08)),
      splash: Math.round(base.splash * (1 + (this.level - 1) * 0.12)),
      topDmg: Math.round(base.topDmg * mult),
    };
  }

  getAttackOrigins() {
    const ang = this._s.turretAngle;
    const recoilOffset = this._s.recoil * 3;
    const barrelDist = 68 - recoilOffset; // Barrels are further out
    const sideOffset = 18; // And further apart

    const left = {
      x:
        this.center.x + Math.cos(ang) * barrelDist - Math.sin(ang) * sideOffset,
      y:
        this.center.y + Math.sin(ang) * barrelDist + Math.cos(ang) * sideOffset,
    };
    const right = {
      x:
        this.center.x + Math.cos(ang) * barrelDist + Math.sin(ang) * sideOffset,
      y:
        this.center.y + Math.sin(ang) * barrelDist - Math.cos(ang) * sideOffset,
    };
    return { left, right };
  }

  // Calculates the precise origin of the top gun's barrel tip
  getTopGunOrigin() {
    const angle = this._s.topGunAngle;
    // These values match the visual drawing of the gun
    const mountOffsetY = -22;
    const barrelTipOffset = 40; // The distance from the gun's pivot to its tip

    // Calculate the mount position, including the idle hover effect
    const mountX = this.center.x;
    const mountY =
      this.center.y + mountOffsetY + Math.sin(this._s.idleBob) * 1.5;

    // Calculate the final tip position based on the mount and angle
    const originX = mountX + Math.cos(angle) * barrelTipOffset;
    const originY = mountY + Math.sin(angle) * barrelTipOffset;

    return { x: originX, y: originY };
  }

  findTarget(enemiesList) {
    let target = null;
    let minDist = Infinity;
    const s = this.spec(); // Use current spec for range

    for (const e of enemiesList) {
      if (e.dead) continue;
      const d = dist(this.center, e.pos);
      if (d <= s.range && d < minDist) {
        target = e;
        minDist = d;
      }
    }

    return target;
  }

  update(dt, enemiesList) {
    // Update internal state timers
    this.cool -= dt;
    this._s.recoil = Math.max(0, this._s.recoil - dt * 2.5);
    this._s.muzzleFlash = Math.max(0, this._s.muzzleFlash - dt * 8.0);
    this._s.topGunFlash = Math.max(0, this._s.topGunFlash - dt * 15.0); // Faster flash fade
    this._s.heat = Math.max(0, this._s.heat - dt * 0.3);
    this._s.topCool = Math.max(0, this._s.topCool - dt);
    this._s.idleBob += dt * 0.5;

    // Target acquisition
    let target = this.findTarget(enemiesList);

    // Aim turret at target
    if (target) {
      const want = Math.atan2(
        target.pos.y - this.center.y,
        target.pos.x - this.center.x
      );
      const diff =
        ((want - this._s.turretAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
      // The turret on this tank is massive and slow to turn
      this._s.turretAngle += diff * Math.min(1, dt * 1.5);
      this._s.topGunAngle += diff * Math.min(1, dt * 5.0); // Top gun aims faster
    }

    // FIRE MAIN CANNONS (SIMULTANEOUSLY)
    if (this.cool <= 0 && target) {
      const s = this.spec();
      this.cool = 1 / s.fireRate;
      const { left, right } = this.getAttackOrigins();

      // FIRE BOTH BARRELS!
      projectiles.push(
        new BehemothShell(left, target, s.dmg, s.splash, s.bulletSpeed)
      );
      projectiles.push(
        new BehemothShell(right, target, s.dmg, s.splash, s.bulletSpeed)
      );

      soundManager.playSound("behemothTankShoot", 0.3);
      // Trigger visual effects
      this._s.recoil = 3.5;
      this._s.muzzleFlash = 0.6;
      this._s.heat = Math.min(4.0, this._s.heat + 1.8);
    }

    // FIRE TOP GUN
    if (target && this._s.topCool <= 0) {
      const s = this.spec();
      // Use the new precise origin calculation
      const origin = this.getTopGunOrigin();
      projectiles.push(
        new TopGunBullet(origin, target, s.topDmg, s.topBulletSpeed)
      );
      this._s.topCool = 1 / s.topFireRate;
      this._s.topGunFlash = 0.3; // Brighter flash
      soundManager.playSound("behemothRifleShoot", 0.3);
    }
  }

  draw() {
    const { x, y } = this.center;
    const idleY = Math.sin(this._s.idleBob) * 1.5; // Gentle hovering animation

    // Massive Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(x, y + 45, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // HULL (Main Body)
    ctx.save();
    ctx.translate(x, y + idleY);

    // Treads
    ctx.fillStyle = "#1c1c1c";
    roundRect(ctx, -75, -45, 150, 90, 15);
    for (let i = -60; i <= 60; i += 15) {
      ctx.fillStyle = "#3c3c3c";
      ctx.fillRect(i, -45, 8, 90);
    }

    // Main Hull
    const hullGrad = ctx.createLinearGradient(0, -35, 0, 35);
    hullGrad.addColorStop(0, "#4a5a6a"); // Dark, cool metal colors
    hullGrad.addColorStop(0.5, "#3a4a5a");
    hullGrad.addColorStop(1, "#2a3a4a");
    ctx.fillStyle = hullGrad;
    roundRect(ctx, -70, -35, 140, 70, 12);
    ctx.strokeStyle = "#1a2a3a";
    ctx.lineWidth = 3;
    roundRectStroke(ctx, -70, -35, 140, 70, 12);

    ctx.restore(); // End Hull Group

    // TURRET
    ctx.save();
    ctx.translate(x, y + idleY);
    ctx.rotate(this._s.turretAngle);

    // Turret Base
    const turretGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
    turretGrad.addColorStop(0, "#6a7a8a");
    turretGrad.addColorStop(1, "#3a4a5a");
    ctx.fillStyle = turretGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a2a3a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // BARRELS
    const barrelLength = 68 - this._s.recoil * 3;
    drawBarrel(18, barrelLength); // Right Barrel
    drawBarrel(-18, barrelLength); // Left Barrel

    // MUZZLE FLASHES (for both barrels)
    if (this._s.muzzleFlash > 0) {
      drawMuzzleFlash(barrelLength + 10, 18, this._s.muzzleFlash);
      drawMuzzleFlash(barrelLength + 10, -18, this._s.muzzleFlash);
    }

    ctx.restore(); // End Turret Group

    // Redesigned Top Gun Drawing Logic
    ctx.save();
    ctx.translate(x, y + idleY - 22); // Mount point on top of the tank hull
    ctx.rotate(this._s.topGunAngle);

    // Gun Mount
    ctx.fillStyle = "#2a3a4a";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Gun Body
    ctx.fillStyle = "#3a4a5a";
    roundRect(ctx, -5, -6, 25, 12, 4);

    // Ammo Box
    ctx.fillStyle = "#2a3a4a";
    ctx.fillRect(0, 6, 15, 8);

    // Barrel
    ctx.fillStyle = "#1a2a3a";
    roundRect(ctx, 20, -2.5, 20, 5, 1.5);

    // Muzzle Flash for the machine gun
    if (this._s.topGunFlash > 0) {
      const mf = this._s.topGunFlash;
      const barrelTipX = 40; // The end of the drawn barrel
      const g = ctx.createRadialGradient(
        barrelTipX,
        0,
        0,
        barrelTipX,
        0,
        15 * mf
      );
      g.addColorStop(0, `rgba(255, 230, 180, ${Math.min(1, mf * 2)})`);
      g.addColorStop(1, "rgba(255, 150, 50, 0)");
      ctx.fillStyle = g;
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.arc(barrelTipX, 0, 15 * mf, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // --- OLD CODE (REMOVE OR COMMENT OUT) ---
    // // LEVEL CHEVRONS
    // for (let i = 0; i < Math.min(4, this.level); i++) {
    //   const mx = x - 22 + i * 12;
    //   const my = y - 36;
    //   ctx.fillStyle = "#ffd24b";
    //   ctx.beginPath();
    //   ctx.moveTo(mx, my);
    //   ctx.lineTo(mx - 4, my - 6);
    //   ctx.lineTo(mx + 4, my - 6);
    //   ctx.closePath();
    //   ctx.fill();
    //   ctx.strokeStyle = "#b77b00";
    //   ctx.lineWidth = 1;
    //   ctx.stroke();
    // }
    // --- END OLD CODE ---

    // --- NEW CODE: Display Level as Text for BehemothTank ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the tank. Adjusted y to avoid overlapping with treads.
    ctx.fillText(`Lv. ${this.level}`, x, y + 55);
    // --- END NEW CODE ---
  }
}

// --- Helper drawing functions kept inside the file for modularity ---
function drawBarrel(yOffset, length) {
  ctx.save();
  ctx.translate(0, yOffset);
  // Barrel Housing
  ctx.fillStyle = "#334";
  roundRect(ctx, -15, -12, 40, 24, 8);
  // Main Barrel Tube
  ctx.fillStyle = "#455";
  roundRect(ctx, 20, -9, length, 18, 5);
  // Muzzle Brake
  ctx.fillStyle = "#223";
  roundRect(ctx, length + 10, -11, 20, 22, 4);
  ctx.restore();
}

function drawMuzzleFlash(x, y, strength) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * strength);
  g.addColorStop(0, `rgba(255,255,230,${strength})`);
  g.addColorStop(0.4, `rgba(168, 224, 255, ${strength * 0.8})`);
  g.addColorStop(1, "rgba(168, 224, 255, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 60 * strength, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}
