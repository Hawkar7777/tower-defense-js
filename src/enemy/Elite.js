import { BaseEnemy } from "./BaseEnemy.js";
export class Elite extends BaseEnemy {
  constructor(tier) {
    super("elite", tier);
  }
}
