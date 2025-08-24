import { BaseEnemy } from "./BaseEnemy.js";
export class Scout extends BaseEnemy {
  constructor(tier) {
    super("basic", tier);
  }
}
