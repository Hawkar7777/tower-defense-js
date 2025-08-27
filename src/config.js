// HERE TOWERS:
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
    range: 125, // Slightly increased range
    fireRate: 7, // Increased fire rate for better early game
    dmg: 15, // Increased damage
    bulletSpeed: 360, // Slightly faster bullets
    color: "#6cf",
    maxLevel: 15, // More levels for early game progression
    hp: 400, // Increased HP
    unlockPrice: 0,
    upgradePriceBase: 28, // Slightly increased upgrade cost
    persistentMaxLevel: 150,
    class: GunTower,
  },
  cannon: {
    name: "Cannon",
    cost: 120,
    range: 145, // Slightly increased range
    fireRate: 1.5, // Faster fire rate
    dmg: 65, // Increased damage
    splash: 65, // Increased splash radius
    bulletSpeed: 280, // Faster bullets
    color: "#f6c66a",
    maxLevel: 12, // More levels
    hp: 550, // Increased HP for durability
    unlockPrice: 200,
    upgradePriceBase: 45,
    persistentMaxLevel: 120,
    class: CannonTower,
  },
  doubleCanon: {
    name: "Double Canon",
    cost: 190, // Slightly increased cost
    range: 135, // Increased range
    fireRate: 1.2, // Faster fire rate for a "double" cannon
    dmg: 90, // Significantly increased damage
    splash: 60, // Increased splash
    bulletSpeed: 260,
    color: "#f00",
    hp: 700, // Increased HP
    maxLevel: 7, // More levels
    unlockPrice: 400, // Increased unlock price
    upgradePriceBase: 60,
    persistentMaxLevel: 70,
    class: DoubleCannonTower,
  },
  laser: {
    name: "Laser",
    cost: 280, // Slightly increased cost
    range: 160, // Increased range
    fireRate: 15, // High fire rate
    dmg: 7, // Increased base damage, relies on sustained fire
    beam: true,
    color: "#ff69e0",
    maxLevel: 7, // More levels
    hp: 480, // Increased HP
    unlockPrice: 550, // Increased unlock price
    upgradePriceBase: 110,
    persistentMaxLevel: 70,
    class: LaserTower,
  },
  ice: {
    name: "Ice",
    cost: 180,
    range: 140, // Increased range
    fireRate: 3, // Faster fire rate
    dmg: 10, // Increased damage
    slowAmount: 0.65, // Stronger slow
    slowDuration: 3.5, // Longer slow duration
    freezeChance: 0.25, // Increased freeze chance
    bulletSpeed: 320,
    color: "#6cfaff",
    maxLevel: 8, // More levels
    hp: 420, // Increased HP
    unlockPrice: 320,
    upgradePriceBase: 55,
    persistentMaxLevel: 80,
    class: IceTower,
  },
  tesla: {
    name: "Tesla",
    cost: 240, // Slightly increased cost
    range: 150, // Increased range
    fireRate: 2, // Faster fire rate
    dmg: 30, // Increased damage
    chainCount: 4, // More chains
    chainRange: 90, // Increased chain range
    stunChance: 0.15, // Increased stun chance
    stunDuration: 1.2, // Longer stun
    color: "#9d4edd",
    maxLevel: 7, // More levels
    hp: 500, // Increased HP
    unlockPrice: 650, // Increased unlock price
    upgradePriceBase: 130,
    persistentMaxLevel: 70,
    class: TeslaTower,
  },
  poison: {
    name: "Poison",
    cost: 210, // Slightly increased cost
    range: 120, // Increased range
    fireRate: 1.8, // Faster fire rate
    dmg: 18, // Increased initial damage
    dotDamage: 10, // Increased DoT damage
    dotDuration: 5, // Longer DoT duration
    spreadRange: 65, // Increased spread range
    cloudDuration: 3.5, // Longer cloud duration
    color: "#4CAF50",
    maxLevel: 8, // More levels
    hp: 450, // Increased HP
    unlockPrice: 480,
    upgradePriceBase: 75,
    persistentMaxLevel: 80,
    class: PoisonTower,
  },
  missile: {
    name: "Missile",
    cost: 320, // Increased cost
    range: 170, // Increased range
    fireRate: 1.0, // Faster fire rate
    dmg: 85, // Significantly increased damage
    splash: 85, // Increased splash
    bulletSpeed: 200, // Faster homing missile
    homingStrength: 0.12, // Stronger homing
    retarget: true,
    color: "#FF5722",
    maxLevel: 6, // More levels
    hp: 600, // Increased HP
    unlockPrice: 850, // Increased unlock price
    upgradePriceBase: 160,
    persistentMaxLevel: 60,
    class: MissileTower,
  },
  flamethrower: {
    name: "Flamethrower",
    cost: 160, // Slightly increased cost
    range: 90, // Increased range
    fireRate: 18, // Faster fire rate for continuous flame
    dmg: 10, // Increased initial damage
    burnDamage: 8, // Increased burn damage
    burnDuration: 3.5, // Longer burn
    coneAngle: Math.PI / 2.8, // Wider cone angle
    spreadChance: 0.45, // Increased spread chance
    spreadRange: 45, // Increased spread range
    color: "#FF6B35",
    maxLevel: 10, // More levels
    hp: 420, // Increased HP
    unlockPrice: 420,
    upgradePriceBase: 68,
    persistentMaxLevel: 100,
    class: FlamethrowerTower,
  },
  sniper: {
    name: "Sniper",
    cost: 400, // Increased cost
    range: 450, // Longer range
    fireRate: 0.4, // Slightly faster fire rate
    dmg: 250, // Significantly increased damage
    bulletSpeed: 1500, // Faster bullet speed
    penetration: 3, // Increased penetration
    critChance: 0.3, // Increased crit chance
    critMultiplier: 2.75, // Increased crit multiplier
    color: "#2b4ff2",
    maxLevel: 5, // More levels
    hp: 650, // Increased HP
    unlockPrice: 1100, // Increased unlock price
    upgradePriceBase: 220,
    persistentMaxLevel: 50,
    size: { align: "TBLR", occupy: 2 },
    class: SniperTower,
  },
  artillery: {
    name: "Artillery",
    cost: 550, // Increased cost
    range: 400, // Increased range
    fireRate: 0.2, // Slightly faster fire rate
    dmg: 80, // Increased base damage
    splash: 130, // Increased splash
    bulletSpeed: 180, // Faster projectile
    arcHeight: 100, // Higher arc
    minRange: 70, // Slightly increased min range
    color: "#8d6e63",
    maxLevel: 5, // More levels
    hp: 750, // Increased HP
    unlockPrice: 1300, // Increased unlock price
    upgradePriceBase: 270,
    persistentMaxLevel: 50,
    size: { align: "TBLR", occupy: 2 },
    class: ArtilleryTower,
  },
  archer: {
    name: "Archer",
    cost: 95, // Slightly increased cost
    range: 135, // Increased range
    fireRate: 5.5, // Faster fire rate
    dmg: 12, // Increased damage
    bulletSpeed: 420,
    critChance: 0.15, // Increased crit chance
    critMultiplier: 1.6, // Increased crit multiplier
    color: "#8bc34a",
    maxLevel: 15, // More levels for early game
    hp: 380, // Increased HP
    unlockPrice: 180,
    upgradePriceBase: 35,
    persistentMaxLevel: 150,
    class: ArcherTower,
  },
  lightning: {
    name: "Lightning",
    cost: 350, // Increased cost
    range: 160, // Increased range
    fireRate: 1.8, // Faster fire rate
    dmg: 35, // Increased damage
    chainCount: 5, // More chains
    chainRange: 110, // Increased chain range
    stunChance: 0.25, // Increased stun chance
    stunDuration: 1.5, // Longer stun
    color: "#00ffff",
    maxLevel: 7, // More levels
    hp: 550, // Increased HP
    unlockPrice: 750, // Increased unlock price
    upgradePriceBase: 150,
    persistentMaxLevel: 70,
    size: { align: "T", occupy: 2 },
    class: LightningTower,
  },
  shadow: {
    name: "Shadow",
    cost: 380, // Increased cost
    range: 150, // Increased range
    fireRate: 1.5, // Faster fire rate
    dmg: 20, // Increased base damage
    curseDmg: 7, // Increased curse damage
    curseDuration: 5, // Longer curse
    chainCount: 4, // More chains
    chainRange: 100, // Increased chain range
    color: "#800080",
    maxLevel: 6, // More levels
    hp: 520, // Increased HP
    unlockPrice: 950, // Increased unlock price
    upgradePriceBase: 190,
    persistentMaxLevel: 60,
    size: { align: "T", occupy: 2 },
    class: ShadowTower,
  },
  wizard: {
    name: "Wizard",
    cost: 390, // Increased cost
    range: 160, // Increased range
    fireRate: 1.5, // Faster fire rate
    dmg: 35, // Increased damage
    chainCount: 3, // More chains
    chainRange: 90, // Increased chain range
    color: "#7f00ff",
    maxLevel: 7, // More levels
    hp: 520, // Increased HP
    unlockPrice: 900, // Increased unlock price
    upgradePriceBase: 180,
    persistentMaxLevel: 70,
    size: { align: "T", occupy: 2 },
    class: WizardTower,
  },
  wind: {
    name: "Wind",
    cost: 220, // Increased cost
    range: 150, // Increased range
    fireRate: 1.5, // Faster fire rate
    knockback: 50, // Stronger knockback
    slowAmount: 0.55, // Stronger slow
    slowDuration: 2, // Longer slow
    color: "#00bfff",
    maxLevel: 8, // More levels
    hp: 450, // Increased HP
    unlockPrice: 550, // Increased unlock price
    upgradePriceBase: 110,
    persistentMaxLevel: 80,
    size: { align: "T", occupy: 2 },
    class: WindTower,
  },
  volcano: {
    name: "Volcano",
    cost: 650, // Increased cost
    range: 220, // Increased range
    fireRate: 0.35, // Slightly faster fire rate
    dmg: 100, // Significantly increased damage
    splash: 70, // Increased splash
    color: "#ff3300",
    maxLevel: 5, // More levels
    hp: 850, // Increased HP
    unlockPrice: 1600, // Increased unlock price
    upgradePriceBase: 320,
    persistentMaxLevel: 50,
    size: { align: "T", occupy: 2 },
    class: VolcanoTower,
  },
  carM249: {
    name: "Car M249",
    cost: 600,
    range: 190, // Increased range
    fireRate: 4, // Increased fire rate
    dmg: 18, // Increased damage
    color: "#2288ff",
    maxLevel: 8, // More levels
    hp: 600, // Increased HP
    unlockPrice: 1050,
    upgradePriceBase: 210,
    persistentMaxLevel: 80,
    class: CarM249Tower,
  },
  smallTank: {
    name: "Small Tank",
    cost: 350, // Slightly increased cost
    range: 170, // Increased range
    fireRate: 1.8, // Faster fire rate
    dmg: 180, // Increased damage
    splash: 45, // Increased splash
    bulletSpeed: 400,
    color: "#556b2f",
    maxLevel: 6, // More levels
    hp: 750, // Significantly increased HP
    unlockPrice: 850,
    upgradePriceBase: 170,
    persistentMaxLevel: 60,
    size: { align: "LR", occupy: 2 },
    class: SmallTank,
  },
  mediumTank: {
    name: "Medium Tank",
    cost: 550, // Slightly increased cost
    range: 190, // Increased range
    fireRate: 1.2, // Faster fire rate
    dmg: 350, // Increased damage
    splash: 70, // Increased splash
    bulletSpeed: 320,
    color: "#8b4513",
    maxLevel: 5, // More levels
    hp: 3500, // Increased HP, confirming its tankiness
    unlockPrice: 1600,
    upgradePriceBase: 320,
    persistentMaxLevel: 50,
    size: { align: "TBLR", occupy: 2 },
    class: MediumTank,
  },
  bigTank: {
    name: "Big Tank",
    cost: 1050, // Increased cost
    range: 210, // Increased range
    fireRate: 0.8, // Faster fire rate
    dmg: 700, // Increased damage
    splash: 120, // Increased splash
    bulletSpeed: 240,
    color: "#4b2e1e",
    topFireRate: 12, // Increased top turret fire rate
    topDmg: 35, // Increased top turret damage
    topBulletSpeed: 750,
    size: { align: "TBLR", occupy: 2 },
    maxLevel: 4, // More levels
    hp: 4500, // Significantly increased HP
    unlockPrice: 2700, // Increased unlock price
    upgradePriceBase: 550,
    persistentMaxLevel: 40,
    class: BigTank,
  },
  behemothTank: {
    name: "Behemoth Tank",
    cost: 2500, // Increased cost
    range: 300, // Increased range
    fireRate: 0.6, // Faster fire rate
    dmg: 1100, // Significantly increased damage
    splash: 150, // Increased splash
    bulletSpeed: 280,
    color: "#a8e0ff",
    topFireRate: 18, // Increased top turret fire rate
    topDmg: 45, // Increased top turret damage
    maxLevel: 3,
    hp: 6000, // Significantly increased HP
    topBulletSpeed: 850,
    size: { align: "TBLR", occupy: 3 },
    unlockPrice: 5500, // Increased unlock price
    upgradePriceBase: 1100,
    persistentMaxLevel: 30,
    class: BehemothTank,
  },
  helicopter: {
    name: "Heli Pad",
    cost: 1600, // Slightly increased cost
    range: 240, // Increased range
    fireRate: 14, // Faster fire rate
    dmg: 40, // Increased damage
    bulletSpeed: 800,
    color: "#ffdd99",
    size: { align: "TBLR", occupy: 1 },
    maxLevel: 5, // More levels
    hp: 700, // Increased HP
    unlockPrice: 3200, // Increased unlock price
    upgradePriceBase: 650,
    persistentMaxLevel: 50,
    class: HelicopterTower,
  },
  blackHawk: {
    name: "Black Hawk",
    cost: 2800, // Increased cost
    range: 300, // Increased range
    fireRate: 18, // Faster fire rate
    dmg: 55, // Increased damage
    bulletSpeed: 850,
    color: "#2c3e50",
    size: { align: "TBLR", occupy: 1 },
    maxLevel: 4, // More levels
    hp: 900, // Increased HP
    unlockPrice: 4500, // Increased unlock price
    upgradePriceBase: 850,
    persistentMaxLevel: 40,
    class: BlackHawkTower,
  },
  jet: {
    name: "Stealth Jet",
    cost: 6500, // Increased cost
    range: Infinity,
    fireRate: 1.0, // Slightly faster fire rate, still a powerful strike
    dmg: 1200, // Significantly increased damage
    bulletSpeed: 550,
    color: "#34495e",
    maxLevel: 3,
    hp: 800, // Increased HP
    size: { align: "TBLR", occupy: 0 },
    unlockPrice: 11000, // Increased unlock price
    upgradePriceBase: 2800,
    persistentMaxLevel: 30,
    class: JetTower,
  },
  b52Spirit: {
    name: "B-2 Spirit Bomber",
    cost: 16000, // Increased cost
    range: Infinity,
    fireRate: 0.12, // Slightly faster fire rate (still very slow)
    dmg: 1500, // Massively increased damage
    splash: 200, // Added significant splash radius
    bulletSpeed: 250, // Slightly faster bomb drop
    color: "#495057",
    maxLevel: 3,
    hp: 1000, // Increased HP
    size: { align: "TBLR", occupy: 0 },
    unlockPrice: 22000, // Increased unlock price
    upgradePriceBase: 5500,
    persistentMaxLevel: 15,
    class: B52SpiritTower,
  },
};
