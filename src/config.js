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
import { BigTank } from "./towers/BigTank.js";
import { BehemothTank } from "./towers/BehemothTank.js";
import { HelicopterTower } from "./towers/HelicopterTower.js";
import { BlackHawkTower } from "./towers/BlackHawkTower.js";
import { JetTower } from "./towers/jet.js";
import { B52SpiritTower } from "./towers/B52SpiritTower.js";

export const TOWER_TYPES = {
  gun: {
    name: "Gunner",
    cost: 80,
    range: 120,
    fireRate: 6,
    dmg: 12,
    bulletSpeed: 340,
    color: "#6cf",
    maxLevel: 10,
    hp: 300,
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
    maxLevel: 10,
    hp: 300,
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
    hp: 300,
    maxLevel: 3,
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
    maxLevel: 3,
    hp: 300,
    class: LaserTower,
  },
  ice: {
    // Add Ice Tower
    name: "Ice",
    cost: 180,
    range: 130,
    fireRate: 2.5,
    dmg: 8,
    slowAmount: 0.6,
    slowDuration: 3,
    freezeChance: 0.2,
    bulletSpeed: 300,
    color: "#6cfaff",
    maxLevel: 3,
    hp: 300,
    class: IceTower,
  },
  tesla: {
    name: "Tesla",
    cost: 220,
    range: 140,
    fireRate: 1.8,
    dmg: 25,
    chainCount: 3, // Jumps to 3 additional targets
    chainRange: 80, // Range for chain jumps
    stunChance: 0.1, // 30% chance to stun
    stunDuration: 1, // seconds
    color: "#9d4edd",
    maxLevel: 3,
    hp: 300,
    class: TeslaTower,
  },
  poison: {
    // Add Poison Tower
    name: "Poison",
    cost: 190,
    range: 110,
    fireRate: 1.5,
    dmg: 15,
    dotDamage: 8, // Damage per second
    dotDuration: 4, // seconds
    spreadRange: 60, // Range for poison spread
    cloudDuration: 3, // Lingering cloud duration
    color: "#4CAF50",
    maxLevel: 3,
    hp: 300,
    class: PoisonTower,
  },
  missile: {
    name: "Missile",
    cost: 280,
    range: 160,
    fireRate: 0.8,
    dmg: 70,
    splash: 80, // Splash damage radius
    bulletSpeed: 180, // Slower but homing
    homingStrength: 0.1, // How strongly missiles home in
    retarget: true, // Can retarget if original target dies
    color: "#FF5722",
    maxLevel: 3,
    hp: 300,
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
    maxLevel: 3,
    hp: 300,
    class: FlamethrowerTower,
  },
  sniper: {
    name: "Sniper",
    cost: 350,
    range: 400,
    fireRate: 0.3,
    dmg: 200,
    bulletSpeed: 1200,
    penetration: 2,
    critChance: 0.25,
    critMultiplier: 2.5,
    color: "#2b4ff2",
    maxLevel: 3,
    hp: 300,
    size: { align: "TBLR", occupy: 2 },
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
    maxLevel: 3,
    hp: 300,
    size: { align: "TBLR", occupy: 2 },
    class: ArtilleryTower,
  },
  archer: {
    name: "Archer",
    cost: 90,
    range: 130,
    fireRate: 5,
    dmg: 100,
    bulletSpeed: 400,
    critChance: 0.1,
    critMultiplier: 1.5,
    color: "#8bc34a",
    maxLevel: 3,
    hp: 300,
    class: ArcherTower,
  },
  lightning: {
    name: "Lightning",
    cost: 300,
    range: 150,
    fireRate: 1.5,
    dmg: 30,
    chainCount: 4,
    chainRange: 100,
    stunChance: 0.2,
    stunDuration: 1.2,
    color: "#00ffff",
    maxLevel: 3,
    hp: 300,
    size: { align: "T", occupy: 2 },
    class: LightningTower,
  },
  shadow: {
    name: "Shadow",
    cost: 320,
    range: 140,
    fireRate: 1.2,
    dmg: 15,
    curseDmg: 5,
    curseDuration: 4,
    chainCount: 3,
    chainRange: 90,
    color: "#800080",
    maxLevel: 3,
    hp: 300,
    size: { align: "T", occupy: 2 },
    class: ShadowTower,
  },
  wizard: {
    name: "Wizard",
    cost: 330,
    range: 150,
    fireRate: 1.2,
    dmg: 30,
    chainCount: 2,
    chainRange: 80,
    color: "#7f00ff",
    maxLevel: 3,
    hp: 300,
    size: { align: "T", occupy: 2 },
    class: WizardTower,
  },
  wind: {
    name: "Wind",
    cost: 200,
    range: 140,
    fireRate: 1.2, // attacks per second
    knockback: 40, // pixels
    slowAmount: 0.5, // slows enemies by 50% for a short duration
    slowDuration: 1.5, // seconds
    color: "#00bfff",
    maxLevel: 3,
    hp: 300,
    size: { align: "T", occupy: 2 },
    class: WindTower,
  },
  volcano: {
    name: "Volcano",
    cost: 600,
    range: 200,
    fireRate: 0.3, // slow but powerful
    dmg: 80, // direct damage
    splash: 60, // area of effect radius
    color: "#ff3300",
    maxLevel: 3,
    hp: 300,
    size: { align: "T", occupy: 2 },
    class: VolcanoTower,
  },
  carM249: {
    name: "Car M249",
    cost: 600,
    range: 180,
    fireRate: 5, // bullets per second
    dmg: 15, // per bullet
    color: "#2288ff",
    maxLevel: 3,
    hp: 300,
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
    maxLevel: 3,
    hp: 300,
    size: { align: "LR", occupy: 2 },
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
    maxLevel: 3,
    hp: 3000,
    size: { align: "TBLR", occupy: 2 },
    class: MediumTank,
  },
  bigTank: {
    name: "Big Tank",
    cost: 950,
    range: 200,
    fireRate: 0.6, // main shells per second
    dmg: 600, // main shell damage
    splash: 110,
    bulletSpeed: 220, // main shell speed
    color: "#4b2e1e",
    topFireRate: 10, // bullets per second for top gun (continuous)
    topDmg: 30, // damage per top-gun bullet
    topBulletSpeed: 720, // speed of top-gun bullets
    size: { align: "TBLR", occupy: 2 },
    maxLevel: 3,
    hp: 300,
    class: BigTank,
  },
  behemothTank: {
    name: "Behemoth Tank",
    cost: 2200, // Very expensive
    range: 280, // Superior range
    fireRate: 0.5, // Slower, but fires two powerful shells
    dmg: 950, // Devastating damage per shell
    splash: 140, // Massive area of effect
    bulletSpeed: 250,
    color: "#a8e0ff", // A cool, high-tech blue for the shop icon
    topFireRate: 15, // Upgraded rapid-fire top gun
    topDmg: 40,
    maxLevel: 3,
    hp: 300,
    topBulletSpeed: 800,
    // Your updated occupation.js file will handle this correctly.
    size: { align: "TBLR", occupy: 3 },
    class: BehemothTank,
  },
  helicopter: {
    name: "Heli Pad",
    cost: 1500,
    range: 220, // The patrol and firing radius from the helipad
    fireRate: 12, // High rate of fire
    dmg: 35, // Moderate damage per bullet
    bulletSpeed: 750,
    color: "#ffdd99", // A sandy, military color for the shop
    // The helipad itself is a standard 1x1 tower
    size: { align: "TBLR", occupy: 1 },
    maxLevel: 3,
    hp: 300,
    class: HelicopterTower,
  },
  blackHawk: {
    name: "Black Hawk",
    cost: 2500,
    range: 280,
    fireRate: 15,
    dmg: 45,
    bulletSpeed: 800,
    color: "#2c3e50",
    size: { align: "TBLR", occupy: 1 },
    maxLevel: 3,
    hp: 300,
    class: BlackHawkTower,
  },
  jet: {
    name: "Stealth Jet",
    cost: 6000, // High cost for a global presence
    range: Infinity, // Full map range
    fireRate: 0.8, // Slower fire rate due to powerful missiles
    dmg: 1000, // High damage with area-of-effect
    bulletSpeed: 500, // Missile travel speed
    color: "#34495e",
    maxLevel: 3,
    hp: 300,
    // The jet does not occupy a grid cell as it's an off-map support unit.
    // How you handle placement is up to your UI logic.
    // You might call it from a special support menu instead of placing it.
    // For that reason, 'size' can be omitted or handled differently.
    size: { align: "TBLR", occupy: 0 }, // Or handle as a special case
    class: JetTower,
  },
  b52Spirit: {
    name: "B-2 Spirit Bomber",
    cost: 15000, // Very high cost for a game-changing ability
    range: Infinity,
    fireRate: 0.1, // Cooldown between bombing runs (e.g., once every 10 seconds)
    dmg: 1000, // Damage per bomb in the carpet
    bulletSpeed: 200, // The flight speed of the bomber itself
    color: "#495057",
    maxLevel: 3,
    hp: 300,
    size: { align: "TBLR", occupy: 0 }, // Another off-map support call-in
    class: B52SpiritTower,
  },
};
