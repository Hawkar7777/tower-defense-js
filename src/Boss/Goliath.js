import { ctx } from "../core.js";
import { clamp } from "../utils.js";
import { spawnExplosion } from "../effects.js";
import { state, enemies } from "../state.js";
import { createEnemy } from "../enemy.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";
import { soundManager } from "../assets/sounds/SoundManager.js";

export class goliath extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Goliath;
    const difficultyMult = 1 + state.wave * 0.1;
    super(bossType, difficultyMult);

    this.maxShieldHp = bossType.baseShieldHp * difficultyMult;
    this.shieldHp = this.maxShieldHp;
    this.shieldActive = true;
    this.lastMinionSpawnTime = performance.now();
    this.minionSpawnCooldown = 8000;
  }

  update(dt) {
    if (this.shieldActive) {
      this.speed = this.originalSpeed;
      this.frozen = false;
      this.stunned = false;
    }
    super.update(dt);

    if (!this.dead && this.speed > 0) {
      soundManager.playSound("goliathMove", 0.3);
    }

    const now = performance.now();
    if (now - this.lastMinionSpawnTime > this.minionSpawnCooldown) {
      this.lastMinionSpawnTime = now;
      const minion = createEnemy("basic");
      minion.t = this.t;
      enemies.push(minion);
      soundManager.playSound("minionSpawn", 0.3);
    }
  }

  damage(d) {
    if (this.dead) return;
    if (this.shieldActive) {
      this.shieldHp -= d;
      if (this.shieldHp <= 0) {
        this.shieldActive = false;
        spawnExplosion(this.pos.x, this.pos.y, this.r + 10, this.shieldColor);
      }
    } else {
      super.damage(d);
    }
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;

    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const angle = (i * TAU) / 6 + this.animationOffset;
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(angle) * (this.r - 4),
        y + Math.sin(angle) * (this.r - 4)
      );
      ctx.lineTo(
        x + Math.cos(angle) * (this.r + 10),
        y + Math.sin(angle) * (this.r + 10)
      );
      ctx.stroke();
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(x, y, this.r * 0.3, 0, TAU);
    ctx.fill();

    if (this.shieldActive) {
      ctx.fillStyle = this.shieldColor;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      const pulse = 1 + Math.sin(performance.now() / 200) * 0.05;
      ctx.beginPath();
      ctx.arc(x, y, (this.r + 6) * pulse, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    // Health bar (main)
    const w = 60,
      h = 7;
    const barY = y - this.r - 24;
    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle =
      hpPercent > 0.5 ? "#6f6" : hpPercent > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);

    // Shield bar (if active)
    if (this.shieldActive) {
      const shieldY = barY - (h + 6);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(x - w / 2, shieldY, w, h - 2);
      const shieldPercent = clamp(this.shieldHp / this.maxShieldHp, 0, 1);
      ctx.fillStyle = "#0af";
      ctx.fillRect(x - w / 2, shieldY, w * shieldPercent, h - 2);

      // Shield HP number above the shield bar
      const shieldText = `${Math.round(this.shieldHp)}/${Math.round(
        this.maxShieldHp
      )}`;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.strokeText(shieldText, x, shieldY - (h + 6));
      ctx.fillStyle = "#fff";
      ctx.fillText(shieldText, x, shieldY - (h + 6));
    }

    // MAIN HP number under the health bar (Warlock-style placement)
    const hpText = `${Math.round(this.hp)}/${Math.round(this.maxHp)}`;
    const hpTextY = barY + h + 10; // under the bar

    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(hpText, x, hpTextY);
    ctx.fillStyle = "#fff";
    ctx.fillText(hpText, x, hpTextY);
  }
}
