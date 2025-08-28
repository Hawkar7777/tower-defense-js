import { ctx } from "../core.js";
import { clamp, dist } from "../utils.js";
import { state, towers, projectiles } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { spawnExplosion } from "../effects.js";
import { updateOccupiedCells } from "../occupation.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class Juggernaut extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Juggernaut;
    const difficultyMult = 1 + state.wave * 0.15;
    super(bossType, difficultyMult);

    this.attackRange = bossType.attackRange;
    this.attackDamage = bossType.attackDamage * difficultyMult;
    this.attackRate = bossType.attackRate;
    this.attackCooldown = 0;

    // Visual / realism properties
    this.targetTower = null;
    this.turretRotation = 0;

    this.turretRecoil = 0; // recoil offset (pixels)
    this.recoilVelocity = 0; // recoil spring velocity
    this.muzzleFlashTimer = 0; // short flash on firing
    this.smokeCooldown = 0; // for ambient smoke
    this.armorDetail = 0.18; // how visible the plating is
  }

  // Find closest tower in range
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

    // recoil spring physics (simple critically-damped spring)
    const recoilSpringK = 360; // stiffness
    const recoilDamping = 48; // damping
    // x'' = -k * x - d * x'
    const accel =
      -recoilSpringK * this.turretRecoil - recoilDamping * this.recoilVelocity;
    this.recoilVelocity += accel * dt;
    this.turretRecoil += this.recoilVelocity * dt;
    // clamp tiny oscillations
    if (Math.abs(this.turretRecoil) < 0.001) {
      this.turretRecoil = 0;
      this.recoilVelocity = 0;
    }

    // timers
    this.attackCooldown -= dt;
    this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);
    this.smokeCooldown -= dt;

    // ambient smoke occasionally from engine (subtle)
    if (this.smokeCooldown <= 0) {
      this.smokeCooldown = 0.7 + Math.random() * 1.5;
      // small puff using spawnExplosion as subtle smoke (size and color low-key)
      // If you have a dedicated smoke effect, swap it here.
      spawnExplosion(
        this.pos.x - Math.cos(this.turretRotation) * this.r * 0.4,
        this.pos.y - Math.sin(this.turretRotation) * this.r * 0.4,
        8,
        "rgba(80,80,80,0.12)"
      );
    }

    // targeting
    this.targetTower = this.findTargetTower();

    if (this.targetTower) {
      const targetPos = this.targetTower.center;
      // Slight lead/inaccuracy for realism - towers mostly static, so add small jitter
      const aimX = targetPos.x + (Math.random() - 0.5) * 6;
      const aimY = targetPos.y + (Math.random() - 0.5) * 6;
      // Smooth turret rotation towards aim
      const desired = Math.atan2(aimY - this.pos.y, aimX - this.pos.x);
      const delta =
        ((desired - this.turretRotation + Math.PI) % (2 * Math.PI)) - Math.PI;
      // rotate speed depends on distance (heavier turret rotates slower)
      const rotSpeed = 5.0; // radians/sec
      this.turretRotation += clamp(delta, -rotSpeed * dt, rotSpeed * dt);

      // Fire if ready
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 1 / this.attackRate;
        this.shootTower(this.targetTower);
        // apply recoil impulse
        this.turretRecoil += -6 - Math.random() * 2; // pixels back
        this.recoilVelocity += -40 - Math.random() * 10;
        this.muzzleFlashTimer = 0.06 + Math.random() * 0.04;
      }
    }
  }

  // More realistic projectile: tracer + smoke trail + impact
  shootTower(target) {
    soundManager.playSound("JuggernautRifle", 0.35);

    // Tracer projectile
    const tracer = {
      x: this.pos.x + Math.cos(this.turretRotation) * (this.r * 0.9),
      y: this.pos.y + Math.sin(this.turretRotation) * (this.r * 0.9),
      vx: Math.cos(this.turretRotation) * 600,
      vy: Math.sin(this.turretRotation) * 600,
      target: target,
      speed: 600,
      damage: this.attackDamage,
      length: 18 + Math.random() * 8,
      life: 3.0,
      dead: false,
      isEnemyProjectile: true,

      update: function (dt) {
        // If tower already destroyed, expire
        if (!this.target || this.target.hp <= 0) {
          this.dead = true;
          return;
        }
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }

        // move in straight line (fast tracer). On close proximity, apply damage
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // create tiny smoke puffs along tracer
        if (Math.random() < 0.28) {
          // smoke as a cheap one-frame effect using spawnExplosion with translucent grey
          spawnExplosion(
            this.x - this.vx * dt * 0.02,
            this.y - this.vy * dt * 0.02,
            4 + Math.random() * 3,
            "rgba(90,90,90,0.12)"
          );
        }

        // check collision with target using distance threshold
        const dx = this.target.center.x - this.x;
        const dy = this.target.center.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < Math.max(12, this.target.r || 12)) {
          // impact: apply damage
          this.target.hp -= this.damage;
          this.dead = true;

          // big impactful explosion + sparks
          spawnExplosion(this.x, this.y, 20 + Math.random() * 15, "#ff7733");
          // optional: secondary smaller debris puffs
          spawnExplosion(
            this.x + (Math.random() - 0.5) * 6,
            this.y + (Math.random() - 0.5) * 6,
            10,
            "#e35a00"
          );

          // If tower destroyed, remove and update occupied cells
          if (this.target.hp <= 0) {
            const index = towers.indexOf(this.target);
            if (index > -1) {
              towers.splice(index, 1);
              updateOccupiedCells();
            }
          }
        }
      },

      draw: function () {
        // draw elongated tracer with gradient (bright core, darker tail)
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        // core
        const grad = ctx.createLinearGradient(-this.length, 0, 0, 0);
        grad.addColorStop(0, "rgba(255,220,120,0.02)");
        grad.addColorStop(0.6, "rgba(255,230,160,0.4)");
        grad.addColorStop(1, "rgba(255,200,80,0.95)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(-this.length / 2, 0, this.length, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // bright tip
        ctx.fillStyle = "rgba(255,245,200,0.95)";
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    };

    projectiles.push(tracer);
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    // BODY: armored base with gradient + plates
    const grad = ctx.createLinearGradient(
      x - this.r,
      y - this.r,
      x + this.r,
      y + this.r
    );
    grad.addColorStop(0, "#263238"); // dark steel
    grad.addColorStop(0.6, "#37474F"); // mid tone
    grad.addColorStop(1, "#455A64"); // highlight

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();

    // subtle rim highlight
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Armor plating: layered rectangles / plates to give 'chunks'
    ctx.save();
    ctx.translate(x, y);
    const plateCount = 3;
    for (let i = 0; i < plateCount; i++) {
      const sz = this.r * (0.85 - i * 0.18);
      ctx.beginPath();
      ctx.fillStyle = `rgba(20,20,20,${0.04 + i * 0.02})`;
      // rotated plate
      ctx.save();
      ctx.rotate(i * 0.08 - 0.06);
      ctx.fillRect(-sz, -sz * 0.25, sz * 1.6, sz * 0.5);
      ctx.restore();
    }
    ctx.restore();

    // TURRET base (round)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.turretRotation);

    // turret pocket (darker dish)
    ctx.beginPath();
    ctx.fillStyle = "#1e272c";
    ctx.ellipse(0, 0, this.r * 0.65, this.r * 0.48, 0, 0, TAU);
    ctx.fill();

    // turret hatch (metallic disc)
    const hatchGrad = ctx.createRadialGradient(
      -this.r * 0.15,
      -this.r * 0.1,
      2,
      0,
      0,
      this.r * 0.7
    );
    hatchGrad.addColorStop(0, "rgba(255,255,255,0.06)");
    hatchGrad.addColorStop(0.9, "rgba(0,0,0,0.2)");
    ctx.fillStyle = hatchGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.52, 0, TAU);
    ctx.fill();

    // gun barrel (with recoil offset)
    const recoilOffset = Math.max(0, -this.turretRecoil); // recoil goes negative; push barrel back visually
    ctx.save();
    ctx.translate(recoilOffset * 0.6, 0);
    const barrelLength = this.r * 1.35;
    const barrelWidth = Math.max(6, Math.floor(this.r * 0.36));
    // barrel shadow
    ctx.fillStyle = "#0f1112";
    ctx.fillRect(0, -barrelWidth / 2 - 1, barrelLength + 6, barrelWidth + 2);
    // barrel metal
    const barrelGrad = ctx.createLinearGradient(
      0,
      -barrelWidth,
      barrelLength,
      barrelWidth
    );
    barrelGrad.addColorStop(0, "#5b6469");
    barrelGrad.addColorStop(0.5, "#9aa3a8");
    barrelGrad.addColorStop(1, "#4a4f52");
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(0, -barrelWidth / 2, barrelLength, barrelWidth);
    // muzzle opening
    ctx.beginPath();
    ctx.fillStyle = "#0a0a0a";
    ctx.ellipse(
      barrelLength + 4,
      0,
      barrelWidth * 0.55,
      barrelWidth * 0.45,
      0,
      0,
      TAU
    );
    ctx.fill();
    ctx.restore();

    // muzzle flash (temporary bright cone)
    if (this.muzzleFlashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.muzzleFlashTimer / 0.06);
      ctx.beginPath();
      ctx.moveTo(barrelLength + 6, 0);
      ctx.lineTo(barrelLength + 18, -14);
      ctx.lineTo(barrelLength + 18, 14);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,210,100,0.95)";
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // turret

    // Health bar above with steel bezel
    const w = 70,
      h = 8;
    const barY = y - this.r - 26;
    // background bezel
    ctx.fillStyle = "#202326";
    ctx.fillRect(x - w / 2 - 1, barY - 1, w + 2, h + 2);
    // inner dark
    ctx.fillStyle = "#111418";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    // color gradient for health: green -> yellow -> red
    const healthGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    if (hpPercent > 0.5) {
      healthGrad.addColorStop(0, "#46d46a");
      healthGrad.addColorStop(1, "#7be08d");
    } else if (hpPercent > 0.25) {
      healthGrad.addColorStop(0, "#fdc04a");
      healthGrad.addColorStop(1, "#f8a63a");
    } else {
      healthGrad.addColorStop(0, "#f66a6a");
      healthGrad.addColorStop(1, "#ff4a4a");
    }
    ctx.fillStyle = healthGrad;
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);

    // subtle text or numeric hp (optional)
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.fillText(
      Math.ceil(this.hp) + " / " + Math.ceil(this.maxHp),
      x,
      barY + h + 12
    );
  }
}
