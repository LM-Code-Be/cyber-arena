export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const GROUND_Y = 610;
export const GRAVITY = 0.85;
export const STEP = 1000 / 60;

export const GAME_PHASES = {
  MENU: 'MENU',
  MODE_SELECTION: 'MODE_SELECTION',
  CHARACTER_SELECT: 'CHARACTER_SELECT',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  SHOP: 'SHOP',
  INSTRUCTIONS: 'INSTRUCTIONS',
  OPTIONS: 'OPTIONS',
  LEADERBOARD: 'LEADERBOARD',
  STATS: 'STATS',
};

export const GAME_MODES = {
  CAMPAIGN: 'CAMPAIGN',
  SURVIVAL: 'SURVIVAL',
  TRAINING: 'TRAINING',
};

export const MODE_LABELS = {
  CAMPAIGN: 'Campagne',
  SURVIVAL: 'Survie',
  TRAINING: 'Entraînement',
};

export const CHARACTERS = {
  WARRIOR: {
    id: 'WARRIOR',
    name: 'Guerrier',
    tagline: 'Équilibré et fiable',
    health: 120,
    speed: 5.2,
    damage: 1,
    defense: 1,
    crit: 0.1,
    staminaRegen: 0.35,
    blockReduction: 0.2,
    doubleJump: false,
    colors: { body: '#00e5ff', accent: '#ff00e6', visor: '#ffffff' },
  },
  ASSASSIN: {
    id: 'ASSASSIN',
    name: 'Assassin',
    tagline: 'Rapide, critiques fréquents, double saut',
    health: 90,
    speed: 6.6,
    damage: 1.1,
    defense: 0.85,
    crit: 0.22,
    staminaRegen: 0.45,
    blockReduction: 0.3,
    doubleJump: true,
    colors: { body: '#a3ff12', accent: '#7c3aed', visor: '#eaffd0' },
  },
  PALADIN: {
    id: 'PALADIN',
    name: 'Paladin',
    tagline: 'Lent mais très résistant, garde solide',
    health: 160,
    speed: 4.2,
    damage: 1.05,
    defense: 1.25,
    crit: 0.08,
    staminaRegen: 0.3,
    blockReduction: 0.1,
    doubleJump: false,
    colors: { body: '#ffd60a', accent: '#ff3d3d', visor: '#fff7cc' },
  },
};

export const DIFFICULTIES = {
  EASY: { id: 'EASY', name: 'Facile', enemyDamage: 0.65, enemyHealth: 0.8, score: 0.75, coins: 1 },
  NORMAL: { id: 'NORMAL', name: 'Normal', enemyDamage: 1, enemyHealth: 1, score: 1, coins: 1 },
  HARD: { id: 'HARD', name: 'Difficile', enemyDamage: 1.4, enemyHealth: 1.3, score: 1.5, coins: 1.3 },
};

export const UPGRADES = {
  damage: { id: 'damage', name: 'Nano-Lames', desc: '+10 % de dégâts par niveau', baseCost: 80, max: 5 },
  maxHealth: { id: 'maxHealth', name: 'Armure Titane', desc: '+20 PV max par niveau', baseCost: 90, max: 5 },
  maxStamina: { id: 'maxStamina', name: "Noyau d'Énergie", desc: '+20 stamina max par niveau', baseCost: 70, max: 5 },
  defense: { id: 'defense', name: 'Bouclier Cinétique', desc: '-8 % de dégâts subis par niveau', baseCost: 100, max: 5 },
};

export const upgradeCost = (id, level) => Math.round(UPGRADES[id].baseCost * (1 + level * 0.75));

export const POTION_COST = 40;
export const MAX_POTIONS = 3;
export const POTION_HEAL = 0.4; // 40 % des PV max

export const ENEMY_TYPES = {
  Grunt: { name: 'Grunt', w: 50, h: 92, hp: 45, speed: 2.2, damage: 9, reach: 46, windup: 24, cooldown: [50, 90], score: 100, coins: [6, 10], color: '#ff4d4d', accent: '#ffb3b3', ranged: false, armor: false },
  Assassin: { name: 'Assassin', w: 44, h: 84, hp: 32, speed: 4.4, damage: 11, reach: 40, windup: 14, cooldown: [40, 70], score: 140, coins: [7, 12], color: '#2ee86c', accent: '#c8ffd9', ranged: false, armor: false },
  Berserker: { name: 'Berserker', w: 70, h: 112, hp: 120, speed: 1.6, damage: 22, reach: 60, windup: 38, cooldown: [70, 110], score: 220, coins: [12, 18], color: '#c2185b', accent: '#ff80ab', ranged: false, armor: true },
  Archer: { name: 'Archer', w: 44, h: 90, hp: 35, speed: 2.6, damage: 10, reach: 520, windup: 32, cooldown: [80, 120], score: 130, coins: [7, 11], color: '#ffb300', accent: '#fff1c1', ranged: 'arrow', armor: false },
  Mage: { name: 'Mage', w: 46, h: 96, hp: 38, speed: 1.8, damage: 14, reach: 560, windup: 42, cooldown: [100, 140], score: 160, coins: [8, 13], color: '#7c4dff', accent: '#d1c4ff', ranged: 'orb', armor: false },
};

export const CAMPAIGN_LEVELS = [
  {
    name: 'Bas-Fonds Néon',
    palette: { sky: ['#0b0221', '#2a0845'], city: '#16052e', window: '#ff00e6', floor: '#1d0638', line: '#00e5ff' },
    waves: [['Grunt', 'Grunt'], ['Grunt', 'Archer', 'Grunt']],
  },
  {
    name: 'Marché Noir',
    palette: { sky: ['#020b1f', '#06284a'], city: '#041427', window: '#00e5ff', floor: '#04203a', line: '#ffb300' },
    waves: [['Grunt', 'Assassin', 'Grunt'], ['Archer', 'Assassin', 'Grunt', 'Archer']],
  },
  {
    name: 'Usine Synthétique',
    palette: { sky: ['#1a0505', '#3d0c0c'], city: '#200808', window: '#ffb300', floor: '#2b0b0b', line: '#ff4d4d' },
    waves: [['Berserker', 'Grunt', 'Grunt'], ['Mage', 'Assassin', 'Grunt'], ['Berserker', 'Mage', 'Archer']],
  },
  {
    name: 'Tours Corporatistes',
    palette: { sky: ['#03140f', '#0a3d2c'], city: '#04201a', window: '#2ee86c', floor: '#06261d', line: '#a3ff12' },
    waves: [['Assassin', 'Assassin', 'Mage'], ['Berserker', 'Berserker', 'Archer'], ['Assassin', 'Mage', 'Mage', 'Berserker']],
  },
  {
    name: 'Cœur de Titan-X',
    palette: { sky: ['#0d0000', '#330000'], city: '#1a0000', window: '#ff1744', floor: '#240000', line: '#ff1744' },
    waves: [],
    boss: true,
  },
];

export const SURVIVAL_PALETTE = {
  sky: ['#05010f', '#1b0436'],
  city: '#0e0322',
  window: '#ff4ff0',
  floor: '#140430',
  line: '#ff4ff0',
};

export const TRAINING_PALETTE = {
  sky: ['#01080f', '#062035'],
  city: '#031420',
  window: '#00e5ff',
  floor: '#05192a',
  line: '#00e5ff',
};

export const CONTROLS = [
  { keys: '← →', label: 'Se déplacer' },
  { keys: '↑ / Espace', label: 'Sauter' },
  { keys: 'A ou J', label: 'Coup rapide' },
  { keys: 'S ou K', label: 'Coup lourd' },
  { keys: 'D ou L', label: 'Onde plasma (30 stamina)' },
  { keys: 'E ou I', label: 'Garde (maintenir)' },
  { keys: 'Maj', label: 'Esquive (20 stamina)' },
  { keys: 'R ou H', label: 'Utiliser un soin' },
  { keys: 'P / Échap', label: 'Pause' },
];
