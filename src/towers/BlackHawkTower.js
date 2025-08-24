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

/* ---------------- Black Hawk Tower Class ---------------- */
export class BlackHawkTower extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.blackHawk;
  }

  constructor(gx, gy, key) {
    super(gx, gy, key);
    this._s = {
      gunAngle: Math.PI,
      rotorAngle: Math.random() * Math.PI * 2,
      flightAngle: Math.PI,
      bodyAngle: Math.PI,
      flightPos: { ...this.center },
      patrolRadius: 60, // Larger patrol radius for a more imposing presence
      bodyTilt: 0,
    };
  }

  spec() {
    const base = this.constructor.SPEC;
    const mult = 1 + (this.level - 1) * 0.3; // Increased upgrade multiplier for more power
    return {
      ...base,
      dmg: Math.round(base.dmg * mult),
      range: base.range * (1 + (this.level - 1) * 0.15),
    };
  }

  getAttackOrigin(side) {
    const flightX = this._s.flightPos.x;
    const flightY = this._s.flightPos.y;
    const altitude = -40; // Higher altitude for a more realistic look
    const flightBob = Math.sin(this._s.rotorAngle / 3) * 2.0;

    const bodyAngle = this._s.bodyAngle;
    const gunMountY = 10;
    const barrelLength = 15;

    let gunMountX;
    if (side === "left") {
      gunMountX = -15;
    } else {
      // right
      gunMountX = 15;
    }

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
      const origin = this.getAttackOrigin("left"); // Use one side for angle calculation
      const want = Math.atan2(target.pos.y - origin.y, target.pos.x - origin.x);
      const diff =
        ((want - this._s.gunAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
      this._s.gunAngle += clamp(diff, -dt * 8, dt * 8);
    }

    if (this.cool <= 0 && target) {
      const s = this.spec();
      this.cool = 1 / s.fireRate;
      const originLeft = this.getAttackOrigin("left");
      projectiles.push(
        new HeliBullet(originLeft, target, s.dmg, s.bulletSpeed)
      );

      const originRight = this.getAttackOrigin("right");
      projectiles.push(
        new HeliBullet(originRight, target, s.dmg, s.bulletSpeed)
      );

      particles.push({
        x: originLeft.x,
        y: originLeft.y,
        vx: 0,
        vy: 0,
        life: 0.08,
        r: 10,
        c: "rgba(255, 220, 150, 0.9)",
      });
      particles.push({
        x: originRight.x,
        y: originRight.y,
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
    const altitude = -40; // Higher altitude for a more realistic look
    const flightBob = Math.sin(this._s.rotorAngle / 3) * 2.0;

    drawHelipad(x, y);

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(
      flightX,
      flightY + 4,
      40,
      20,
      this._s.bodyAngle,
      0,
      Math.PI * 2
    );
    ctx.fill();

    drawBlackHawk(
      x,
      y,
      flightX,
      flightY,
      altitude,
      flightBob,
      this._s.bodyAngle,
      this._s.bodyTilt,
      this._s.rotorAngle,
      this._s.gunAngle
    );
  }
}

function drawBlackHawk(
  x,
  y,
  flightX,
  flightY,
  altitude,
  flightBob,
  bodyAngle,
  bodyTilt,
  rotorAngle,
  gunAngle
) {
  ctx.save();
  ctx.translate(flightX, flightY + altitude + flightBob);
  ctx.rotate(bodyAngle);
  ctx.rotate(bodyTilt);

  const darkGray = "#2c3e50";
  const midGray = "#34495e";
  const lightGray = "#7f8c8d";
  const oliveDrab = "#556B2F";
  const darkOlive = "#4F6228";

  // Main Body
  const bodyGrad = ctx.createLinearGradient(0, -20, 0, 20);
  bodyGrad.addColorStop(0, oliveDrab);
  bodyGrad.addColorStop(1, darkOlive);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-40, -12);
  ctx.lineTo(30, -15);
  ctx.quadraticCurveTo(45, 0, 30, 15);
  ctx.lineTo(-40, 12);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  const cockpitGrad = ctx.createLinearGradient(30, -12, 30, 12);
  cockpitGrad.addColorStop(0, "rgba(173, 216, 230, 0.7)");
  cockpitGrad.addColorStop(1, "rgba(45, 52, 54, 0.8)");
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.moveTo(30, -15);
  ctx.quadraticCurveTo(45, 0, 30, 15);
  ctx.lineTo(20, 13);
  ctx.quadraticCurveTo(35, 0, 20, -13);
  ctx.closePath();
  ctx.fill();

  // Tail Boom
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, -70, -4, 30, 8, 4);

  // Tail Rotor Assembly
  ctx.fillStyle = midGray;
  ctx.beginPath();
  ctx.moveTo(-70, -4);
  ctx.lineTo(-75, -20);
  ctx.lineTo(-65, -20);
  ctx.closePath();
  ctx.fill();

  // Tail Rotor
  ctx.save();
  ctx.translate(-70, -12);
  ctx.rotate(rotorAngle * 3);
  ctx.fillStyle = darkGray;
  ctx.fillRect(-2, -10, 4, 20);
  ctx.fillRect(-10, -2, 20, 4);
  ctx.restore();

  // Engine Nacelles
  ctx.fillStyle = midGray;
  roundRect(ctx, -15, -22, 30, 10, 5);

  // Main Rotor Hub
  ctx.fillStyle = darkGray;
  ctx.beginPath();
  ctx.arc(0, -25, 8, 0, Math.PI * 2);
  ctx.fill();

  // Main Rotor Blades
  ctx.save();
  ctx.translate(0, -25);
  ctx.rotate(rotorAngle);
  const rotorGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
  rotorGrad.addColorStop(0, "rgba(20, 20, 20, 0.3)");
  rotorGrad.addColorStop(1, "rgba(20, 20, 20, 0)");
  ctx.fillStyle = rotorGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20, 20, 20, 0.6)";
  for (let i = 0; i < 4; i++) {
    ctx.rotate((Math.PI / 2) * i);
    ctx.fillRect(5, -2, 65, 4);
  }
  ctx.restore();

  // Left Machine Gun
  ctx.save();
  ctx.translate(-15, 10); // Position on the left side
  ctx.rotate(gunAngle);
  ctx.fillStyle = darkGray;
  roundRect(ctx, -5, -2.5, 20, 5, 2);
  ctx.restore();

  // Right Machine Gun
  ctx.save();
  ctx.translate(15, 10); // Position on the right side
  ctx.rotate(gunAngle);
  ctx.fillStyle = darkGray;
  roundRect(ctx, -5, -2.5, 20, 5, 2);
  ctx.restore();

  ctx.restore();
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
