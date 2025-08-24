import { BaseTower } from "./BaseTower.js";
import { ctx, MAP_GRID_W, TILE } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist, clamp } from "../utils.js";
import { TOWER_TYPES } from "../config.js";

/* -------------------- New Strategic Missile Class (Design Made Larger) -------------------- */
class StrategicMissile {
  constructor(start, target, dmg, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed * 0.8; // Make it feel heavier and slower
    this.dmg = dmg;
    this.dead = false;
    this.age = 0;
    this.turnSpeed = 2.5; // Slower turn speed for a larger missile
    this.angle = Math.atan2(target.pos.y - start.y, target.pos.x - start.x);
    this.trail = [];
    this.blastRadius = 400; // BIG splash radius
  }

  update(dt) {
    this.age += dt;
    // If the target is gone, the missile will detonate at its current position after a timeout
    if (!this.target || this.target.dead || this.age > 10) {
      this.dead = true;
      this.createExplosion(this.pos, this.blastRadius);
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Steer towards the target
    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    this.angle += clamp(angleDiff, -this.turnSpeed * dt, this.turnSpeed * dt);

    // Detonate when close to the target
    if (distance < 20) {
      this.dead = true;
      this.createExplosion(this.target.pos, this.blastRadius);
      return;
    }

    // Move the missile
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    // --- MODIFIED: Increased the trail width for a bigger missile ---
    this.trail.push({ x: this.pos.x, y: this.pos.y, life: 1.2, width: 18 }); // Wider trail
    for (let p of this.trail) {
      p.life -= dt * 1.1;
      p.width *= 0.97;
    }
    this.trail = this.trail.filter((p) => p.life > 0);
  }

  createExplosion(position, radius) {
    // Damage all enemies within the massive blast radius
    enemies.forEach((enemy) => {
      if (!enemy.dead && dist(position, enemy.pos) < radius) {
        if (typeof enemy.damage === "function") {
          enemy.damage(this.dmg);
        }
      }
    });

    // Create a much larger and more intense explosion particle effect
    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 250 + 50; // Higher velocity particles
      const life = 1.0 + Math.random() * 1.0; // Longer life
      particles.push({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        r: Math.random() * 20 + 8, // Larger particles
        // More intense orange/red/yellow color palette
        c: `rgba(255, ${Math.floor(Math.random() * 200)}, 0, 0.95)`,
      });
    }
  }

  draw() {
    // Draw volumetric smoke trail
    ctx.save();
    for (let p of this.trail) {
      const alpha = p.life * 0.4;
      ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.width, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw the missile body
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // --- MODIFIED: A larger flame for the bigger missile ---
    const flameSize = 45 + Math.random() * 20;
    const flameGrad = ctx.createLinearGradient(-29, 0, -29 - flameSize, 0);
    flameGrad.addColorStop(0, "rgba(135, 206, 250, 1)");
    flameGrad.addColorStop(0.5, "rgba(255, 165, 0, 0.9)");
    flameGrad.addColorStop(1, "rgba(255, 69, 0, 0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-29, 0); // Adjusted for new size
    ctx.lineTo(-29 - flameSize, -10);
    ctx.lineTo(-29 - flameSize, 10);
    ctx.closePath();
    ctx.fill();

    // --- MODIFIED: A bigger missile body (approx. 30% larger) ---
    const grad = ctx.createLinearGradient(0, -9, 0, 9);
    grad.addColorStop(0, "#EAECEE");
    grad.addColorStop(1, "#979A9A");
    ctx.fillStyle = grad;
    roundRect(ctx, -29, -9, 58, 18, 7); // Increased from 44x14

    // --- MODIFIED: A more prominent warhead to match the new body size ---
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.moveTo(29, -9);
    ctx.lineTo(38, 0);
    ctx.lineTo(29, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* -------------------- B-52 Spirit Tower (Updated with better firing logic) -------------------- */
export class B52SpiritTower extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.b52Spirit;
  }

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this.cool = 1 / this.spec().fireRate;
    this.bomberState = "idle"; // 'idle', 'flyingToTarget', 'returning'
    const startX = MAP_GRID_W * TILE + 200;
    this.bomberPos = { x: startX, y: 150 };
  }

  spec() {
    return this.constructor.SPEC;
  }

  update(dt, enemiesList) {
    this.cool -= dt;
    const s = this.spec();

    if (this.bomberState === "idle") {
      if (this.cool <= 0 && enemiesList.length > 0) {
        this.bomberState = "flyingToTarget";
        const startX = MAP_GRID_W * TILE + 200;
        this.bomberPos = { x: startX, y: Math.random() * 100 + 50 };
        this.cool = 1 / s.fireRate;
      }
    } else if (this.bomberState === "flyingToTarget") {
      // --- CHANGE: The entire firing logic is updated here ---
      // Move the bomber from right to left
      this.bomberPos.x -= s.bulletSpeed * dt;

      // Define the distance before an enemy that the bomber should fire
      const firingRange = 300;
      let targetToShoot = null;

      // Continuously look for any enemy that enters the firing zone
      for (const enemy of enemiesList) {
        // Check if the enemy is alive, in front of the bomber, and within the firing range
        if (
          !enemy.dead &&
          this.bomberPos.x > enemy.pos.x &&
          this.bomberPos.x <= enemy.pos.x + firingRange
        ) {
          targetToShoot = enemy;
          break; // Found a valid target, lock it in
        }
      }

      // If a target was found, fire the missile and start returning
      if (targetToShoot) {
        projectiles.push(
          new StrategicMissile(
            { ...this.bomberPos },
            targetToShoot, // Fire at the newly found target
            s.dmg,
            s.bulletSpeed * 1.5
          )
        );
        this.bomberState = "returning";
      }

      // If the bomber flies off-screen to the left without firing, reset it
      if (this.bomberPos.x < -200) {
        this.bomberState = "returning";
      }
    } else if (this.bomberState === "returning") {
      // Continue moving the bomber to the left
      this.bomberPos.x -= s.bulletSpeed * dt;
      // Reset when the bomber is off-screen to the left
      if (this.bomberPos.x < -200) {
        this.bomberState = "idle";
      }
    }
  }

  draw() {
    if (this.bomberState !== "idle") {
      drawB2Spirit(this.bomberPos.x, this.bomberPos.y);
    }
  }
}

// --- MODIFIED: Helper function to draw a larger bomber ---
function drawB2Spirit(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-1, 1); // Flips the drawing to face left

  // A scaling factor to make the entire bomber larger
  const scale = 1.5;

  const primaryColor = "#343a40";
  const secondaryColor = "#495057";

  // Main body, scaled up
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.moveTo(30 * scale, 0);
  ctx.lineTo(-30 * scale, -25 * scale);
  ctx.lineTo(-40 * scale, -20 * scale);
  ctx.lineTo(-20 * scale, 0);
  ctx.lineTo(-40 * scale, 20 * scale);
  ctx.lineTo(-30 * scale, 25 * scale);
  ctx.closePath();
  ctx.fill();

  // Cockpit/detail, scaled up
  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.moveTo(25 * scale, 0);
  ctx.lineTo(15 * scale, -5 * scale);
  ctx.lineTo(15 * scale, 5 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Helper function to draw rounded rectangles for the missile body (Unchanged)
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
