import { ctx } from "./core.js";
import { clamp } from "./utils.js";
import { pointAt, totalLen } from "./path.js";
import { spawnDeath, spawnExplosion } from "./effects.js";
import { state } from "./state.js";

let difficultyMult = () => 1 + state.wave * 0.15;

export class Enemy {
  constructor(tier = 0) {
    this.t = 0;
    this.speed = 50 * difficultyMult();
    this.maxHp = (100 + tier * 40) * difficultyMult();
    this.hp = this.maxHp;
    this.reward = Math.round((8 + tier * 2) * difficultyMult());
    this.r = 12;
    this.dead = false;
  }

  get pos() {
    return pointAt(this.t);
  }

  update(dt) {
    if (this.dead) return;
    this.t += (this.speed * dt) / totalLen;
    if (this.t >= 1) {
      this.dead = true;
      state.lives = Math.max(0, state.lives - 1);
      spawnExplosion(this.pos.x, this.pos.y, 20, "#f44");
    }
  }

  damage(d) {
    if (this.dead) return;
    this.hp -= d;
    if (this.hp <= 0) {
      this.dead = true;
      state.money += this.reward;
      spawnDeath(this.pos);
    }
  }

  draw() {
    if (this.dead) return;
    const { x, y } = this.pos;
    const TAU = Math.PI * 2;
    const { r } = this;

    const grd = ctx.createRadialGradient(x, y, 4, x, y, r + 10);
    grd.addColorStop(0, "#48f");
    grd.addColorStop(1, "rgba(0,255,255,0.0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r + 8, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#7df";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    const w = 28,
      h = 5;
    const p = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = "#132";
    ctx.fillRect(x - w / 2, y - r - 14, w, h);
    ctx.fillStyle = p > 0.5 ? "#6f6" : p > 0.25 ? "#fd6" : "#f66";
    ctx.fillRect(x - w / 2, y - r - 14, w * p, h);
  }
}
