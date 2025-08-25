import { BaseEnemy } from "./BaseEnemy.js";
import { ENEMY_TYPES } from "./enemyTypes.js";
import { state, towers } from "../state.js";
import { updateOccupiedCells } from "../occupation.js";
import { dist } from "../utils.js";
import { ctx } from "../core.js";
import { pointAt } from "../path.js"; // Needed for body orientation

let difficultyMult = () => 1 + state.wave * 0.15;

export class Leech extends BaseEnemy {
  constructor(tier = 0) {
    super("leech", tier);

    const spec = ENEMY_TYPES.leech;
    this.drainRange = spec.drainRange;
    this.drainDps = spec.drainDps * difficultyMult();
    this.healMultiplier = spec.healMultiplier;

    this.latchedTower = null; // The tower we are currently draining
  }

  /**
   * Overrides the default update method with custom logic for latching and draining.
   * @param {number} dt - Delta time, the time elapsed since the last frame.
   */
  update(dt) {
    // --- LATCHED LOGIC ---
    // If we are currently attached to a tower, our logic is completely different.
    if (this.latchedTower) {
      // First, check if the tower still exists (it might have been sold).
      if (this.latchedTower.hp <= 0 || !towers.includes(this.latchedTower)) {
        this.latchedTower = null; // Detach
        return; // Next frame, we will resume moving.
      }

      // --- Drain Health and Heal Self ---
      const damageToDeal = this.drainDps * dt;
      this.latchedTower.hp -= damageToDeal;
      this.hp += damageToDeal * this.healMultiplier;

      // Clamp health so we don't overheal past our maximum.
      if (this.hp > this.maxHp) {
        this.hp = this.maxHp;
      }

      // If our draining destroys the tower, detach from it.
      if (this.latchedTower.hp <= 0) {
        const towerIndex = towers.indexOf(this.latchedTower);
        if (towerIndex > -1) {
          towers.splice(towerIndex, 1); // Remove the tower from the game
          updateOccupiedCells(); // Update the grid so you can build here again
        }
        this.latchedTower = null; // Detach
      }

      // IMPORTANT: We do not move while latched, so we stop the function here.
      return;
    }

    // --- MOVEMENT & TARGETING LOGIC ---
    // If we are not latched, we first check for any towers in range.
    let closestTower = null;
    let minDistance = Infinity;

    for (const tower of towers) {
      const d = dist(this.pos, tower.center);
      if (d < this.drainRange && d < minDistance) {
        minDistance = d;
        closestTower = tower;
      }
    }

    if (closestTower) {
      // If we found a tower, latch on! We will stop moving next frame.
      this.latchedTower = closestTower;
    } else {
      // If no tower is in range, just move along the path normally.
      super.update(dt);
    }
  }

  /**
   * A completely custom draw method that overrides the parent's default.
   */
  draw() {
    if (this.dead) return;

    this.drawBody(); // Draws our custom, non-circular body
    this.drawDrainBeam(); // Draws the draining visual effect if latched

    // We can still use the parent's methods for common UI elements.
    this.drawStatusEffects();
    this.drawShield();
    this.drawHealthBar();
  }

  /**
   * Draws the visual effect of the Leech draining a tower.
   */
  drawDrainBeam() {
    if (!this.latchedTower) return;

    const { x, y } = this.pos;
    const pulse = Math.abs(Math.sin(this.animationOffset) * 0.4);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(this.latchedTower.center.x, this.latchedTower.center.y);

    // Draw a thick, semi-transparent outer beam
    ctx.strokeStyle = `rgba(142, 68, 173, ${0.4 + pulse})`; // Pulsating purple
    ctx.lineWidth = 4;
    ctx.stroke();
    // Draw a thin, bright inner beam
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Draws the Leech's custom, segmented, worm-like body.
   */
  drawBody() {
    const { x, y } = this.pos;
    const numSegments = 4;
    const segmentLength = this.r * 0.8;
    const segmentWidth = this.r * 1.2;

    ctx.save();
    ctx.translate(x, y);

    // To make the Leech point in the direction it's moving, we look slightly
    // ahead on the path to find the correct angle.
    const nextPos = pointAt(this.t + 0.01);
    const angle = Math.atan2(nextPos.y - y, nextPos.x - x);
    ctx.rotate(angle);

    // Draw the body as a series of undulating, overlapping ellipses.
    for (let i = 0; i < numSegments; i++) {
      const segX = -i * segmentLength * 0.8; // Position each segment behind the last
      const segY = Math.sin(this.animationOffset / 2 + i * 1.5) * 4; // Sin wave for undulation
      const size = 1 - i / (numSegments * 1.5); // Segments get smaller towards the tail

      // Body Segment
      ctx.fillStyle = i < 2 ? this.detailColor : this.color; // Head is darker
      ctx.beginPath();
      ctx.ellipse(
        segX,
        segY,
        segmentLength * size,
        segmentWidth * size,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw a pulsating core on the head segment
      if (i === 0) {
        const pulse = Math.sin(this.animationOffset) * 2;
        const grd = ctx.createRadialGradient(
          segX,
          segY,
          1,
          segX,
          segY,
          this.r * 0.8 + pulse
        );
        grd.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        grd.addColorStop(1, this.glowColor + "00"); // Transparent at the edge
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
