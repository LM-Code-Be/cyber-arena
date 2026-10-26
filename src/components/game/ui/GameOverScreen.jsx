import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_MODES, GAME_PHASES } from '@/game/constants';
import { RotateCcw, Home, Trophy, Coins, Skull, Flame, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Overlay, StatRow, formatNumber } from './Screen';

export function RunSummary({ stats, mode }) {
  return (
    <div className="bg-black/50 rounded-xl p-4 sm:p-5 space-y-3">
      <StatRow icon={Trophy} label="Score final" value={formatNumber(stats.score)} />
      {mode !== GAME_MODES.TRAINING && <StatRow icon={Coins} label="Crédits gagnés" value={`+${stats.coins}`} />}
      <StatRow icon={Skull} label="Ennemis éliminés" value={stats.kills} color="text-red-400" />
      <StatRow icon={Flame} label="Meilleur combo" value={`${stats.maxCombo}x`} color="text-orange-400" />
      {mode === GAME_MODES.CAMPAIGN && <StatRow label="Niveau atteint" value={`${stats.level} / 5`} color="text-cyan-300" />}
      {mode === GAME_MODES.SURVIVAL && <StatRow label="Vague atteinte" value={stats.wave} color="text-cyan-300" />}
    </div>
  );
}

export default function GameOverScreen() {
  const { state, dispatch } = useGame();
  const result = state.lastResult;
  if (!result) return null;

  return (
    <Overlay tone="red">
      <h2 className="font-display text-4xl sm:text-5xl font-black text-center text-red-500 mb-1">GAME OVER</h2>
      <p className="text-center text-red-200/70 mb-5">Vous avez été mis K.O.</p>

      {result.isRecord && result.stats.score > 0 && (
        <div className="mb-4 rounded-lg border border-yellow-400 bg-yellow-500/15 p-2 text-center font-display font-bold text-yellow-300 animate-pulse">
          🏆 NOUVEAU RECORD !
        </div>
      )}

      <RunSummary stats={result.stats} mode={state.mode} />

      <div className="grid gap-3 mt-5">
        <Button onClick={() => dispatch({ type: 'START_RUN' })} autoFocus className="h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border-2 border-emerald-400">
          <RotateCcw className="w-5 h-5 mr-2" /> Réessayer
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => dispatch({ type: 'OPEN', payload: { phase: GAME_PHASES.SHOP, returnTo: GAME_PHASES.MENU } })} className="h-12 bg-yellow-500/15 border border-yellow-400 text-yellow-200 hover:bg-yellow-500/25">
            Boutique
          </Button>
          <Button onClick={() => dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.CHARACTER_SELECT })} className="h-12 bg-purple-600/30 border border-purple-400 hover:bg-purple-600/50 text-white">
            <Users className="w-4 h-4 mr-2" /> Personnage
          </Button>
        </div>
        <Button onClick={() => dispatch({ type: 'QUIT_RUN' })} className="h-12 bg-gray-700 hover:bg-gray-600 text-white border border-gray-500">
          <Home className="w-5 h-5 mr-2" /> Menu principal
        </Button>
      </div>
    </Overlay>
  );
}
