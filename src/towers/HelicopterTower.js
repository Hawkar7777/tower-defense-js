import { BaseTower } from "./BaseTower.js";
import { ctx } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist, clamp } from "../utils.js";
import { TOWER_TYPES } from "../config.js";

/* ---------------- Helicopter Tracer Bullet ---------------- */
class HeliBullet {
  constructor(start, target, dmg, speed) {
    this.pos = { ...start };
    this.target = target;
    this.speed = speed;
    this.dmg = dmg;
    this.dead = false;
    this.age = 0;
    this._lastAngle = Math.atan2(
      target.pos.y - start.y,
      target.pos.x - start.x
    );
  }

  update(dt) {
    this.age += dt;
    if (!this.target || this.target.dead || this.age > 1.5) {
      this.dead = true;
      return;
    }

    const dx = this.target.pos.x - this.pos.x;
    const dy = this.target.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this._lastAngle = Math.atan2(dy, dx);

    if (distance < 8) {
      if (typeof this.target.damage === "function") {
        this.target.damage(this.dmg);
      }
      this.dead = true;
      return;
    }

    const vx = Math.cos(this._lastAngle) * this.speed;
    const vy = Math.sin(this._lastAngle) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    const tailX = this.pos.x - Math.cos(this._lastAngle) * 25;
    const tailY = this.pos.y - Math.sin(this._lastAngle) * 25;
    const grad = ctx.createLinearGradient(this.pos.x, this.pos.y, tailX, tailY);
    grad.addColorStop(0, "#fffbe6");
    grad.addColorStop(1, "rgba(255, 221, 153, 0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.restore();
  }
}

/* ---------------- Helicopter Tower Class ---------------- */
export class HelicopterTower extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.helicopter;
  }

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this._s = {
      gunAngle: Math.PI,
      rotorAngle: Math.random() * Math.PI * 2,
      flightAngle: Math.PI,
      bodyAngle: Math.PI,
      flightPos: { ...this.center },
      patrolRadius: 45,
      bodyTilt: 0,
    };
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.25;
    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: base.range * (1 + (this.level - 1) * 0.1),
    };
  }

  getAttackOrigin() {
    const flightX = this._s.flightPos.x;
    const flightY = this._s.flightPos.y;
    const altitude = -30;
    const flightBob = Math.sin(this._s.rotorAngle / 3) * 1.5;

    const gunMountX = 12;
    const gunMountY = 10;
    const barrelLength = 12;

    const bodyAngle = this._s.bodyAngle;
    const mountRotatedX =
      gunMountX * Math.cos(bodyAngle) - gunMountY * Math.sin(bodyAngle);
    const mountRotatedY =
      gunMountX * Math.sin(bodyAngle) + gunMountY * Math.cos(bodyAngle);

    const mountX = flightX + mountRotatedX;
    const mountY = flightY + altitude + flightBob + mountRotatedY;

    const barrelTipX = mountX + Math.cos(this._s.gunAngle) * barrelLength;
    const barrelTipY = mountY + Math.sin(this._s.gunAngle) * barrelLength;

    return { x: barrelTipX, y: barrelTipY };
  }

  findTarget(enemiesList) {
    let target = null;
    let minDist = Infinity;
    const s = this.spec();
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
    this.cool -= dt;
    this._s.rotorAngle += dt * 45;
    this._s.flightAngle -= dt * 0.7;

    this._s.flightPos = {
      x: this.center.x + Math.cos(this._s.flightAngle) * this._s.patrolRadius,
      y: this.center.y + Math.sin(this._s.flightAngle) * this._s.patrolRadius,
    };

    const travelDirection = this._s.flightAngle - Math.PI / 2;
    const diffBody =
      ((travelDirection - this._s.bodyAngle + Math.PI) % (Math.PI * 2)) -
      Math.PI;
    this._s.bodyAngle += diffBody * Math.min(1, dt * 5.0);

    this._s.bodyTilt = Math.sin(this._s.flightAngle) * 0.2;

    let target = this.findTarget(enemiesList);

    if (target) {
      const origin = this.getAttackOrigin();
      const want = Math.atan2(target.pos.y - origin.y, target.pos.x - origin.x);
      const diff =
        ((want - this._s.gunAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
      this._s.gunAngle += clamp(diff, -dt * 8, dt * 8);
    }

    if (this.cool <= 0 && target) {
      const s = this.spec();
      this.cool = 1 / s.fireRate;
      const origin = this.getAttackOrigin();
      projectiles.push(new HeliBullet(origin, target, s.dmg, s.bulletSpeed));

      particles.push({
        x: origin.x,
        y: origin.y,
        vx: 0,
        vy: 0,
        life: 0.08,
        r: 10,
        c: "rgba(255, 220, 150, 0.9)",
      });
    }
  }

  draw() {
    const { x, y } = this.center;
    const flightX = this._s.flightPos.x;
    const flightY = this._s.flightPos.y;
    const altitude = -30;
    const flightBob = Math.sin(this._s.rotorAngle / 3) * 1.5;

    drawHelipad(x, y);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      flightX,
      flightY + 2,
      30,
      15,
      this._s.bodyAngle,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.save();
    ctx.translate(flightX, flightY + altitude + flightBob);
    ctx.rotate(this._s.bodyAngle);
    ctx.rotate(this._s.bodyTilt);

    // --- NEW COLOR PALETTE ---
    const darkGray = "#2d3436";
    const midGray = "#4b5458";
    const lightGray = "#636e72";
    const mainYellow = "#f1c40f";
    const highlightYellow = "#f39c12";

    // Landing Skids
    ctx.strokeStyle = darkGray;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 12);
    ctx.lineTo(-12, 16);
    ctx.moveTo(10, 12);
    ctx.lineTo(12, 16);
    ctx.moveTo(-18, 16);
    ctx.lineTo(18, 16);
    ctx.stroke();

    // Main Body (Yellow)
    const bodyGrad = ctx.createLinearGradient(0, -15, 0, 15);
    bodyGrad.addColorStop(0, highlightYellow);
    bodyGrad.addColorStop(1, mainYellow);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(22, -8);
    ctx.quadraticCurveTo(28, 0, 22, 8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    // Gray Accent Stripe
    ctx.fillStyle = lightGray;
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(10, -8);
    ctx.lineTo(8, 0);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();

    // Cockpit Glass
    const glassGrad = ctx.createRadialGradient(22, 0, 2, 22, 0, 15);
    glassGrad.addColorStop(0, "rgba(200, 220, 255, 0.9)");
    glassGrad.addColorStop(1, "rgba(45, 52, 54, 0.7)");
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(18, -7);
    ctx.quadraticCurveTo(26, 0, 18, 7);
    ctx.closePath();
    ctx.fill();

    // Tail Boom (Yellow)
    ctx.fillStyle = mainYellow;
    roundRect(ctx, -45, -3, 20, 6, 3);

    // Tail Stabilizer & Rotor (Gray)
    ctx.fillStyle = midGray;
    roundRect(ctx, -48, -10, 6, 20, 2);
    ctx.save();
    ctx.translate(-45, 0);
    ctx.rotate(this._s.rotorAngle * 2.5);
    ctx.fillStyle = darkGray;
    ctx.fillRect(-1.5, -8, 3, 16);
    ctx.fillRect(-8, -1.5, 16, 3);
    ctx.restore();

    // Weapon Pylons (Gray)
    ctx.fillStyle = midGray;
    roundRect(ctx, -10, -15, 12, 5, 2);
    roundRect(ctx, -10, 10, 12, 5, 2);

    // Engine Vents (Gray)
    ctx.fillStyle = darkGray;
    ctx.fillRect(0, -12, 15, 4);

    // Gun Turret
    ctx.save();
    ctx.rotate(-this._s.bodyAngle - this._s.bodyTilt);
    ctx.translate(12, 10);
    ctx.rotate(this._s.gunAngle);
    ctx.fillStyle = midGray;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darkGray;
    roundRect(ctx, -3, -2.5, 18, 5, 1.5);
    ctx.restore();

    // Main Rotor Hub & Blades
    ctx.fillStyle = darkGray;
    ctx.beginPath();
    ctx.arc(0, -10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -10);
    ctx.rotate(this._s.rotorAngle);
    const rotorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    rotorGrad.addColorStop(0, "rgba(20, 20, 20, 0.2)");
    rotorGrad.addColorStop(1, "rgba(20, 20, 20, 0)");
    ctx.fillStyle = rotorGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(20, 20, 20, 0.5)";
    ctx.fillRect(-50, -2, 100, 4);
    // Yellow Rotor Tips
    ctx.fillStyle = mainYellow;
    ctx.fillRect(40, -2, 10, 4);
    ctx.fillRect(-50, -2, 10, 4);
    ctx.restore();

    ctx.restore();
  }
}

function drawHelipad(x, y) {
  ctx.fillStyle = "#7f8c8d";
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    ctx.lineTo(x + 28 * Math.cos(angle), y + 28 * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f1c40f";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", x, y + 1);
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
