import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_PHASES } from '@/game/constants';
import { audio } from '@/game/audio';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import GameStage from './GameStage';
import MainMenu from './ui/MainMenu';
import ModeSelection from './ui/ModeSelection';
import CharacterSelect from './ui/CharacterSelect';
import InstructionsScreen from './ui/InstructionsScreen';
import OptionsScreen from './ui/OptionsScreen';
import PauseMenu from './ui/PauseMenu';
import GameOverScreen from './ui/GameOverScreen';
import VictoryScreen from './ui/VictoryScreen';
import LevelCompleteScreen from './ui/LevelCompleteScreen';
import ShopScreen from './ui/ShopScreen';
import LeaderboardScreen from './ui/LeaderboardScreen';
import StatsScreen from './ui/StatsScreen';

const { MENU, MODE_SELECTION, CHARACTER_SELECT, PLAYING, PAUSED, GAME_OVER, VICTORY, LEVEL_COMPLETE, SHOP, INSTRUCTIONS, OPTIONS, LEADERBOARD, STATS } = GAME_PHASES;

const STAGE_PHASES = new Set([PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER, VICTORY]);
const MENU_MUSIC_PHASES = new Set([MENU, MODE_SELECTION, CHARACTER_SELECT, SHOP, LEADERBOARD, STATS, LEVEL_COMPLETE]);

function useIsPortraitTouch() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    if (!touch) return;
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return portrait;
}

export default function GameContainer() {
  const { state } = useGame();
  const engineRef = useRef(null);
  const { phase, returnTo } = state;
  const portrait = useIsPortraitTouch();

  useDocumentTitle('Jouer — Cyber Arena Fighter');

  // Le moteur reste monté pendant la pause (et les sous-menus ouverts depuis la pause) pour garder l'image du combat.
  const fromPause = (phase === OPTIONS || phase === INSTRUCTIONS) && returnTo === PAUSED;
  const showStage = state.run && (STAGE_PHASES.has(phase) || fromPause);

  useEffect(() => {
    if (MENU_MUSIC_PHASES.has(phase) || ((phase === OPTIONS || phase === INSTRUCTIONS) && !fromPause)) audio.playMusic('menu');
  }, [phase, fromPause]);

  useEffect(() => () => audio.stopMusic(), []);

  return (
    <div className="relative w-full h-[100dvh] min-h-[100vh] overflow-hidden bg-black flex items-center justify-center">
      {showStage && <GameStage key={`${state.runId}-${state.level}`} engineRef={engineRef} />}

      {phase === MENU && <MainMenu />}
      {phase === MODE_SELECTION && <ModeSelection />}
      {phase === CHARACTER_SELECT && <CharacterSelect />}
      {phase === INSTRUCTIONS && <InstructionsScreen />}
      {phase === OPTIONS && <OptionsScreen />}
      {phase === SHOP && <ShopScreen />}
      {phase === LEADERBOARD && <LeaderboardScreen />}
      {phase === STATS && <StatsScreen />}

      {phase === PAUSED && <PauseMenu />}
      {phase === GAME_OVER && <GameOverScreen />}
      {phase === VICTORY && <VictoryScreen />}
      {phase === LEVEL_COMPLETE && <LevelCompleteScreen />}

      {portrait && phase === PLAYING && (
        <div className="absolute inset-0 z-[60] bg-black/85 flex flex-col items-center justify-center text-center p-6">
          <div className="text-5xl mb-4 animate-bounce">📱↻</div>
          <p className="font-display text-xl text-cyan-300 mb-2">Tournez votre appareil</p>
          <p className="text-gray-300">Le jeu se joue en mode paysage.</p>
        </div>
      )}
    </div>
  );
}
