import React, { useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Engine } from '@/game/engine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTERS, DIFFICULTIES, GAME_PHASES } from '@/game/constants';
import GameHUD from './GameHUD';
import TouchControls from './TouchControls';

// Monte une instance du moteur pour un niveau donné (le composant est re-créé à chaque niveau via sa key).
export default function GameStage({ engineRef }) {
  const { state, dispatch } = useGame();
  const canvasRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const s = stateRef.current;
    const engine = new Engine(
      canvasRef.current,
      {
        mode: s.mode,
        level: s.level,
        character: CHARACTERS[s.character] || CHARACTERS.WARRIOR,
        difficulty: DIFFICULTIES[s.difficulty] || DIFFICULTIES.NORMAL,
        upgrades: s.profile.upgrades,
        potions: s.profile.potions,
        run: s.run,
      },
      (type, stats) => {
        if (type === 'pause') dispatch({ type: 'PAUSE' });
        else if (type === 'levelCleared') dispatch({ type: 'LEVEL_CLEARED', payload: stats });
        else if (type === 'defeat' || type === 'victory') dispatch({ type: 'RUN_ENDED', payload: { result: type, stats } });
      },
    );
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [dispatch, engineRef]);

  const playing = state.phase === GAME_PHASES.PLAYING;
  useEffect(() => {
    engineRef.current?.setPaused(!playing);
  }, [playing, engineRef]);

  return (
    <div
      className="relative no-select"
      style={{ width: 'min(100vw, calc(100dvh * 16 / 9))', aspectRatio: '16 / 9', maxHeight: '100dvh' }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute inset-0 w-full h-full block bg-black"
        aria-label="Arène de combat"
      />
      {(playing || state.phase === GAME_PHASES.PAUSED) && <GameHUD engineRef={engineRef} />}
      {playing && <TouchControls engineRef={engineRef} />}
    </div>
  );
}
