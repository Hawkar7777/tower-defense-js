// Devastator.js
import { ctx } from "../core.js";
import { dist } from "../utils.js";
import { state, towers, projectiles } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { spawnExplosion, spawnMuzzle } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js";
import { pointAt } from "../path.js";
import { roundRect } from "../helpers.js"; // Assuming you have this helper for rounded rectangles
import { soundManager } from "../assets/sounds/SoundManager.js";

export class Devastator extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Devastator;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    // Initialize unique stats
    this.attackRange = bossType.attackRange;
    this.attackDamage = bossType.attackDamage * difficultyMult;
    this.attackRate = bossType.attackRate;
    this.burstDuration = bossType.burstDuration;
    this.spinUpTime = bossType.spinUpTime;
    this.cooldown = bossType.cooldown;

    // State machine and timers
    this.attackState = "idle"; // Can be 'idle', 'spinning', 'firing', 'cooldown'
    this.stateTimer = 0;
    this.targetTower = null;

    // Visuals
    this.turretRotation = 0;
    this.barrelRotation = 0; // For animating the Gatling gun
    this.fireTimer = 0;
  }

  findTargetTower() {
    let closestTower = null;
    let minDistance = Infinity;
    for (const tower of towers) {
      if (tower.hp > 0) {
        const d = dist(this.pos, tower.center);
        if (d < this.attackRange && d < minDistance) {
          minDistance = d;
          closestTower = tower;
        }
      }
    }
    return closestTower;
  }

  update(dt) {
    super.update(dt);
    if (this.dead) return;

    soundManager.playSound("devastatorMove", 0.1);

    this.stateTimer -= dt;

    // If target was removed from towers array, force re-acquire
    if (
      this.targetTower &&
      (this.targetTower.hp <= 0 || towers.indexOf(this.targetTower) === -1)
    ) {
      this.targetTower = null;
    }

    // --- State Machine Logic ---
    switch (this.attackState) {
      case "idle":
        // Only acquire towers that are actually in the towers array
        this.targetTower = this.findTargetTower();
        if (this.targetTower) {
          this.attackState = "spinning";
          this.stateTimer = this.spinUpTime;
        }
        break;

      case "spinning":
        // Animate the barrels spinning up
        this.barrelRotation += dt * 25;

        // if target is missing, go idle (also handles sold/removed)
        if (
          !this.targetTower ||
          this.targetTower.hp <= 0 ||
          towers.indexOf(this.targetTower) === -1
        ) {
          this.attackState = "idle";
          this.targetTower = null;
          return;
        }

        this.turretRotation = Math.atan2(
          this.targetTower.center.y - this.pos.y,
          this.targetTower.center.x - this.pos.x
        );
        if (this.stateTimer <= 0) {
          this.attackState = "firing";
          this.stateTimer = this.burstDuration;
          this.fireTimer = 0;
        }
        break;

      case "firing":
        // Animate barrels spinning faster
        this.barrelRotation += dt * 60;

        // if target is missing (killed or removed) -> go to cooldown
        if (
          !this.targetTower ||
          this.targetTower.hp <= 0 ||
          towers.indexOf(this.targetTower) === -1
        ) {
          this.attackState = "cooldown";
          this.stateTimer = this.cooldown;
          this.targetTower = null;
          return;
        }

        this.turretRotation = Math.atan2(
          this.targetTower.center.y - this.pos.y,
          this.targetTower.center.x - this.pos.x
        );

        // Fire bullets at the specified rate
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
          this.fireTimer = 1 / this.attackRate;
          this.shootTower(this.targetTower);
        }

        if (this.stateTimer <= 0) {
          this.attackState = "cooldown";
          this.stateTimer = this.cooldown;
        }
        break;

      case "cooldown":
        // Animate barrels spinning down
        this.barrelRotation +=
          dt * (5 + (this.stateTimer / this.cooldown) * 20);
        if (this.stateTimer <= 0) {
          this.attackState = "idle";
        }
        break;
    }
  }

  shootTower(target) {
    // Safety: abort if target was removed between selection and firing
    if (!target || towers.indexOf(target) === -1) return;

    soundManager.playSound("devastatorShoot", 0.3);
    const muzzlePos = {
      x: this.pos.x + Math.cos(this.turretRotation) * (this.r * 1.2),
      y: this.pos.y + Math.sin(this.turretRotation) * (this.r * 1.2),
    };

    spawnMuzzle(
      muzzlePos.x,
      muzzlePos.y,
      this.turretRotation,
      this.glowColor,
      1.5
    );

    const projectile = {
      x: muzzlePos.x,
      y: muzzlePos.y,
      target: target, // keep reference but validate each update
      speed: 600,
      damage: this.attackDamage,
      dead: false,
      isEnemyProjectile: true,

      update: function (dt) {
        // If the target was removed from the towers array (sold/cleared) or undefined -> stop projectile
        if (!this.target || towers.indexOf(this.target) === -1) {
          this.dead = true;
          return;
        }

        // If target was destroyed -> stop projectile
        if (this.target.hp <= 0) {
          this.dead = true;
          return;
        }

        const dx = this.target.center.x - this.x;
        const dy = this.target.center.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d < 10) {
          this.target.hp -= this.damage;
          this.dead = true;
          if (this.target.hp <= 0) {
            spawnExplosion(this.x, this.y, 20, this.glowColor);
            const index = towers.indexOf(this.target);
            if (index > -1) towers.splice(index, 1);
            updateOccupiedCells();
          }
        } else {
          this.x += (dx / d) * this.speed * dt;
          this.y += (dy / d) * this.speed * dt;
        }
      },

      draw: function () {
        ctx.strokeStyle = "#ffae42";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);

        // guard in case target no longer exists
        let angle = 0;
        if (this.target && towers.indexOf(this.target) !== -1) {
          angle = Math.atan2(
            this.target.center.y - this.y,
            this.target.center.x - this.x
          );
        }

        ctx.lineTo(
          this.x - Math.cos(angle) * 10,
          this.y - Math.sin(angle) * 10
        );
        ctx.stroke();
      },
    };
    projectiles.push(projectile);
  }

  // --- "SO NICEEEEE" HIGH-DETAIL DRAW METHOD (with HP number under bar) ---
  draw() {
    // Draw the health bar via BaseBoss
    super.draw();
    if (this.dead) return;

    // --- Numeric HP under the health bar (Warlock-style placement) ---
    const { x, y } = this.pos;
    const w = 55,
      h = 6;
    const barY = y - this.r - 18; // same placement as Warlock
    const hpText = `${Math.round(this.hp)}/${Math.round(this.maxHp)}`;
    const textY = barY + h + 10; // place just under the bar

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dark stroke for readability
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(hpText, x, textY);

    // White fill on top
    ctx.fillStyle = "#fff";
    ctx.fillText(hpText, x, textY);

    // --- Continue with all your existing Devastator visuals ---
    const r = this.r;

    const lookAheadPos = pointAt(this.t + 0.01);
    const bodyRotation = Math.atan2(lookAheadPos.y - y, lookAheadPos.x - x);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bodyRotation);

    // --- Dynamic Shadow ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    roundRect(-r, -r * 0.8, r * 2, r * 1.6, 8, ctx.fillStyle, true);

    // --- Detailed Wheels ---
    const wheelRadius = r * 0.3;
    const wheelY = r * 0.75;
    const wheelX = r * 0.55;
    const wheels = [
      { x: wheelX, y: -wheelY },
      { x: wheelX, y: wheelY },
      { x: -wheelX, y: -wheelY },
      { x: -wheelX, y: wheelY },
    ];

    for (const wheel of wheels) {
      // Tire
      ctx.fillStyle = "#2d2d2d";
      ctx.beginPath();
      ctx.arc(wheel.x, wheel.y, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      // Hub
      ctx.fillStyle = "#555";
      ctx.beginPath();
      ctx.arc(wheel.x, wheel.y, wheelRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Detailed Humvee Body ---
    ctx.strokeStyle = "#2e281a";
    ctx.lineWidth = 2;

    // Base chassis layer
    ctx.fillStyle = this.detailColor;
    roundRect(
      -r * 0.9,
      -r * 0.7,
      r * 1.8,
      r * 1.4,
      5,
      this.detailColor,
      true,
      "#111"
    );

    // Main Body Panels with Gradient for depth
    const bodyGrad = ctx.createLinearGradient(0, -r, 0, r);
    bodyGrad.addColorStop(0, "#d9c690"); // Lighter top
    bodyGrad.addColorStop(1, this.color); // Darker bottom
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(r * 0.9, -r * 0.7); // Hood corner
    ctx.lineTo(r * 1.1, -r * 0.6); // Bumper
    ctx.lineTo(r * 1.1, r * 0.6);
    ctx.lineTo(r * 0.9, r * 0.4);
    ctx.lineTo(-r * 0.9, r * 0.7); // Rear
    ctx.lineTo(-r * 1.0, r * 0.6);
    ctx.lineTo(-r * 1.0, -r * 0.6);
    ctx.lineTo(-r * 0.9, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cabin
    ctx.beginPath();
    ctx.moveTo(r * 0.3, -r * 0.6);
    ctx.lineTo(-r * 0.7, -r * 0.7);
    ctx.lineTo(-r * 0.7, r * 0.7);
    ctx.lineTo(r * 0.3, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Angled Windshield
    ctx.fillStyle = "rgba(20, 30, 40, 0.8)";
    ctx.beginPath();
    ctx.moveTo(r * 0.28, -r * 0.5);
    ctx.lineTo(r * 0.1, -r * 0.6);
    ctx.lineTo(r * 0.1, r * 0.6);
    ctx.lineTo(r * 0.28, r * 0.5);
    ctx.closePath();
    ctx.fill();

    // Front Grille & Headlights
    ctx.fillStyle = this.detailColor;
    ctx.fillRect(r * 1.0, -r * 0.4, 5, r * 0.8);
    ctx.fillStyle = "#ffc93c"; // Headlight Glow
    ctx.beginPath();
    ctx.arc(r * 1.05, -r * 0.5, 5, 0, Math.PI * 2);
    ctx.arc(r * 1.05, r * 0.5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.6);
    ctx.lineTo(-r * 0.6, -r * 0.6 - 20);
    ctx.stroke();

    // --- GAU-19/A Gatling Gun Turret ---
    ctx.save();
    ctx.rotate(this.turretRotation - bodyRotation);
    const gunX = -r * 0.1;

    // Turret Ring
    ctx.fillStyle = "#444";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(gunX, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ammo Box
    ctx.fillStyle = "#6b5e37";
    ctx.fillRect(gunX - 25, -20, 20, 40);
    ctx.strokeRect(gunX - 25, -20, 20, 40);

    // Gun Housing
    const gunGrad = ctx.createLinearGradient(0, -10, 0, 10);
    gunGrad.addColorStop(0, "#888");
    gunGrad.addColorStop(1, "#555");
    ctx.fillStyle = gunGrad;
    roundRect(gunX - 15, -10, r, 20, 4, ctx.fillStyle, true, "#222");

    // Barrel Assembly
    ctx.save();
    ctx.translate(gunX + r - 10, 0);
    ctx.rotate(this.barrelRotation);

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Three rotating barrels
    const barrelLength = r * 0.8;
    const barrelRadius = 6;
    for (let i = 0; i < 3; i++) {
      const angle = i * ((Math.PI * 2) / 3);
      const bx = Math.cos(angle) * barrelRadius;
      const by = Math.sin(angle) * barrelRadius;
      ctx.fillStyle = "#444";
      ctx.fillRect(bx, by - 1.5, barrelLength, 3);
    }

    ctx.restore(); // un-rotate barrels
    ctx.restore(); // un-rotate turret
    ctx.restore(); // un-rotate body
  }
}
