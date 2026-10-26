import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { CHARACTERS, DIFFICULTIES, GAME_PHASES, GAME_MODES, MODE_LABELS } from '@/game/constants';
import { drawFighter } from '@/game/render';
import { audio } from '@/game/audio';
import { ArrowLeft, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen } from './Screen';

function Portrait({ character }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      // drawFighter dessine relativement au sol du jeu : on recadre la vue sur le personnage.
      ctx.translate(0, -470);
      drawFighter(ctx, { x: 64, y: 506 + Math.sin(frame * 0.05) * 2, width: 52, height: 104, facing: 1, pose: 'idle', animTime: frame }, character.colors);
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [character]);
  return <canvas ref={ref} width={180} height={160} className="mx-auto h-32 w-auto" aria-hidden="true" />;
}

const Stat = ({ label, value, max }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-16 text-gray-400">{label}</span>
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-cyan-400 to-magenta-500" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  </div>
);

export default function CharacterSelect() {
  const { state, dispatch } = useGame();

  const start = () => {
    audio.sfx('wave');
    dispatch({ type: 'START_RUN' });
  };

  useEffect(() => {
    const onKey = (e) => {
      // Entrée sur un bouton focalisé déclenche déjà son clic : on évite un double lancement.
      if (e.repeat || e.target.closest?.('button')) return;
      if (e.key === 'Enter') start();
      if (e.key === 'Escape') dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MODE_SELECTION });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen
      title="CHOISIR UN COMBATTANT"
      subtitle={`Mode ${MODE_LABELS[state.mode] || ''}`}
      wide
      footer={
        <>
          <Button onClick={() => dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MODE_SELECTION })} className="bg-gray-700 hover:bg-gray-600 text-white h-12 px-6">
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </Button>
          <Button onClick={start} className="h-12 px-10 font-display text-lg bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-400 hover:to-magenta-400 text-white shadow-lg shadow-magenta-500/30">
            <Swords className="w-5 h-5 mr-2" /> COMBATTRE
          </Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-3 gap-4">
        {Object.values(CHARACTERS).map((c) => {
          const selected = state.character === c.id;
          return (
            <motion.button
              key={c.id}
              type="button"
              whileHover={{ y: -4 }}
              onClick={() => {
                audio.sfx('ui');
                dispatch({ type: 'SET_CHARACTER', payload: c.id });
              }}
              className={`rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                selected ? 'bg-white/10 border-cyan-300 shadow-lg shadow-cyan-500/20' : 'bg-black/40 border-white/15 hover:border-white/40'
              }`}
              aria-pressed={selected}
            >
              <Portrait character={c} />
              <h2 className="font-display text-xl font-bold text-center" style={{ color: c.colors.body }}>
                {c.name}
              </h2>
              <p className="text-center text-sm text-gray-300 mb-3 min-h-[2.5rem]">{c.tagline}</p>
              <div className="space-y-1.5">
                <Stat label="Vie" value={c.health} max={160} />
                <Stat label="Vitesse" value={c.speed} max={6.6} />
                <Stat label="Dégâts" value={c.damage} max={1.1} />
                <Stat label="Défense" value={c.defense} max={1.25} />
                <Stat label="Critique" value={c.crit} max={0.22} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {state.mode !== GAME_MODES.TRAINING && (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
          <h3 className="font-display text-sm text-gray-300 mb-3 text-center">DIFFICULTÉ</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(DIFFICULTIES).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  audio.sfx('ui');
                  dispatch({ type: 'SET_DIFFICULTY', payload: d.id });
                }}
                className={`rounded-lg py-2 font-semibold border transition-colors ${
                  state.difficulty === d.id
                    ? d.id === 'HARD'
                      ? 'bg-red-500/30 border-red-400 text-red-200'
                      : d.id === 'EASY'
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                        : 'bg-cyan-500/30 border-cyan-400 text-cyan-100'
                    : 'border-white/15 text-gray-400 hover:text-white'
                }`}
                aria-pressed={state.difficulty === d.id}
              >
                {d.name}
                <span className="block text-[11px] font-normal opacity-80">Score ×{d.score}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}
