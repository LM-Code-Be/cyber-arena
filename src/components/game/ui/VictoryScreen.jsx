import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { GAME_PHASES, DIFFICULTIES } from '@/game/constants';
import { Home, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Overlay } from './Screen';
import { RunSummary } from './GameOverScreen';

export default function VictoryScreen() {
  const { state, dispatch } = useGame();
  const result = state.lastResult;
  if (!result) return null;

  return (
    <Overlay tone="gold">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute top-4 right-4"
      >
        <Sparkles className="w-7 h-7 text-yellow-300" />
      </motion.div>

      <h2 className="font-display text-4xl sm:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 mb-1">
        VICTOIRE !
      </h2>
      <p className="text-center text-cyan-200 font-semibold mb-5">
        Titan-X est détruit · Campagne terminée en {DIFFICULTIES[state.difficulty]?.name}
      </p>

      {result.isRecord && (
        <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-500/15 p-2 text-center font-display font-bold text-yellow-300 animate-pulse">
          🏆 NOUVEAU RECORD !
        </div>
      )}

      <RunSummary stats={result.stats} mode={state.mode} />

      <div className="grid gap-3 mt-5">
        <Button onClick={() => dispatch({ type: 'START_RUN' })} className="h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-2 border-cyan-300">
          <RotateCcw className="w-5 h-5 mr-2" /> Rejouer la campagne
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => dispatch({ type: 'OPEN', payload: { phase: GAME_PHASES.LEADERBOARD, returnTo: GAME_PHASES.MENU } })} className="h-12 bg-purple-600/30 border border-purple-400 hover:bg-purple-600/50 text-white">
            <Trophy className="w-4 h-4 mr-2" /> Classement
          </Button>
          <Button onClick={() => dispatch({ type: 'QUIT_RUN' })} autoFocus className="h-12 bg-gray-700 hover:bg-gray-600 text-white border border-gray-500">
            <Home className="w-4 h-4 mr-2" /> Menu
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
