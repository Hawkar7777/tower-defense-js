import { ctx } from "../core.js";
import { clamp } from "../utils.js";
import { state } from "../state.js";
import { BaseBoss } from "./BaseBoss.js";
import { BOSS_TYPES } from "./boss-types.js";

export class phantom extends BaseBoss {
  constructor() {
    const bossType = BOSS_TYPES.Phantom;
    const difficultyMult = 1 + state.wave * 0.12;
    super(bossType, difficultyMult);

    this.phasing = false;
    this.phaseDuration = 0.5;
    this.phaseCooldown = 6;
    this.lastPhaseTime = performance.now();
    this.phaseDistance = 0.08;
  }

  update(dt) {
    const now = performance.now();
    if (
      !this.phasing &&
      (now - this.lastPhaseTime) / 1000 > this.phaseCooldown
    ) {
      this.phasing = true;
      this.phaseStartTime = now;
      this.lastPhaseTime = now;
      this.t += this.phaseDistance;
    }
    if (
      this.phasing &&
      (now - this.phaseStartTime) / 1000 > this.phaseDuration
    ) {
      this.phasing = false;
    }
    super.update(dt);
  }

  damage(d) {
    if (this.phasing || this.dead) return;
    super.damage(d);
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;
    ctx.globalAlpha = this.phasing ? 0.3 : 1.0;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = this.detailColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const angle = (i * TAU) / 3 + this.animationOffset * 1.5;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * this.r, y + Math.sin(angle) * this.r);
      ctx.lineTo(
        x + Math.cos(angle + 0.3) * (this.r + 10),
        y + Math.sin(angle + 0.3) * (this.r + 10)
      );
      ctx.stroke();
    }
    const grd = ctx.createRadialGradient(x, y, 2, x, y, this.r + 5);
    grd.addColorStop(0, this.glowColor);
    grd.addColorStop(1, "rgba(0,255,255,0.0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, this.r + 8, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    const w = 50,
      h = 6;
    const barY = y - this.r - 18;
    ctx.fillStyle = "#333";
    ctx.fillRect(x - w / 2, barY, w, h);
    const hpPercent = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = "#6f6";
    ctx.fillRect(x - w / 2, barY, w * hpPercent, h);
  }
}
