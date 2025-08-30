import { BaseTower } from "./BaseTower.js";
import { ctx, MAP_GRID_W, TILE } from "../core.js";
import { enemies, projectiles, particles } from "../state.js";
import { dist, clamp } from "../utils.js";
import { TOWER_TYPES } from "../config.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

/* -------------------- StrategicMissile (same behavior, visual base enlarged) -------------------- */
class StrategicMissile {
  constructor(start, target, dmg, speed) {
    this.pos = { ...start };
    this.target = target;
    // store the last-known position of the target so missile can still fly there if the target dies
    this.lockPos = target
      ? { x: target.pos.x, y: target.pos.y }
      : { x: start.x, y: start.y };
    this.speed = speed * 0.8; // Feels heavy
    this.dmg = dmg;
    this.dead = false;
    this.age = 0;
    this.turnSpeed = 2.5;
    this.angle = Math.atan2(this.lockPos.y - start.y, this.lockPos.x - start.x);
    this.trail = [];
    this.blastRadius = 400;
  }

  update(dt) {
    this.age += dt;

    // Age-out explosion
    if (this.age > 10) {
      this.dead = true;
      this.createExplosion(this.pos, this.blastRadius);
      return;
    }

    // If target died, stop following the live object but keep the last known lock position
    if (this.target && this.target.dead) {
      this.target = null;
      // lockPos already set in constructor, but keep it updated if you want last known last frame:
      // (We intentionally do NOT update lockPos further if target is gone.)
    }

    // Aim at either the live target (if still alive) or the locked last-known position
    const aim = this.target ? this.target.pos : this.lockPos;

    const dx = aim.x - this.pos.x;
    const dy = aim.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    this.angle += clamp(angleDiff, -this.turnSpeed * dt, this.turnSpeed * dt);

    // When we reach the aim point, explode (this ensures we don't explode early just because the original target died)
    if (distance < 20) {
      this.dead = true;
      this.createExplosion({ x: this.pos.x, y: this.pos.y }, this.blastRadius);
      return;
    }

    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.pos.x += vx * dt;
    this.pos.y += vy * dt;

    this.trail.push({ x: this.pos.x, y: this.pos.y, life: 1.2, width: 18 });
    for (let p of this.trail) {
      p.life -= dt * 1.1;
      p.width *= 0.97;
    }
    this.trail = this.trail.filter((p) => p.life > 0);
  }

  createExplosion(position, radius) {
    soundManager.playSound("b2Explosion", 0.3);
    enemies.forEach((enemy) => {
      if (!enemy.dead && dist(position, enemy.pos) < radius) {
        if (typeof enemy.damage === "function") enemy.damage(this.dmg);
      }
    });

    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 250 + 50;
      const life = 1.0 + Math.random() * 1.0;
      particles.push({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        r: Math.random() * 20 + 8,
        c: `rgba(255, ${Math.floor(Math.random() * 200)}, 0, 0.95)`,
      });
    }
  }

  draw() {
    ctx.save();
    for (let p of this.trail) {
      const alpha = p.life * 0.4;
      ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.width, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);

    const flameSize = 45 + Math.random() * 20;
    const flameGrad = ctx.createLinearGradient(-29, 0, -29 - flameSize, 0);
    flameGrad.addColorStop(0, "rgba(135, 206, 250, 1)");
    flameGrad.addColorStop(0.5, "rgba(255, 165, 0, 0.9)");
    flameGrad.addColorStop(1, "rgba(255, 69, 0, 0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-29, 0);
    ctx.lineTo(-29 - flameSize, -10);
    ctx.lineTo(-29 - flameSize, 10);
    ctx.closePath();
    ctx.fill();

    const grad = ctx.createLinearGradient(0, -9, 0, 9);
    grad.addColorStop(0, "#EAECEE");
    grad.addColorStop(1, "#979A9A");
    ctx.fillStyle = grad;
    roundRect(ctx, -29, -9, 58, 18, 7);

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

/* -------------------- B-52 Spirit Tower (with placed-base visual) -------------------- */
export class B52SpiritTower extends BaseTower {
  static get SPEC() {
    return TOWER_TYPES.b52Spirit;
  }

  constructor(gx, gy, key) {
    super(gx, gy, key);

    // store grid so we can draw the placed-base aligned to grid
    this.gx = gx;
    this.gy = gy;
    this.placedX = gx * TILE + TILE / 2;
    this.placedY = gy * TILE + TILE / 2;

    // bomber state
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
        soundManager.playSound("b2Alarm", 0.1);
      }
    } else if (this.bomberState === "flyingToTarget") {
      // Move the bomber from right to left
      this.bomberPos.x -= s.bulletSpeed * dt;

      const firingRange = 300;
      let targetToShoot = null;

      for (const enemy of enemiesList) {
        if (
          !enemy.dead &&
          this.bomberPos.x > enemy.pos.x &&
          this.bomberPos.x <= enemy.pos.x + firingRange
        ) {
          targetToShoot = enemy;
          break;
        }
      }

      if (targetToShoot) {
        projectiles.push(
          new StrategicMissile(
            { ...this.bomberPos },
            targetToShoot,
            s.dmg,
            s.bulletSpeed * 1.5
          )
        );
        soundManager.playSound("b2Launch", 0.3);
        this.bomberState = "returning";
      }

      if (this.bomberPos.x < -200) {
        this.bomberState = "returning";
      }
    } else if (this.bomberState === "returning") {
      this.bomberPos.x -= s.bulletSpeed * dt;
      if (this.bomberPos.x < -200) {
        this.bomberState = "idle";
      }
    }
  }

  draw() {
    // draw placed base/hangar where this tower occupies the map cell
    this.drawPlacedBase(this.placedX, this.placedY, TILE * 0.9);

    // draw bomber in flight when active
    if (this.bomberState !== "idle") {
      drawB2Spirit(this.bomberPos.x, this.bomberPos.y);

      // Display level as text over the bomber
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `Lv. ${this.level}`,
        this.bomberPos.x,
        this.bomberPos.y + 40
      );
    }

    // Optionally show level on the placed base too
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `B-52 Lv.${this.level}`,
      this.placedX,
      this.placedY + TILE * 0.36
    );
  }

  // Draw a delivered placed-base for the B-52 (hangar + runway details)
  drawPlacedBase(cx, cy, size) {
    ctx.save();

    const padR = size * 0.5;
    const runwayW = padR * 1.6;
    const runwayH = padR * 0.32;

    // subtle pad shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 10, padR * 1.05, padR * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // base oval / concrete
    ctx.beginPath();
    ctx.ellipse(cx, cy, padR, padR * 0.85, 0, 0, Math.PI * 2);
    const baseGrad = ctx.createLinearGradient(
      cx - padR,
      cy - padR,
      cx + padR,
      cy + padR
    );
    baseGrad.addColorStop(0, "#2b2f33");
    baseGrad.addColorStop(1, "#1e2225");
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // central runway rectangle
    ctx.save();
    ctx.translate(cx, cy - padR * 0.05);
    roundRect(ctx, -runwayW / 2, -runwayH / 2, runwayW, runwayH, 6);
    ctx.fillStyle = "#1b1f22";
    ctx.fill();
    // center runway markings
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    const markCount = 6;
    for (let i = 0; i < markCount; i++) {
      const w = runwayW / (markCount * 2);
      const x = -runwayW / 2 + (i * 2 + 0.5) * w;
      ctx.fillRect(x - w / 2, -4, w, 8);
    }
    ctx.restore();

    // hangar building (small) on pad edge
    ctx.save();
    const hangarW = padR * 0.7;
    const hangarH = padR * 0.42;
    ctx.translate(cx + padR * 0.55, cy + padR * 0.24);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(
      -hangarW / 2 + 4,
      hangarH * 0.35 + 6,
      hangarW - 8,
      hangarH * 0.18
    );
    // body
    ctx.fillStyle = "#2d3436";
    roundRect(ctx, -hangarW / 2, -hangarH / 2, hangarW, hangarH, 6);
    // door
    ctx.fillStyle = "rgba(200,200,200,0.04)";
    roundRect(ctx, -hangarW / 4, -hangarH / 6, hangarW / 2, hangarH / 2, 4);
    // small roof window
    ctx.fillStyle = "rgba(120,180,245,0.85)";
    roundRect(
      ctx,
      -hangarW / 2 + 8,
      -hangarH / 2 + 8,
      hangarW / 4,
      hangarH / 6,
      3
    );
    ctx.restore();

    // crates and fuel drums
    const crateColors = ["#6b4f3a", "#4c6b3a", "#646464"];
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI / 6) * (i - 1);
      const rr = padR * (0.85 + i * 0.05);
      const x = cx + Math.cos(angle) * rr;
      const y = cy + Math.sin(angle) * rr;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i - 1) * 0.15);
      ctx.fillStyle = crateColors[i % crateColors.length];
      roundRect(ctx, -8, -6, 16, 12, 2);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // control kiosk (left)
    ctx.save();
    ctx.translate(cx - padR * 0.45, cy - padR * 0.38);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-10, 8, 24, 6);
    ctx.fillStyle = "#273033";
    roundRect(ctx, -12, -10, 24, 18, 3);
    ctx.fillStyle = "rgba(160,200,255,0.9)";
    roundRect(ctx, -6, -6, 12, 8, 2);
    ctx.restore();

    // rotating beacon / antenna near kiosk
    ctx.save();
    const t = Date.now() / 400;
    ctx.translate(cx - padR * 0.28, cy - padR * 0.5);
    ctx.rotate(t % (Math.PI * 2));
    ctx.fillStyle = "#2e3a3d";
    roundRect(ctx, -3, -10, 6, 20, 2);
    ctx.fillStyle = "#9fd3ff";
    ctx.beginPath();
    ctx.arc(0, -12, 3.5 + Math.sin(t) * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // rim lights (pulsing)
    const lightCount = 10;
    const pulse = (Math.sin(Date.now() / 250) + 1) * 0.5;
    for (let i = 0; i < lightCount; i++) {
      const a = (i / lightCount) * Math.PI * 2;
      const lx = cx + Math.cos(a) * (padR + 6);
      const ly = cy + Math.sin(a) * (padR + 6);
      const alpha = 0.35 * (0.6 + 0.4 * Math.sin(Date.now() / 250 + i));
      ctx.beginPath();
      ctx.fillStyle = `rgba(140, 220, 255, ${alpha})`;
      ctx.arc(lx, ly, 3 + Math.sin(Date.now() / 350 + i) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // small painted hazard ring
    ctx.beginPath();
    ctx.arc(cx, cy, padR + 4, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(180,180,180,0.06)";
    ctx.stroke();

    ctx.restore();
  }
}

// Draw the on-screen B-52 sprite used in-flight
function drawB2Spirit(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-1, 1); // face left

  const scale = 1.3;
  const primaryColor = "#343a40";
  const secondaryColor = "#495057";
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

  ctx.fillStyle = secondaryColor;
  ctx.beginPath();
  ctx.moveTo(25 * scale, 0);
  ctx.lineTo(15 * scale, -5 * scale);
  ctx.lineTo(15 * scale, 5 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// helper roundRect
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
