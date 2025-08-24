import { BaseEnemy } from "./BaseEnemy.js";
export class Brute extends BaseEnemy {
  constructor(tier) {
    super("brute", tier);
  }
}
