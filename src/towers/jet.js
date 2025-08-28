import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist, clamp } from "../utils.js";
import { TOWER_TYPES } from "../config.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

/* ------------------ Guided Missile (Visually Upgraded) ------------------ */
class Missile {
  constructor(start, target, dmg, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed;
    this.dmg = dmg;
    this.dead = false;
    this.age = 0;
    this.turnSpeed = 4; // Radians per second
    this.angle = Math.atan2(target.pos.y - start.y, target.pos.x - start.x);
    this.trail = [];
  }

  update(dt) {
    this.age += dt;
    if (!this.target || this.target.dead || this.age > 8) {
      this.dead = true;
      this.createExplosion(this.pos, 40);
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    this.angle += clamp(angleDiff, -this.turnSpeed * dt, this.turnSpeed * dt);

    if (distance < 15) {
      this.dead = true;
      this.createExplosion(this.target.pos, 50);
      return;
    }

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    this.trail.push({ x: this.pos.x, y: this.pos.y, life: 1.0, width: 8 });
    for (let p of this.trail) {
      p.life -= dt * 1.2;
      p.width *= 0.98;
    }
    this.trail = this.trail.filter((p) => p.life > 0);
  }

  createExplosion(position, radius) {
    soundManager.playSound("jetExplosion", 0.3);

    enemies.forEach((enemy) => {
      if (!enemy.dead && dist(position, enemy.pos) < radius) {
        if (typeof enemy.damage === "function") {
          enemy.damage(this.dmg);
        }
      }
    });

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 100 + 25;
      const life = 0.6 + Math.random() * 0.6;
      particles.push({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        r: Math.random() * 10 + 5,
        c: `rgba(255, ${Math.floor(Math.random() * 100 + 155)}, 0, 0.85)`,
      });
    }
  }

  draw() {
    // Volumetric smoke trail
    ctx.save();
    let first = true;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const alpha = p.life * 0.5;
      ctx.fillStyle = `rgba(220, 220, 220, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.width, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Missile body
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    // Flame
    const flameSize = 25 + Math.random() * 10;
    const flameGrad = ctx.createLinearGradient(-15, 0, -15 - flameSize, 0);
    flameGrad.addColorStop(0, "rgba(135, 206, 250, 1)"); // Light Blue
    flameGrad.addColorStop(0.5, "rgba(255, 165, 0, 0.8)"); // Orange
    flameGrad.addColorStop(1, "rgba(255, 100, 0, 0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-15 - flameSize, -4);
    ctx.lineTo(-15 - flameSize, 4);
    ctx.closePath();
    ctx.fill();

    // Body
    const grad = ctx.createLinearGradient(0, -4, 0, 4);
    grad.addColorStop(0, "#f0f0f0");
    grad.addColorStop(1, "#a0a0a0");
    ctx.fillStyle = grad;
    roundRect(ctx, -15, -4, 30, 8, 3);

    // Warhead
    ctx.fillStyle = "#e74c3c"; // Red tip
    ctx.beginPath();
    ctx.moveTo(15, -4);
    ctx.lineTo(20, 0);
    ctx.lineTo(15, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* -------------------- Jet Tower Class -------------------- */
export class JetTower extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.jet;
  }

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this._s = {
      bodyAngle: Math.random() * Math.PI * 2,
      flightPos: { x: Math.random() * 800, y: -50 },
      patrolTarget: this.getRandomMapPoint(),
      afterburnerIntensity: 0,
      bank: 0,
    };
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.4;
    return { ...base, dmg: Math.round(base.dmg * mult) };
  }

  getRandomMapPoint() {
    const mapWidth = 800;
    const mapHeight = 600;
    const padding = 150;
    return {
      x: Math.random() * (mapWidth + padding * 2) - padding,
      y: Math.random() * (mapHeight + padding * 2) - padding,
    };
  }

  findTarget(enemiesList) {
    return enemiesList.find((e) => !e.dead) || null;
  }

  update(dt, enemiesList) {
    this.cool -= dt;

    const targetVec = {
      x: this._s.patrolTarget.x - this._s.flightPos.x,
      y: this._s.patrolTarget.y - this._s.flightPos.y,
    };
    const distToTarget = Math.sqrt(targetVec.x ** 2 + targetVec.y ** 2);

    if (distToTarget < 100) {
      this._s.patrolTarget = this.getRandomMapPoint();
    }

    const targetAngle = Math.atan2(targetVec.y, targetVec.x);
    let angleDiff = targetAngle - this._s.bodyAngle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    const turnRate = 2.5;
    const turn = clamp(angleDiff, -turnRate * dt, turnRate * dt);
    this._s.bodyAngle += turn;
    this._s.bank = -clamp(angleDiff, -1, 1) * 0.8; // Bank into turns

    const flightSpeed = 300;
    this._s.flightPos.x += Math.cos(this._s.bodyAngle) * flightSpeed * dt;
    this._s.flightPos.y += Math.sin(this._s.bodyAngle) * flightSpeed * dt;

    let target = this.findTarget(enemiesList);
    this._s.afterburnerIntensity = target ? 1 : 0.5;

    if (this.cool <= 0 && target) {
      const s = this.spec();
      this.cool = 1 / s.fireRate;
      const missileOrigin = {
        x: this._s.flightPos.x - Math.cos(this._s.bodyAngle) * 20,
        y: this._s.flightPos.y - Math.sin(this._s.bodyAngle) * 20,
      };

      projectiles.push(
        new Missile(missileOrigin, target, s.dmg, s.bulletSpeed)
      );
      soundManager.playSound("jetShoot", 0.3);
    }
  }

  draw() {
    // Draw shadow first so it's underneath
    drawJetShadow(this._s.flightPos.x, this._s.flightPos.y, this._s.bodyAngle);
    // Draw the beautiful jet
    drawJet(
      this._s.flightPos.x,
      this._s.flightPos.y,
      this._s.bodyAngle,
      this._s.bank,
      this._s.afterburnerIntensity
    );

    // --- NEW CODE: Display Level as Text for JetTower ---
    ctx.fillStyle = "#ffffff"; // White color for the text
    ctx.font = "12px Arial"; // Font size and type
    ctx.textAlign = "center"; // Center the text horizontally
    ctx.textBaseline = "middle"; // Center the text vertically
    // Position the text below the jet's flight position
    ctx.fillText(
      `Lv. ${this.level}`,
      this._s.flightPos.x,
      this._s.flightPos.y + 40
    );
    // --- END NEW CODE ---
  }
}

// Separate function for the shadow
function drawJetShadow(x, y, angle) {
  ctx.save();
  ctx.translate(x, y + 15); // Shadow offset
  ctx.rotate(angle);
  ctx.scale(1.0, 0.8); // Flatten the shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  // Simplified silhouette for the shadow
  ctx.moveTo(50, 0); // Nose
  ctx.lineTo(10, -35); // Left Wing
  ctx.lineTo(-40, -30);
  ctx.lineTo(-30, 0); // Tail section
  ctx.lineTo(-40, 30);
  ctx.lineTo(10, 35); // Right Wing
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The new, beautiful jet drawing function
function drawJet(x, y, angle, bank, afterburnerIntensity) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.rotate(bank); // Apply banking rotation for turns

  const darkGray = "#424949";
  const midGray = "#707B7C";
  const lightGray = "#B2BABB";

  // --- Afterburner ---
  if (afterburnerIntensity > 0) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#5DADE2";
    for (let i = 0; i < 2; i++) {
      // Two engines
      const engineY = i === 0 ? -9 : 9;
      const length = (40 + Math.random() * 20) * afterburnerIntensity;
      const coreLength = length * 0.8;

      // Outer Glow (Orange/Yellow)
      const outerGrad = ctx.createLinearGradient(
        -35,
        engineY,
        -35 - length,
        engineY
      );
      outerGrad.addColorStop(0, "rgba(241, 196, 15, 0.7)");
      outerGrad.addColorStop(1, "rgba(241, 196, 15, 0)");
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(-35, engineY - 5);
      ctx.lineTo(-35 - length, engineY);
      ctx.lineTo(-35, engineY + 5);
      ctx.closePath();
      ctx.fill();

      // Inner Core (Blue/White)
      const innerGrad = ctx.createLinearGradient(
        -35,
        engineY,
        -35 - coreLength,
        engineY
      );
      innerGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
      innerGrad.addColorStop(0.5, "rgba(130, 224, 255, 0.9)");
      innerGrad.addColorStop(1, "rgba(93, 173, 226, 0)");
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.moveTo(-35, engineY - 3);
      ctx.lineTo(-35 - coreLength, engineY);
      ctx.lineTo(-35, engineY + 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Body and Wings ---
  const bodyGrad = ctx.createLinearGradient(0, -10, 0, 10);
  bodyGrad.addColorStop(0, lightGray);
  bodyGrad.addColorStop(1, darkGray);

  // Main Wings
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.lineTo(-10, -35);
  ctx.lineTo(-25, -30);
  ctx.lineTo(0, -5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 5);
  ctx.lineTo(-10, 35);
  ctx.lineTo(-25, 30);
  ctx.lineTo(0, 5);
  ctx.closePath();
  ctx.fill();

  // Fuselage
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(50, 0); // Nose
  ctx.lineTo(-40, -15);
  ctx.lineTo(-40, 15);
  ctx.closePath();
  ctx.fill();

  // Tail Fins (Canted)
  ctx.fillStyle = midGray;
  ctx.beginPath();
  ctx.moveTo(-25, -12);
  ctx.lineTo(-40, -25);
  ctx.lineTo(-45, -23);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-25, 12);
  ctx.lineTo(-40, 25);
  ctx.lineTo(-45, 23);
  ctx.closePath();
  ctx.fill();

  // Cockpit Canopy
  const cockpitGrad = ctx.createLinearGradient(15, 0, 35, 0);
  cockpitGrad.addColorStop(0, "rgba(40, 40, 40, 0.9)");
  cockpitGrad.addColorStop(1, "rgba(150, 200, 255, 0.7)");
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.moveTo(38, 0);
  ctx.quadraticCurveTo(30, -7, 15, -6);
  ctx.lineTo(15, 6);
  ctx.quadraticCurveTo(30, 7, 38, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

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
