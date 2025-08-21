// ===== FILE: C:\Users\kurd7\Downloads\Tower\src\config.js =====

import { GunTower } from "./towers/GunTower.js";
import { CannonTower } from "./towers/CannonTower.js";
import { DoubleCannonTower } from "./towers/DoubleCannonTower.js";
import { LaserTower } from "./towers/LaserTower.js";
import { IceTower } from "./towers/IceTower.js";
import { TeslaTower } from "./towers/TeslaTower.js";
import { PoisonTower } from "./towers/PoisonTower.js";
import { MissileTower } from "./towers/MissileTower.js";
import { FlamethrowerTower } from "./towers/FlamethrowerTower.js";
import { SniperTower } from "./towers/SniperTower.js";
import { ArtilleryTower } from "./towers/ArtilleryTower.js";
import { ArcherTower } from "./towers/ArcherTower.js";
import { LightningTower } from "./towers/LightningTower.js";
import { ShadowTower } from "./towers/ShadowTower.js";
import { WizardTower } from "./towers/WizardTower.js";
import { WindTower } from "./towers/WindTower.js";
import { VolcanoTower } from "./towers/VolcanoTower.js";
import { CarM249Tower } from "./towers/CarM249Tower.js";
import { SmallTank } from "./towers/SmallTank.js";
import { MediumTank } from "./towers/MediumTank.js";

export const TOWER_TYPES = {
  gun: {
    name: "Gunner",
    cost: 80,
    range: 120,
    fireRate: 6,
    dmg: 12,
    bulletSpeed: 340,
    color: "#6cf",
    class: GunTower,
  },
  cannon: {
    name: "Cannon",
    cost: 120,
    range: 140,
    fireRate: 1.2,
    dmg: 55,
    splash: 60,
    bulletSpeed: 260,
    color: "#f6c66a",
    class: CannonTower,
  },
  doubleCanon: {
    name: "Double Canon",
    cost: 160,
    range: 120,
    fireRate: 0.9,
    dmg: 75,
    splash: 55,
    bulletSpeed: 240,
    color: "#f00",
    class: DoubleCannonTower,
  },
  laser: {
    name: "Laser",
    cost: 250,
    range: 150,
    fireRate: 12,
    dmg: 5,
    beam: true,
    color: "#ff69e0",
    class: LaserTower,
  },
  ice: {
    // Add Ice Tower
    name: "Ice Tower",
    cost: 180,
    range: 130,
    fireRate: 2.5,
    dmg: 8,
    slowAmount: 0.6,
    slowDuration: 3,
    freezeChance: 0.2,
    bulletSpeed: 300,
    color: "#6cfaff",
    class: IceTower,
  },
  tesla: {
    name: "Tesla Tower",
    cost: 220,
    range: 140,
    fireRate: 1.8,
    dmg: 25,
    chainCount: 3, // Jumps to 3 additional targets
    chainRange: 80, // Range for chain jumps
    stunChance: 0.1, // 30% chance to stun
    stunDuration: 1, // seconds
    color: "#9d4edd",
    class: TeslaTower,
  },
  poison: {
    // Add Poison Tower
    name: "Poison Tower",
    cost: 190,
    range: 110,
    fireRate: 1.5,
    dmg: 15,
    dotDamage: 8, // Damage per second
    dotDuration: 4, // seconds
    spreadRange: 60, // Range for poison spread
    cloudDuration: 3, // Lingering cloud duration
    color: "#4CAF50",
    class: PoisonTower,
  },
  missile: {
    name: "Missile Tower",
    cost: 280,
    range: 160,
    fireRate: 0.8,
    dmg: 70,
    splash: 80, // Splash damage radius
    bulletSpeed: 180, // Slower but homing
    homingStrength: 0.1, // How strongly missiles home in
    retarget: true, // Can retarget if original target dies
    color: "#FF5722",
    class: MissileTower,
  },
  flamethrower: {
    name: "Flamethrower",
    cost: 140,
    range: 80,
    fireRate: 15,
    dmg: 8,
    burnDamage: 6,
    burnDuration: 3,
    coneAngle: Math.PI / 3, // 60 degree cone
    spreadChance: 0.4,
    spreadRange: 40,
    color: "#FF6B35",
    class: FlamethrowerTower,
  },
  sniper: {
    name: "Sniper Tower",
    cost: 350,
    range: 400,
    fireRate: 0.3,
    dmg: 200,
    bulletSpeed: 1200,
    penetration: 2,
    critChance: 0.25,
    critMultiplier: 2.5,
    color: "#2b4ff2",
    class: SniperTower,
  },
  artillery: {
    name: "Artillery",
    cost: 500,
    range: 350,
    fireRate: 0.15,
    dmg: 60,
    splash: 120,
    bulletSpeed: 150,
    arcHeight: 80,
    minRange: 60,
    color: "#8d6e63",
    class: ArtilleryTower,
  },
  archer: {
    name: "Archer Tower",
    cost: 90,
    range: 130,
    fireRate: 5,
    dmg: 100,
    bulletSpeed: 400,
    critChance: 0.1,
    critMultiplier: 1.5,
    color: "#8bc34a",
    class: ArcherTower,
  },
  lightning: {
    name: "Lightning Tower",
    cost: 300,
    range: 150,
    fireRate: 1.5,
    dmg: 30,
    chainCount: 4,
    chainRange: 100,
    stunChance: 0.2,
    stunDuration: 1.2,
    color: "#00ffff",
    class: LightningTower,
  },
  shadow: {
    name: "Shadow Tower",
    cost: 320,
    range: 140,
    fireRate: 1.2,
    dmg: 15,
    curseDmg: 5,
    curseDuration: 4,
    chainCount: 3,
    chainRange: 90,
    color: "#800080",
    class: ShadowTower,
  },
  wizard: {
    name: "Wizard Tower",
    cost: 330,
    range: 150,
    fireRate: 1.2,
    dmg: 30,
    chainCount: 2,
    chainRange: 80,
    color: "#7f00ff",
    class: WizardTower,
  },
  wind: {
    name: "Wind Tower",
    cost: 200,
    range: 140,
    fireRate: 1.2, // attacks per second
    knockback: 40, // pixels
    slowAmount: 0.5, // slows enemies by 50% for a short duration
    slowDuration: 1.5, // seconds
    color: "#00bfff",
    class: WindTower,
  },
  volcano: {
    name: "Volcano Tower",
    cost: 600,
    range: 200,
    fireRate: 0.3, // slow but powerful
    dmg: 80, // direct damage
    splash: 60, // area of effect radius
    color: "#ff3300",
    class: VolcanoTower,
  },
  carM249: {
    name: "Car M249 Tower",
    cost: 600,
    range: 180,
    fireRate: 5, // bullets per second
    dmg: 15, // per bullet
    color: "#2288ff",
    class: CarM249Tower, // reference your tower class
  },
  smallTank: {
    name: "Small Tank",
    cost: 320,
    range: 160,
    fireRate: 1.5,
    dmg: 150,
    splash: 40,
    bulletSpeed: 380,
    color: "#556b2f",
    class: SmallTank,
  },
  mediumTank: {
    name: "Medium Tank",
    cost: 500,
    range: 180,
    fireRate: 1.0, // slower
    dmg: 300, // stronger
    splash: 60,
    bulletSpeed: 300,
    color: "#8b4513",
    class: MediumTank,
  },
};
