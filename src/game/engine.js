import {
  CANVAS_WIDTH as W,
  CANVAS_HEIGHT as H,
  GROUND_Y,
  GRAVITY,
  STEP,
  GAME_MODES,
  ENEMY_TYPES,
  CAMPAIGN_LEVELS,
  SURVIVAL_PALETTE,
  TRAINING_PALETTE,
  POTION_HEAL,
} from './constants';
import { audio } from './audio';
import { createBackground, drawBackground, drawFighter, drawBoss } from './render';

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const centerX = (o) => o.x + o.width / 2;

const KEYMAP = {
  arrowleft: 'left',
  arrowright: 'right',
  arrowup: 'jump',
  ' ': 'jump',
  a: 'light',
  j: 'light',
  s: 'heavy',
  k: 'heavy',
  d: 'special',
  l: 'special',
  e: 'block',
  i: 'block',
  shift: 'dash',
  r: 'potion',
  h: 'potion',
};
const HELD = new Set(['left', 'right', 'block']);

const ATTACKS = {
  light: { duration: 18, active: [5, 10], damage: 10, reach: 64, knock: 4, stun: 16, stamina: 0, sfx: 'swing' },
  heavy: { duration: 32, active: [12, 18], damage: 22, reach: 84, knock: 11, stun: 28, stamina: 10, sfx: 'heavySwing' },
  special: { duration: 30, active: [10, 10], damage: 38, reach: 0, knock: 12, stun: 30, stamina: 30, sfx: 'special' },
};

const MAX_ALIVE = 6;
const BOSS_NAME = 'TITAN-X';

export class Engine {
  constructor(canvas, config, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.onEvent = onEvent;
    this.diff = config.difficulty;
    this.mode = config.mode;

    const levelDef = this.mode === GAME_MODES.CAMPAIGN ? CAMPAIGN_LEVELS[config.level - 1] : null;
    this.levelDef = levelDef;
    const palette = levelDef ? levelDef.palette : this.mode === GAME_MODES.SURVIVAL ? SURVIVAL_PALETTE : TRAINING_PALETTE;
    this.bg = createBackground(palette, 3 + (config.level || 1) * 11);

    this.input = { left: false, right: false, block: false };
    this.pressed = new Set();

    this.player = this.createPlayer(config.character, config.upgrades);
    this.potions = config.potions;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.texts = [];
    this.boss = null;
    this.spawnQueue = [];
    this.spawnSide = 1;

    this.stats = {
      score: 0,
      coins: 0,
      kills: 0,
      maxCombo: 0,
      time: 0,
      damageDealt: 0,
      damageTaken: 0,
      bossKills: 0,
      ...config.run,
      wave: 0,
      level: config.level || 1,
    };
    this.combo = 0;
    this.comboTimer = 0;
    this.frame = 0;
    this.shake = 0;
    this.hitstop = 0;
    this.hurtFlash = 0;
    this.banner = null;
    this.waveIndex = 0;
    this.wave = 0;
    this.state = 'intro';
    this.timer = 0;
    this.paused = false;
    this.acc = 0;
    this.last = 0;
    this.raf = null;

    this.loop = this.loop.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
  }

  // ---------------------------------------------------------------- cycle de vie

  start() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (this.mode === GAME_MODES.CAMPAIGN) {
      this.showBanner(`NIVEAU ${this.config.level}`, this.levelDef.name, 150);
      audio.playMusic(this.levelDef.boss ? 'boss' : 'battle');
    } else if (this.mode === GAME_MODES.SURVIVAL) {
      this.showBanner('SURVIE', 'Tenez le plus longtemps possible', 150);
      audio.playMusic('battle');
    } else {
      this.showBanner('ENTRAÎNEMENT', 'Vous êtes invincible — testez vos combos', 150);
      audio.playMusic('battle');
    }
    this.timer = 120;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  setPaused(paused) {
    if (paused === this.paused) return;
    this.paused = paused;
    this.clearInput();
    this.last = performance.now();
    this.acc = 0;
  }

  clearInput() {
    this.input.left = this.input.right = this.input.block = false;
    this.pressed.clear();
  }

  // Utilisé par les contrôles tactiles.
  setInput(action, down) {
    if (this.paused) return;
    if (HELD.has(action)) this.input[action] = down;
    else if (down) this.pressed.add(action);
  }

  requestPause() {
    if (!this.paused && this.isRunning()) this.onEvent('pause');
  }

  isRunning() {
    return this.state === 'intro' || this.state === 'fight' || this.state === 'between';
  }

  onKeyDown(e) {
    // En pause, les menus React gèrent le clavier (saisie du pseudo, reprise...).
    if (this.paused || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return;
    const key = e.key.toLowerCase();
    if (key === 'p' || key === 'escape') {
      e.preventDefault();
      if (!e.repeat) this.requestPause();
      return;
    }
    const action = KEYMAP[key];
    if (!action) return;
    e.preventDefault();
    if (HELD.has(action)) this.input[action] = true;
    else if (!e.repeat) this.pressed.add(action);
  }

  onKeyUp(e) {
    const action = KEYMAP[e.key.toLowerCase()];
    if (action && HELD.has(action)) this.input[action] = false;
  }

  onBlur() {
    this.clearInput();
    this.requestPause();
  }

  onVisibility() {
    if (document.hidden) this.requestPause();
  }

  loop(now) {
    const dt = Math.min(now - this.last, 250);
    this.last = now;
    if (!this.paused) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 5) {
        this.update();
        this.acc -= STEP;
        steps++;
      }
      if (steps === 5) this.acc = 0;
    }
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- création

  createPlayer(char, upgrades) {
    const maxHp = char.health + upgrades.maxHealth * 20;
    const maxStamina = 100 + upgrades.maxStamina * 20;
    return {
      char,
      width: 52,
      height: 104,
      x: 180,
      y: GROUND_Y - 104,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: true,
      airJumps: 0,
      hp: maxHp,
      maxHp,
      stamina: maxStamina,
      maxStamina,
      damageMult: char.damage * (1 + 0.1 * upgrades.damage),
      damageTakenMult: (1 - 0.08 * upgrades.defense) / char.defense,
      attack: null,
      iFrames: 0,
      hurtTimer: 0,
      dashTimer: 0,
      dashDir: 1,
      dashCooldown: 0,
      staminaDelay: 0,
      guardBroken: 0,
      blocking: false,
      dead: false,
      deathTimer: 0,
      animTime: 0,
    };
  }

  spawnEnemy(type, scale = { hp: 1, dmg: 1 }) {
    const d = ENEMY_TYPES[type];
    const side = this.spawnSide;
    this.spawnSide *= -1;
    const hp = Math.round(d.hp * this.diff.enemyHealth * scale.hp);
    this.enemies.push({
      type,
      def: d,
      width: d.w,
      height: d.h,
      x: side < 0 ? -d.w - 20 : W + 20,
      y: GROUND_Y - d.h,
      vx: 0,
      vy: 0,
      facing: side < 0 ? 1 : -1,
      hp,
      maxHp: hp,
      damage: d.damage * this.diff.enemyDamage * scale.dmg,
      coinScale: scale.coins || 1,
      state: 'approach',
      timer: 0,
      cooldown: randInt(30, 70),
      stun: 0,
      flash: 0,
      hitDone: false,
      entering: true,
      animTime: rand(0, 100),
      dead: false,
      deathTimer: 0,
    });
  }

  spawnBoss(scale = 1) {
    const hp = Math.round(950 * this.diff.enemyHealth * scale);
    this.boss = {
      width: 150,
      height: 230,
      x: W - 300,
      y: -300,
      vx: 0,
      vy: 0,
      facing: -1,
      hp,
      maxHp: hp,
      phase: 1,
      state: 'intro',
      next: null,
      lastAttack: null,
      timer: 0,
      flash: 0,
      shots: 0,
      contactCd: 0,
      summonCd: 0,
      airborne: true,
      dmgScale: this.diff.enemyDamage * (0.7 + scale * 0.3),
      scale,
      deathTimer: 0,
    };
    audio.playMusic('boss');
  }

  // ---------------------------------------------------------------- progression

  queueWave(types, gap = 45) {
    this.spawnQueue = types.map((type, i) => ({ type, delay: i === 0 ? 20 : gap }));
  }

  startNextWave() {
    this.wave++;
    this.stats.wave = this.wave;
    this.state = 'fight';

    if (this.mode === GAME_MODES.CAMPAIGN) {
      if (this.levelDef.boss) {
        this.spawnBoss(1);
        this.showBanner(BOSS_NAME, 'Détruisez le titan', 140);
        return;
      }
      const waves = this.levelDef.waves;
      if (waves.length > 1) this.showBanner(`VAGUE ${this.wave}/${waves.length}`, null, 80);
      this.queueWave(waves[this.wave - 1]);
      this.waveScale = { hp: 1 + (this.config.level - 1) * 0.12, dmg: 1 + (this.config.level - 1) * 0.08 };
    } else if (this.mode === GAME_MODES.SURVIVAL) {
      const n = this.wave;
      if (n % 5 === 0) {
        this.spawnBoss(0.45 + n * 0.05);
        this.showBanner(`VAGUE ${n}`, `${BOSS_NAME} approche !`, 140);
        audio.sfx('wave');
        return;
      }
      const pool = ['Grunt', 'Archer', 'Assassin', 'Mage', 'Berserker'].slice(0, Math.min(5, 1 + Math.ceil(n / 2)));
      const count = Math.min(10, 2 + Math.floor(n * 0.8));
      this.queueWave(Array.from({ length: count }, () => pool[randInt(0, pool.length - 1)]), Math.max(25, 50 - n * 2));
      this.waveScale = { hp: 1 + n * 0.08, dmg: 1 + n * 0.05, coins: 1 + n * 0.05 };
      this.showBanner(`VAGUE ${n}`, null, 90);
      audio.sfx('wave');
    } else {
      const pool = ['Grunt', 'Archer', 'Assassin', 'Mage', 'Berserker'];
      this.queueWave([pool[randInt(0, 4)], pool[randInt(0, 4)]], 60);
      this.waveScale = { hp: 1, dmg: 0.6 };
    }
  }

  onWaveCleared() {
    if (this.mode === GAME_MODES.CAMPAIGN) {
      if (this.wave >= this.levelDef.waves.length) {
        this.state = 'cleared';
        this.timer = 90;
        this.showBanner('NIVEAU TERMINÉ', null, 120);
        audio.sfx('win');
        return;
      }
      this.state = 'between';
      this.timer = 70;
    } else if (this.mode === GAME_MODES.SURVIVAL) {
      const p = this.player;
      const heal = Math.round(p.maxHp * 0.15);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      this.addText(centerX(p), p.y - 20, `+${heal} PV`, '#4ade80', 22);
      this.state = 'between';
      this.timer = 120;
    } else {
      this.state = 'between';
      this.timer = 60;
    }
  }

  showBanner(title, sub, dur) {
    this.banner = { title, sub, t: 0, dur };
  }

  // ---------------------------------------------------------------- mise à jour

  update() {
    this.frame++;
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }

    if (this.banner) {
      this.banner.t++;
      if (this.banner.t > this.banner.dur) this.banner = null;
    }
    if (this.hurtFlash > 0) this.hurtFlash--;
    this.shake = this.shake > 0.5 ? this.shake * 0.88 : 0;

    if (this.state === 'intro' || this.state === 'between') {
      if (--this.timer <= 0) this.startNextWave();
    } else if (this.state === 'fight') {
      this.stats.time += 1 / 60;
    }

    this.updatePlayer();
    this.updateSpawns();
    this.updateEnemies();
    this.updateBoss();
    this.updateProjectiles();
    this.updateEffects();

    if (this.comboTimer > 0 && --this.comboTimer === 0) this.combo = 0;

    if (this.state === 'fight' && this.spawnQueue.length === 0 && !this.boss && !this.enemies.some((e) => !e.dead)) {
      this.onWaveCleared();
    }

    if (this.state === 'dead' || this.state === 'cleared' || this.state === 'victory') {
      if (--this.timer <= 0) {
        const type = this.state === 'dead' ? 'defeat' : this.state === 'cleared' ? 'levelCleared' : 'victory';
        this.state = 'ended';
        this.onEvent(type, this.getStats());
      }
    }

    this.pressed.clear();
  }

  getStats() {
    return { ...this.stats, score: Math.round(this.stats.score), potions: this.potions };
  }

  updatePlayer() {
    const p = this.player;
    const c = p.char;
    p.animTime++;

    if (p.iFrames > 0) p.iFrames--;
    if (p.hurtTimer > 0) p.hurtTimer--;
    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.staminaDelay > 0) p.staminaDelay--;
    if (p.guardBroken > 0) p.guardBroken--;

    if (p.dead) {
      p.deathTimer++;
      p.vx *= 0.9;
      this.applyPhysics(p);
      return;
    }

    const canAct = p.hurtTimer <= 0 && p.dashTimer <= 0 && this.state !== 'ended';
    const pressed = this.pressed;

    // Soin
    if (pressed.has('potion')) {
      if (this.potions > 0 && p.hp < p.maxHp) {
        const heal = Math.round(p.maxHp * POTION_HEAL);
        p.hp = Math.min(p.maxHp, p.hp + heal);
        this.potions--;
        this.addText(centerX(p), p.y - 20, `+${heal} PV`, '#4ade80', 26);
        this.burst(centerX(p), p.y + p.height / 2, '#4ade80', 18, 5);
        audio.sfx('potion');
      } else {
        this.addText(centerX(p), p.y - 20, this.potions > 0 ? 'PV au max' : 'Aucun soin', '#94a3b8', 18);
        audio.sfx('empty');
      }
    }

    // Garde
    p.blocking = this.input.block && p.onGround && !p.attack && canAct && p.guardBroken <= 0 && p.stamina > 0;

    // Esquive
    if (pressed.has('dash') && canAct && !p.attack && p.dashCooldown <= 0) {
      if (p.stamina >= 20) {
        p.dashDir = this.input.right ? 1 : this.input.left ? -1 : p.facing;
        p.facing = p.dashDir;
        p.dashTimer = 12;
        p.dashCooldown = 40;
        p.stamina -= 20;
        p.staminaDelay = 30;
        p.iFrames = Math.max(p.iFrames, 16);
        audio.sfx('dash');
      } else {
        this.noStamina();
      }
    }

    // Déplacement
    if (p.dashTimer > 0) {
      p.dashTimer--;
      p.vx = p.dashDir * 15;
      if (this.frame % 2 === 0) this.particles.push({ ghost: true, x: p.x, y: p.y, facing: p.facing, life: 12, maxLife: 12 });
    } else if (p.hurtTimer > 0) {
      p.vx *= 0.88;
    } else if (p.blocking) {
      p.vx = 0;
      if (this.input.right) p.facing = 1;
      else if (this.input.left) p.facing = -1;
    } else {
      const move = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
      const speed = c.speed * (p.attack ? 0.35 : 1);
      p.vx = move * speed;
      if (move && !p.attack) p.facing = move;
    }

    // Saut
    if (pressed.has('jump') && canAct && !p.blocking) {
      if (p.onGround) {
        p.vy = -17;
        p.onGround = false;
        p.airJumps = c.doubleJump ? 1 : 0;
        audio.sfx('jump');
      } else if (p.airJumps > 0) {
        p.vy = -15;
        p.airJumps--;
        this.burst(centerX(p), p.y + p.height, c.colors.body, 8, 3);
        audio.sfx('jump');
      }
    }

    // Attaques
    if (!p.attack && canAct) {
      for (const type of ['special', 'heavy', 'light']) {
        if (!pressed.has(type)) continue;
        const a = ATTACKS[type];
        if (p.stamina < a.stamina) {
          this.noStamina();
          break;
        }
        p.stamina -= a.stamina;
        if (a.stamina) p.staminaDelay = 40;
        p.attack = { type, t: 0, hit: new Set() };
        p.blocking = false;
        audio.sfx(a.sfx);
        break;
      }
    }

    if (p.attack) {
      const a = ATTACKS[p.attack.type];
      p.attack.t++;
      const t = p.attack.t;
      if (t >= a.active[0] && t <= a.active[1]) {
        if (p.attack.type === 'special') {
          if (t === a.active[0]) this.firePlasma(p, a);
        } else {
          this.resolvePlayerMelee(p, a);
        }
      }
      if (t >= a.duration) p.attack = null;
    }

    // Stamina
    if (p.staminaDelay <= 0 && !p.blocking) {
      p.stamina = Math.min(p.maxStamina, p.stamina + c.staminaRegen * (p.onGround ? 1 : 0.6));
    }

    this.applyPhysics(p);
    p.x = Math.max(8, Math.min(W - p.width - 8, p.x));
  }

  noStamina() {
    const p = this.player;
    if (this.frame - (this.lastNoStamina || 0) < 30) return;
    this.lastNoStamina = this.frame;
    this.addText(centerX(p), p.y - 24, 'Stamina !', '#facc15', 18);
    audio.sfx('empty');
  }

  applyPhysics(o) {
    const wasAir = !o.onGround;
    o.vy += GRAVITY;
    o.x += o.vx;
    o.y += o.vy;
    if (o.y >= GROUND_Y - o.height) {
      o.y = GROUND_Y - o.height;
      o.vy = 0;
      o.onGround = true;
      if (wasAir && o === this.player) this.burst(centerX(o), GROUND_Y, '#ffffff33', 4, 2);
    } else {
      o.onGround = false;
    }
  }

  resolvePlayerMelee(p, a) {
    const box = {
      x: p.facing > 0 ? p.x + p.width * 0.5 : p.x + p.width * 0.5 - a.reach,
      y: p.y + 8,
      width: a.reach,
      height: p.height * 0.75,
    };
    for (const e of this.enemies) {
      if (e.dead || p.attack.hit.has(e)) continue;
      if (overlap(box, e)) {
        p.attack.hit.add(e);
        this.hitEnemy(e, a, p.attack.type, p.facing);
      }
    }
    const b = this.boss;
    if (b && b.state !== 'dying' && b.state !== 'intro' && !p.attack.hit.has(b) && overlap(box, b)) {
      p.attack.hit.add(b);
      this.hitBoss(a, p.attack.type);
    }
  }

  firePlasma(p, a) {
    this.projectiles.push({
      owner: 'player',
      kind: 'plasma',
      x: p.facing > 0 ? p.x + p.width : p.x - 60,
      y: p.y + p.height * 0.2,
      width: 60,
      height: p.height * 0.55,
      vx: p.facing * 14,
      vy: 0,
      life: 70,
      attack: a,
      hit: new Set(),
      color: p.char.colors.accent,
    });
    this.shake = Math.max(this.shake, 6);
  }

  rollDamage(base) {
    const p = this.player;
    const crit = Math.random() < p.char.crit;
    let dmg = base * p.damageMult * rand(0.9, 1.1);
    if (crit) dmg *= 1.6;
    return { dmg: Math.max(1, Math.round(dmg)), crit };
  }

  registerHit(dmg, crit, x, y, kind) {
    this.combo++;
    this.comboTimer = 110;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
    this.stats.damageDealt += dmg;
    this.stats.score += dmg * this.comboMult() * this.diff.score;
    this.addText(x, y, crit ? `${dmg}!` : `${dmg}`, crit ? '#facc15' : '#ffffff', crit ? 32 : 22);
    if (crit) this.addText(x, y - 28, 'CRITIQUE', '#facc15', 16);
    this.burst(x, y + 20, crit ? '#facc15' : '#ff9100', crit ? 16 : 9, crit ? 7 : 5);
    audio.sfx(crit ? 'crit' : kind === 'light' ? 'hit' : 'heavyHit');
    this.hitstop = Math.max(this.hitstop, crit || kind !== 'light' ? 5 : 2);
    if (kind !== 'light') this.shake = Math.max(this.shake, kind === 'special' ? 8 : 6);
  }

  comboMult() {
    return 1 + Math.min(this.combo, 20) * 0.05;
  }

  hitEnemy(e, a, kind, dir) {
    const { dmg, crit } = this.rollDamage(a.damage);
    e.hp -= dmg;
    e.flash = 6;
    const knock = kind === 'special' ? a.knock : a.knock * (e.def.armor ? 0.3 : 1);
    if (!(e.def.armor && kind === 'light')) {
      e.stun = a.stun;
      e.state = 'hurt';
    }
    e.vx = dir * knock;
    if (kind !== 'light' && !e.def.armor) e.vy = -4;
    this.registerHit(dmg, crit, centerX(e), e.y, kind);
    if (e.hp <= 0) this.killEnemy(e, dir);
  }

  hitBoss(a, kind) {
    const b = this.boss;
    const { dmg, crit } = this.rollDamage(a.damage);
    b.hp -= dmg;
    b.flash = 6;
    this.registerHit(dmg, crit, centerX(b), b.y + 40, kind);
    if (b.hp <= 0) {
      b.hp = 0;
      b.state = 'dying';
      b.timer = 150;
      b.vx = 0;
      this.projectiles = this.projectiles.filter((pr) => pr.owner === 'player');
      audio.sfx('bossRoar');
    }
  }

  killEnemy(e, dir) {
    e.dead = true;
    e.deathTimer = 40;
    e.vx = dir * 6;
    e.vy = -6;
    this.stats.kills++;
    this.stats.score += e.def.score * this.comboMult() * this.diff.score;
    const coins = Math.max(1, Math.round(randInt(e.def.coins[0], e.def.coins[1]) * this.diff.coins * e.coinScale));
    if (this.mode !== GAME_MODES.TRAINING) {
      this.stats.coins += coins;
      this.addText(centerX(e), e.y - 30, `+${coins} ¢`, '#fbbf24', 22);
    }
    this.burst(centerX(e), e.y + e.height / 2, e.def.color, 26, 8);
    audio.sfx('kill');
    setTimeout(() => audio.sfx('coin'), 120);
  }

  damagePlayer(raw, dir, { unblockable = false } = {}) {
    const p = this.player;
    if (p.dead || p.iFrames > 0 || this.state === 'ended' || this.state === 'cleared' || this.state === 'victory') return false;

    const fromFront = p.facing === -dir;
    let dmg = raw * p.damageTakenMult;

    if (p.blocking && fromFront && !unblockable) {
      dmg *= p.char.blockReduction;
      p.stamina = Math.max(0, p.stamina - 14);
      p.staminaDelay = 40;
      p.vx = dir * 3;
      p.iFrames = 8;
      this.burst(centerX(p) + p.facing * 30, p.y + p.height * 0.4, '#7dd3fc', 10, 5);
      audio.sfx('block');
      if (p.stamina <= 0) {
        p.guardBroken = 70;
        p.hurtTimer = 40;
        p.blocking = false;
        this.addText(centerX(p), p.y - 30, 'GARDE BRISÉE', '#f87171', 22);
      }
    } else {
      p.hurtTimer = 18;
      p.iFrames = 45;
      p.vx = dir * 7;
      p.vy = -5;
      p.attack = null;
      p.blocking = false;
      this.combo = 0;
      this.comboTimer = 0;
      this.shake = Math.max(this.shake, 8);
      this.hurtFlash = 12;
      this.burst(centerX(p), p.y + p.height / 2, '#ff1744', 10, 5);
      audio.sfx('hurt');
    }

    dmg = Math.max(1, Math.round(dmg));
    p.hp -= dmg;
    this.stats.damageTaken += dmg;
    this.addText(centerX(p), p.y - 10, `-${dmg}`, '#f87171', 22);

    if (this.mode === GAME_MODES.TRAINING && p.hp <= 1) {
      p.hp = p.maxHp;
      this.addText(centerX(p), p.y - 40, 'PV restaurés', '#4ade80', 18);
    }

    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.attack = null;
      p.blocking = false;
      this.state = 'dead';
      this.timer = 110;
      this.showBanner('K.O.', null, 110);
      audio.stopMusic();
      audio.sfx('lose');
    }
    return true;
  }

  updateSpawns() {
    if (this.state !== 'fight' || this.spawnQueue.length === 0) return;
    const alive = this.enemies.filter((e) => !e.dead).length;
    if (alive >= MAX_ALIVE) return;
    const next = this.spawnQueue[0];
    if (--next.delay <= 0) {
      this.spawnQueue.shift();
      this.spawnEnemy(next.type, this.waveScale);
    }
  }

  updateEnemies() {
    const p = this.player;
    for (const e of this.enemies) {
      e.animTime++;
      if (e.flash > 0) e.flash--;

      if (e.dead) {
        e.deathTimer--;
        e.vx *= 0.92;
        this.applyPhysics(e);
        continue;
      }

      this.applyPhysics(e);
      if (e.entering) {
        if (e.x > 0 && e.x < W - e.width) e.entering = false;
      } else {
        e.x = Math.max(0, Math.min(W - e.width, e.x));
      }

      const dx = centerX(p) - centerX(e);
      const dist = Math.abs(dx);
      const dir = Math.sign(dx) || 1;
      const d = e.def;

      if (e.stun > 0) {
        e.stun--;
        e.vx *= 0.85;
        if (e.stun === 0) {
          e.state = 'approach';
          e.cooldown = Math.max(e.cooldown, 20);
        }
        continue;
      }

      if (p.dead) {
        e.vx *= 0.8;
        e.state = 'approach';
        continue;
      }

      switch (e.state) {
        case 'approach': {
          e.facing = dir;
          if (e.cooldown > 0) e.cooldown--;
          if (d.ranged) {
            if (dist < 260 && !(e.x <= 2 && dir > 0) && !(e.x >= W - e.width - 2 && dir < 0)) e.vx = -dir * d.speed;
            else if (dist > 460 || e.entering) e.vx = dir * d.speed;
            else e.vx *= 0.8;
            if (dist <= d.reach && e.cooldown <= 0 && !e.entering) {
              e.state = 'windup';
              e.timer = d.windup;
            }
          } else {
            // Distance (centre à centre) à laquelle la hitbox de l'attaque recouvre bien le joueur.
            const range = d.reach + p.width / 2 - 14;
            if (dist > range) e.vx = dir * d.speed;
            else e.vx *= 0.7;
            if (dist <= range + 10 && e.cooldown <= 0 && Math.abs(p.y + p.height - (e.y + e.height)) < 90) {
              e.state = 'windup';
              e.timer = d.windup;
            }
          }
          break;
        }
        case 'windup':
          e.vx *= 0.8;
          if (--e.timer <= 0) {
            e.state = 'attack';
            e.timer = 12;
            e.hitDone = false;
            if (d.ranged) this.fireEnemyProjectile(e);
            else if (e.type === 'Berserker' || e.type === 'Assassin') e.vx = e.facing * (e.type === 'Assassin' ? 9 : 6);
          }
          break;
        case 'attack':
          if (!d.ranged && !e.hitDone) {
            const box = {
              x: e.facing > 0 ? e.x + e.width * 0.5 : e.x + e.width * 0.5 - d.reach,
              y: e.y + 10,
              width: d.reach,
              height: e.height * 0.7,
            };
            if (overlap(box, p)) {
              e.hitDone = true;
              this.damagePlayer(e.damage, e.facing);
            }
          }
          e.vx *= 0.85;
          if (--e.timer <= 0) {
            e.state = 'recover';
            e.timer = 22;
          }
          break;
        case 'recover':
          e.vx *= 0.8;
          if (--e.timer <= 0) {
            e.state = 'approach';
            e.cooldown = randInt(d.cooldown[0], d.cooldown[1]);
          }
          break;
        default:
          e.state = 'approach';
      }
    }

    // Les ennemis s'écartent légèrement les uns des autres pour éviter les empilements.
    const alive = this.enemies.filter((e) => !e.dead && !e.entering);
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        const diff = centerX(b) - centerX(a);
        const min = (a.width + b.width) * 0.4;
        if (Math.abs(diff) < min) {
          const push = (min - Math.abs(diff)) * 0.1 * (Math.sign(diff) || 1);
          a.x -= push;
          b.x += push;
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !e.dead || e.deathTimer > 0);
  }

  fireEnemyProjectile(e) {
    const p = this.player;
    const ox = centerX(e) + e.facing * 24;
    const oy = e.y + e.height * 0.32;
    if (e.def.ranged === 'arrow') {
      this.projectiles.push({ owner: 'enemy', kind: 'arrow', x: ox, y: oy, width: 28, height: 6, vx: e.facing * 9, vy: 0, life: 200, damage: e.damage, color: e.def.accent });
      audio.sfx('shoot');
    } else {
      const tx = centerX(p);
      const ty = p.y + p.height * 0.4;
      const ang = Math.atan2(ty - oy, tx - ox);
      this.projectiles.push({ owner: 'enemy', kind: 'orb', x: ox - 10, y: oy - 10, width: 20, height: 20, vx: Math.cos(ang) * 5.5, vy: Math.sin(ang) * 5.5, life: 240, damage: e.damage, color: e.def.accent });
      audio.sfx('orb');
    }
  }

  updateBoss() {
    const b = this.boss;
    if (!b) return;
    const p = this.player;
    if (b.flash > 0) b.flash--;
    if (b.contactCd > 0) b.contactCd--;
    if (b.summonCd > 0) b.summonCd--;

    const wasAir = b.airborne;
    b.vy += GRAVITY;
    b.x += b.vx;
    b.y += b.vy;
    if (b.y >= GROUND_Y - b.height) {
      b.y = GROUND_Y - b.height;
      b.vy = 0;
      b.airborne = false;
    } else {
      b.airborne = true;
    }
    const hitWall = b.x <= 0 || b.x >= W - b.width;
    b.x = Math.max(0, Math.min(W - b.width, b.x));
    const landed = wasAir && !b.airborne;

    const dx = centerX(p) - centerX(b);
    const dir = Math.sign(dx) || 1;

    if (b.state === 'dying') {
      b.timer--;
      if (this.frame % 6 === 0) {
        this.burst(b.x + rand(0, b.width), b.y + rand(0, b.height), ['#ff9100', '#ff1744', '#ffffff'][randInt(0, 2)], 14, 7);
        audio.sfx('heavyHit');
        this.shake = Math.max(this.shake, 6);
      }
      if (b.timer <= 0) this.onBossDefeated();
      return;
    }

    const newPhase = b.hp / b.maxHp > 0.66 ? 1 : b.hp / b.maxHp > 0.33 ? 2 : 3;
    if (newPhase > b.phase) {
      b.phase = newPhase;
      this.showBanner(`PHASE ${newPhase}`, newPhase === 3 ? 'Le titan entre en rage !' : 'Le titan accélère', 90);
      audio.sfx('bossRoar');
      this.shake = 14;
    }

    switch (b.state) {
      case 'intro':
        if (landed) {
          this.shake = 22;
          audio.sfx('slam');
          audio.sfx('bossRoar');
          b.state = 'recover';
          b.timer = 60;
        }
        break;
      case 'idle': {
        b.facing = dir;
        const speed = 1 + b.phase * 0.4;
        b.vx = Math.abs(dx) > 260 ? dir * speed : Math.abs(dx) < 140 ? -dir * speed * 0.6 : 0;
        if (--b.timer <= 0) this.chooseBossAttack();
        break;
      }
      case 'windup':
        b.vx = 0;
        if (--b.timer <= 0) this.beginBossAttack(b.next);
        break;
      case 'charge':
        b.vx = b.facing * (12 + b.phase * 1.5);
        if (this.frame % 3 === 0) this.burst(centerX(b) - b.facing * 60, GROUND_Y - 10, '#ff9100', 3, 3);
        if (hitWall || --b.timer <= 0) {
          if (hitWall) {
            this.shake = 16;
            audio.sfx('slam');
          }
          b.vx = 0;
          b.state = 'recover';
          b.timer = 55 - b.phase * 5;
        }
        break;
      case 'slam':
        if (landed) {
          this.shake = 20;
          audio.sfx('slam');
          const speed = 8 + b.phase;
          [-1, 1].forEach((d) => {
            this.projectiles.push({ owner: 'enemy', kind: 'shock', x: centerX(b) - 20, y: GROUND_Y - 44, width: 40, height: 44, vx: d * speed, vy: 0, life: 160, damage: 18 * b.dmgScale, color: '#ff3d00', unblockable: true });
          });
          b.vx = 0;
          b.state = 'recover';
          b.timer = 50 - b.phase * 5;
        }
        break;
      case 'barrage':
        b.vx = 0;
        b.facing = dir;
        if (--b.timer <= 0) {
          if (b.shots > 0) {
            b.shots--;
            b.timer = 14 - b.phase * 2;
            const ox = centerX(b) + b.facing * b.width * 0.75;
            const oy = b.y + b.height * 0.3;
            const ang = Math.atan2(p.y + p.height * 0.5 - oy, centerX(p) - ox) + rand(-0.08, 0.08);
            this.projectiles.push({ owner: 'enemy', kind: 'laser', x: ox, y: oy, width: 22, height: 10, vx: Math.cos(ang) * 9, vy: Math.sin(ang) * 9, life: 200, damage: 11 * b.dmgScale, color: '#ff1744' });
            audio.sfx('shoot');
          } else {
            b.state = 'recover';
            b.timer = 40;
          }
        }
        break;
      case 'recover':
        b.vx *= 0.85;
        if (--b.timer <= 0) {
          b.state = 'idle';
          b.timer = Math.max(20, 70 - b.phase * 15);
        }
        break;
      default:
        b.state = 'idle';
    }

    // Contact : le titan repousse et blesse le joueur.
    if (b.state !== 'intro' && overlap(p, b) && !p.dead) {
      if (b.contactCd <= 0) {
        const dmg = (b.state === 'charge' ? 20 : 8) * b.dmgScale;
        if (this.damagePlayer(dmg, dir, { unblockable: b.state === 'charge' })) b.contactCd = 40;
      }
      if (p.dashTimer <= 0) {
        if (centerX(p) < centerX(b)) p.x = Math.max(8, b.x - p.width);
        else p.x = Math.min(W - p.width - 8, b.x + b.width);
      }
    }
  }

  chooseBossAttack() {
    const b = this.boss;
    const options = ['charge', 'slam', 'barrage'];
    if (b.phase >= 3 && b.summonCd <= 0 && this.enemies.filter((e) => !e.dead).length < 2) options.push('summon', 'summon');
    let pick = options[randInt(0, options.length - 1)];
    if (pick === b.lastAttack) pick = options[randInt(0, options.length - 1)];
    b.lastAttack = pick;
    b.next = pick;
    b.state = 'windup';
    b.timer = (pick === 'charge' ? 66 : 54) - b.phase * 8;
    if (pick === 'charge') audio.sfx('charge');
  }

  beginBossAttack(kind) {
    const b = this.boss;
    const p = this.player;
    if (kind === 'charge') {
      b.state = 'charge';
      b.timer = 80;
      b.facing = Math.sign(centerX(p) - centerX(b)) || -1;
    } else if (kind === 'slam') {
      b.state = 'slam';
      b.vy = -19;
      b.airborne = true;
      b.vx = Math.max(-9, Math.min(9, (centerX(p) - centerX(b)) / 38));
    } else if (kind === 'barrage') {
      b.state = 'barrage';
      b.shots = 2 + b.phase;
      b.timer = 6;
    } else {
      b.summonCd = 600;
      const s = this.waveScale || { hp: 1, dmg: 1 };
      this.spawnEnemy('Grunt', s);
      this.spawnEnemy(Math.random() < 0.5 ? 'Archer' : 'Assassin', s);
      this.addText(centerX(b), b.y - 20, 'RENFORTS !', '#ff1744', 26);
      b.state = 'recover';
      b.timer = 40;
    }
  }

  onBossDefeated() {
    const b = this.boss;
    this.stats.bossKills++;
    this.stats.score += 5000 * b.scale * this.diff.score;
    const coins = Math.round(150 * b.scale * this.diff.coins);
    this.stats.coins += coins;
    this.addText(centerX(b), b.y, `+${coins} ¢`, '#fbbf24', 34);
    this.burst(centerX(b), b.y + b.height / 2, '#ffffff', 60, 12);
    this.boss = null;
    this.shake = 25;

    if (this.mode === GAME_MODES.CAMPAIGN) {
      this.enemies.forEach((e) => {
        if (!e.dead) this.killEnemy(e, 1);
      });
      this.state = 'victory';
      this.timer = 150;
      this.showBanner('VICTOIRE', `${BOSS_NAME} est détruit`, 150);
      audio.stopMusic();
      audio.sfx('win');
    } else {
      audio.playMusic('battle');
      audio.sfx('win');
    }
  }

  updateProjectiles() {
    const p = this.player;
    for (const pr of this.projectiles) {
      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life--;

      if (pr.owner === 'enemy') {
        if (!p.dead && overlap(pr, p)) {
          const dir = Math.sign(pr.vx) || 1;
          if (this.damagePlayer(pr.damage, dir, { unblockable: pr.unblockable })) pr.life = 0;
        }
      } else {
        for (const e of this.enemies) {
          if (!e.dead && !pr.hit.has(e) && overlap(pr, e)) {
            pr.hit.add(e);
            this.hitEnemy(e, pr.attack, 'special', Math.sign(pr.vx));
          }
        }
        const b = this.boss;
        if (b && b.state !== 'dying' && b.state !== 'intro' && !pr.hit.has(b) && overlap(pr, b)) {
          pr.hit.add(b);
          this.hitBoss(pr.attack, 'special');
        }
        if (this.frame % 2 === 0) this.particles.push({ x: pr.x + pr.width / 2, y: pr.y + rand(0, pr.height), vx: -pr.vx * 0.1, vy: rand(-1, 1), life: 18, maxLife: 18, color: pr.color, size: 5 });
      }
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0 && pr.x > -120 && pr.x < W + 120 && pr.y < H && pr.y > -100);
  }

  updateEffects() {
    for (const pt of this.particles) {
      pt.life--;
      if (pt.ghost) continue;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += pt.gravity || 0;
      pt.vx *= 0.96;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
    if (this.particles.length > 500) this.particles.splice(0, this.particles.length - 500);

    for (const t of this.texts) {
      t.life--;
      t.y += t.vy;
      t.vy *= 0.95;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const life = randInt(18, 36);
      this.particles.push({ x, y, vx: rand(-speed, speed), vy: rand(-speed, speed * 0.4), gravity: 0.25, life, maxLife: life, color, size: rand(2, 5) });
    }
  }

  addText(x, y, text, color, size = 20) {
    this.texts.push({ x, y, text, color, size, life: 50, vy: -2.2 });
  }

  // ---------------------------------------------------------------- HUD

  getHud() {
    const p = this.player;
    const b = this.boss;
    return {
      hp: Math.max(0, Math.ceil(p.hp)),
      maxHp: p.maxHp,
      stamina: Math.floor(p.stamina),
      maxStamina: p.maxStamina,
      score: Math.round(this.stats.score),
      coins: this.stats.coins,
      combo: this.combo,
      comboPct: this.comboTimer / 110,
      potions: this.potions,
      wave: this.wave,
      totalWaves: this.levelDef ? this.levelDef.waves.length : null,
      boss: b ? { name: BOSS_NAME, hp: Math.max(0, Math.ceil(b.hp)), maxHp: b.maxHp, phase: b.phase } : null,
      enemiesLeft: this.enemies.filter((e) => !e.dead).length + this.spawnQueue.length,
      guardBroken: p.guardBroken > 0,
    };
  }

  // ---------------------------------------------------------------- rendu

  render() {
    const ctx = this.ctx;
    const p = this.player;
    ctx.save();
    if (this.shake > 0.5 && !this.paused) {
      ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    }

    drawBackground(ctx, this.bg, centerX(p) / W, this.frame);

    // Ennemis
    for (const e of this.enemies) this.drawEnemy(ctx, e);

    // Boss
    if (this.boss) drawBoss(ctx, this.boss, this.frame);

    // Images rémanentes d'esquive
    for (const pt of this.particles) {
      if (!pt.ghost) continue;
      ctx.save();
      ctx.globalAlpha = (pt.life / pt.maxLife) * 0.35;
      drawFighter(ctx, { x: pt.x, y: pt.y, width: p.width, height: p.height, facing: pt.facing, pose: 'jump' }, p.char.colors, { glow: false });
      ctx.restore();
    }

    // Joueur
    this.drawPlayer(ctx, p);

    // Projectiles
    for (const pr of this.projectiles) this.drawProjectile(ctx, pr);

    // Particules
    for (const pt of this.particles) {
      if (pt.ghost) continue;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;

    // Textes flottants
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 20);
      ctx.font = `700 ${Math.round(t.size * 1.2)}px Rajdhani, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Flash rouge quand le joueur est touché
    if (this.hurtFlash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,0,40,${(this.hurtFlash / 12) * 0.45})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.banner) this.drawBanner(ctx);
  }

  drawPlayer(ctx, p) {
    let pose = 'idle';
    let progress = 0;
    if (p.dead) pose = 'dead';
    else if (p.hurtTimer > 0) pose = 'hurt';
    else if (p.blocking) pose = 'block';
    else if (p.attack) {
      pose = p.attack.type;
      progress = p.attack.t / ATTACKS[p.attack.type].duration;
    } else if (!p.onGround) pose = 'jump';
    else if (Math.abs(p.vx) > 0.5) pose = 'walk';

    const blink = p.iFrames > 0 && p.dashTimer <= 0 && !p.blocking && Math.floor(this.frame / 4) % 2 === 0;
    ctx.save();
    if (p.dead) this.rotateDead(ctx, p, Math.min(1, p.deathTimer / 25));
    drawFighter(
      ctx,
      { x: p.x, y: p.y, width: p.width, height: p.height, facing: p.facing, pose, animTime: p.animTime, attackProgress: progress, alpha: blink ? 0.4 : 1 },
      p.char.colors,
    );
    ctx.restore();

    if (p.attack && p.attack.type !== 'special') {
      const a = ATTACKS[p.attack.type];
      const t = p.attack.t;
      if (t >= a.active[0] - 1 && t <= a.active[1] + 3) {
        ctx.save();
        ctx.strokeStyle = p.char.colors.accent;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = p.attack.type === 'heavy' ? 6 : 4;
        ctx.shadowColor = p.char.colors.accent;
        ctx.shadowBlur = 16;
        const cx = centerX(p) + p.facing * 20;
        const cy = p.y + p.height * 0.42;
        ctx.beginPath();
        if (p.facing > 0) ctx.arc(cx, cy, a.reach * 0.75, -Math.PI / 3, Math.PI / 3);
        else ctx.arc(cx, cy, a.reach * 0.75, (2 * Math.PI) / 3, (4 * Math.PI) / 3);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  rotateDead(ctx, o, progress) {
    const cx = centerX(o);
    const feet = o.y + o.height;
    ctx.translate(cx, feet);
    ctx.rotate(-o.facing * progress * (Math.PI / 2));
    ctx.translate(-cx, -feet);
  }

  drawEnemy(ctx, e) {
    const d = e.def;
    let pose = 'idle';
    let progress = 0;
    if (e.dead) pose = 'dead';
    else if (e.stun > 0) pose = 'hurt';
    else if (e.state === 'windup') pose = d.ranged ? 'idle' : 'windup';
    else if (e.state === 'attack') {
      pose = d.ranged ? 'idle' : e.type === 'Berserker' ? 'heavy' : 'light';
      progress = 1 - e.timer / 12;
    } else if (Math.abs(e.vx) > 0.3) pose = 'walk';

    ctx.save();
    if (e.dead) {
      ctx.globalAlpha = Math.max(0, e.deathTimer / 40);
      this.rotateDead(ctx, e, Math.min(1, (40 - e.deathTimer) / 15));
    }
    drawFighter(
      ctx,
      { x: e.x, y: e.y, width: e.width, height: e.height, facing: e.facing, pose, animTime: e.animTime, attackProgress: progress, flash: e.flash > 0 },
      { body: d.color, accent: d.accent, visor: '#ffffff' },
      { bulky: e.type === 'Berserker', weapon: e.type === 'Archer' ? 'bow' : e.type === 'Mage' ? 'staff' : null },
    );
    ctx.restore();

    if (e.dead) return;

    // Avertissement d'attaque
    if (e.state === 'windup') {
      ctx.save();
      ctx.font = '900 30px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = Math.floor(this.frame / 4) % 2 ? '#ff1744' : '#ffffff';
      ctx.fillText('!', centerX(e), e.y - 22);
      ctx.restore();
    }

    // Barre de vie
    if (e.hp < e.maxHp) {
      const bw = Math.max(40, e.width);
      const bx = centerX(e) - bw / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx - 1, e.y - 13, bw + 2, 7);
      ctx.fillStyle = d.color;
      ctx.fillRect(bx, e.y - 12, bw * Math.max(0, e.hp / e.maxHp), 5);
    }
  }

  drawProjectile(ctx, pr) {
    ctx.save();
    ctx.shadowColor = pr.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = pr.color;
    if (pr.kind === 'plasma') {
      const g = ctx.createLinearGradient(pr.x, 0, pr.x + pr.width, 0);
      const fade = pr.vx > 0 ? ['transparent', pr.color] : [pr.color, 'transparent'];
      g.addColorStop(0, fade[0]);
      g.addColorStop(1, fade[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(pr.x + pr.width / 2, pr.y + pr.height / 2, pr.width / 2, pr.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pr.vx > 0 ? pr.x + pr.width - 10 : pr.x + 4, pr.y + 6, 6, pr.height - 12);
    } else if (pr.kind === 'orb') {
      ctx.beginPath();
      ctx.arc(pr.x + pr.width / 2, pr.y + pr.height / 2, pr.width / 2 + Math.sin(this.frame * 0.3) * 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pr.kind === 'shock') {
      ctx.globalAlpha = Math.min(1, pr.life / 30);
      ctx.beginPath();
      ctx.moveTo(pr.x, pr.y + pr.height);
      ctx.quadraticCurveTo(pr.x + pr.width / 2, pr.y - 10, pr.x + pr.width, pr.y + pr.height);
      ctx.fill();
    } else {
      ctx.translate(pr.x + pr.width / 2, pr.y + pr.height / 2);
      ctx.rotate(Math.atan2(pr.vy, pr.vx));
      ctx.fillRect(-pr.width / 2, -pr.height / 2, pr.width, pr.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pr.width / 2 - 6, -pr.height / 2 + 1, 6, pr.height - 2);
    }
    ctx.restore();
  }

  drawBanner(ctx) {
    const { title, sub, t, dur } = this.banner;
    const alpha = Math.min(1, t / 15, (dur - t) / 15);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, H * 0.32, W, sub ? 130 : 100);
    ctx.textAlign = 'center';
    ctx.font = '900 64px Orbitron, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 24;
    ctx.fillText(title, W / 2, H * 0.32 + 72);
    if (sub) {
      ctx.shadowBlur = 0;
      ctx.font = '600 26px Rajdhani, sans-serif';
      ctx.fillStyle = '#ff4ff0';
      ctx.fillText(sub, W / 2, H * 0.32 + 112);
    }
    ctx.restore();
  }
}
