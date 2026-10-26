import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { GAME_PHASES, GAME_MODES, UPGRADES, upgradeCost, POTION_COST, MAX_POTIONS } from '@/game/constants';
import { audio } from '@/game/audio';

const SAVE_KEY = 'cyberArena_save_v2';
const MAX_SCORES = 20;

const defaultProfile = {
  wallet: 0,
  upgrades: { damage: 0, maxHealth: 0, maxStamina: 0, defense: 0 },
  potions: 1,
  bestScores: [],
  stats: {
    gamesPlayed: 0,
    victories: 0,
    totalKills: 0,
    totalCoins: 0,
    playTime: 0,
    bestCombo: 0,
    bestWave: 0,
    bossKills: 0,
    damageDealt: 0,
    levelsCleared: 0,
  },
  settings: {
    playerName: 'Joueur',
    audioEnabled: true,
    musicVolume: 50,
    sfxVolume: 70,
    showHints: true,
  },
  lastCharacter: 'WARRIOR',
  lastDifficulty: 'NORMAL',
};

const emptyRun = () => ({ score: 0, coins: 0, kills: 0, maxCombo: 0, time: 0, damageDealt: 0, damageTaken: 0, bossKills: 0 });

function loadProfile() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultProfile;
    const saved = JSON.parse(raw);
    return {
      ...defaultProfile,
      ...saved,
      upgrades: { ...defaultProfile.upgrades, ...saved.upgrades },
      stats: { ...defaultProfile.stats, ...saved.stats },
      settings: { ...defaultProfile.settings, ...saved.settings },
      bestScores: Array.isArray(saved.bestScores) ? saved.bestScores : [],
    };
  } catch {
    return defaultProfile;
  }
}

function createInitialState() {
  const profile = loadProfile();
  return {
    phase: GAME_PHASES.MENU,
    returnTo: GAME_PHASES.MENU,
    mode: null,
    character: profile.lastCharacter,
    difficulty: profile.lastDifficulty,
    level: 1,
    runId: 0,
    run: null,
    levelGain: null,
    lastResult: null,
    profile,
  };
}

// Reporte dans le profil ce qui a été gagné depuis le dernier point de sauvegarde de la partie.
function bank(state, stats) {
  if (state.mode === GAME_MODES.TRAINING) return state.profile;
  const prev = state.run || emptyRun();
  const p = state.profile;
  const coins = Math.max(0, stats.coins - prev.coins);
  return {
    ...p,
    wallet: p.wallet + coins,
    potions: stats.potions,
    stats: {
      ...p.stats,
      totalKills: p.stats.totalKills + Math.max(0, stats.kills - prev.kills),
      totalCoins: p.stats.totalCoins + coins,
      playTime: p.stats.playTime + Math.max(0, stats.time - prev.time),
      bestCombo: Math.max(p.stats.bestCombo, stats.maxCombo),
      bestWave: state.mode === GAME_MODES.SURVIVAL ? Math.max(p.stats.bestWave, stats.wave) : p.stats.bestWave,
      bossKills: p.stats.bossKills + Math.max(0, stats.bossKills - prev.bossKills),
      damageDealt: p.stats.damageDealt + Math.max(0, stats.damageDealt - prev.damageDealt),
    },
  };
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'OPEN':
      return { ...state, phase: action.payload.phase, returnTo: action.payload.returnTo ?? state.phase };

    case 'BACK':
      return { ...state, phase: state.returnTo || GAME_PHASES.MENU, returnTo: GAME_PHASES.MENU };

    case 'SELECT_MODE':
      return { ...state, mode: action.payload, phase: GAME_PHASES.CHARACTER_SELECT };

    case 'SET_CHARACTER':
      return { ...state, character: action.payload, profile: { ...state.profile, lastCharacter: action.payload } };

    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload, profile: { ...state.profile, lastDifficulty: action.payload } };

    case 'START_RUN': {
      if (state.phase === GAME_PHASES.PLAYING || !state.mode) return state;
      const counts = state.mode !== GAME_MODES.TRAINING;
      return {
        ...state,
        phase: GAME_PHASES.PLAYING,
        level: 1,
        runId: state.runId + 1,
        run: emptyRun(),
        levelGain: null,
        lastResult: null,
        profile: counts
          ? { ...state.profile, stats: { ...state.profile.stats, gamesPlayed: state.profile.stats.gamesPlayed + 1 } }
          : state.profile,
      };
    }

    case 'PAUSE':
      return state.phase === GAME_PHASES.PLAYING ? { ...state, phase: GAME_PHASES.PAUSED } : state;

    case 'RESUME':
      return { ...state, phase: GAME_PHASES.PLAYING, returnTo: GAME_PHASES.MENU };

    case 'LEVEL_CLEARED': {
      const stats = action.payload;
      const prev = state.run || emptyRun();
      const profile = bank(state, stats);
      return {
        ...state,
        phase: GAME_PHASES.LEVEL_COMPLETE,
        run: stats,
        levelGain: { coins: stats.coins - prev.coins, kills: stats.kills - prev.kills, score: stats.score - prev.score, time: stats.time - prev.time },
        profile: { ...profile, stats: { ...profile.stats, levelsCleared: profile.stats.levelsCleared + 1 } },
      };
    }

    case 'NEXT_LEVEL':
      return { ...state, level: state.level + 1, phase: GAME_PHASES.PLAYING, returnTo: GAME_PHASES.MENU };

    case 'RUN_ENDED': {
      const { result, stats } = action.payload;
      const victory = result === 'victory';
      let profile = bank(state, stats);
      let isRecord = false;

      if (state.mode !== GAME_MODES.TRAINING) {
        const best = profile.bestScores.filter((s) => s.mode === state.mode).reduce((m, s) => Math.max(m, s.score), 0);
        isRecord = stats.score > best;
        const entry = {
          id: Date.now(),
          name: profile.settings.playerName || 'Joueur',
          score: stats.score,
          mode: state.mode,
          character: state.character,
          difficulty: state.difficulty,
          reached: state.mode === GAME_MODES.CAMPAIGN ? stats.level : stats.wave,
          victory,
          date: new Date().toISOString(),
        };
        profile = {
          ...profile,
          bestScores: [...profile.bestScores, entry].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES),
          stats: { ...profile.stats, victories: profile.stats.victories + (victory ? 1 : 0) },
        };
      }

      return {
        ...state,
        phase: victory ? GAME_PHASES.VICTORY : GAME_PHASES.GAME_OVER,
        run: stats,
        lastResult: { result, stats, isRecord },
        profile,
      };
    }

    case 'QUIT_RUN':
      return { ...state, phase: GAME_PHASES.MENU, returnTo: GAME_PHASES.MENU, run: null, levelGain: null };

    case 'BUY_UPGRADE': {
      const id = action.payload;
      const level = state.profile.upgrades[id];
      const cost = upgradeCost(id, level);
      if (level >= UPGRADES[id].max || state.profile.wallet < cost) return state;
      return {
        ...state,
        profile: {
          ...state.profile,
          wallet: state.profile.wallet - cost,
          upgrades: { ...state.profile.upgrades, [id]: level + 1 },
        },
      };
    }

    case 'BUY_POTION':
      if (state.profile.potions >= MAX_POTIONS || state.profile.wallet < POTION_COST) return state;
      return {
        ...state,
        profile: { ...state.profile, wallet: state.profile.wallet - POTION_COST, potions: state.profile.potions + 1 },
      };

    case 'UPDATE_SETTINGS':
      return { ...state, profile: { ...state.profile, settings: { ...state.profile.settings, ...action.payload } } };

    case 'RESET_PROGRESS':
      return { ...createInitialState(), profile: { ...defaultProfile, settings: state.profile.settings } };

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state.profile));
    } catch {
      // Stockage indisponible (navigation privée, quota) : le jeu reste jouable sans sauvegarde.
    }
  }, [state.profile]);

  const { audioEnabled, musicVolume, sfxVolume } = state.profile.settings;
  useEffect(() => {
    audio.setSettings({ enabled: audioEnabled, musicVolume, sfxVolume });
  }, [audioEnabled, musicVolume, sfxVolume]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame doit être utilisé dans un GameProvider');
  return context;
}
