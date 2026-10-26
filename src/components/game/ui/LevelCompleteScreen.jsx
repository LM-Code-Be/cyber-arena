import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { CAMPAIGN_LEVELS, GAME_PHASES } from '@/game/constants';
import { ArrowRight, Trophy, Coins, Skull, Timer, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Overlay, StatRow, formatNumber, formatTime } from './Screen';

export default function LevelCompleteScreen() {
  const { state, dispatch } = useGame();
  const gain = state.levelGain || { coins: 0, kills: 0, score: 0, time: 0 };
  const next = CAMPAIGN_LEVELS[state.level];
  const bossNext = next?.boss;

  return (
    <Overlay tone="cyan">
      <h2 className="font-display text-3xl sm:text-4xl font-black text-center text-cyan-300 text-glow-cyan">NIVEAU TERMINÉ</h2>
      <p className="text-center text-cyan-100/80 mt-1 mb-5">
        {state.level} · {CAMPAIGN_LEVELS[state.level - 1]?.name}
      </p>

      <div className="bg-black/50 rounded-xl p-4 sm:p-5 space-y-3 mb-5">
        <StatRow icon={Trophy} label="Score total" value={formatNumber(state.run?.score)} />
        <StatRow icon={Coins} label="Crédits gagnés" value={`+${gain.coins}`} />
        <StatRow icon={Skull} label="Ennemis éliminés" value={gain.kills} color="text-red-400" />
        <StatRow icon={Timer} label="Temps" value={formatTime(gain.time)} color="text-cyan-300" />
        <div className="pt-3 border-t border-white/15 flex justify-between text-sm text-gray-300">
          <span>Solde</span>
          <span className="font-bold text-yellow-300">{formatNumber(state.profile.wallet)} ¢</span>
        </div>
      </div>

      {next && (
        <div className={`rounded-lg p-3 text-center mb-5 border ${bossNext ? 'border-red-400 bg-red-500/15 text-red-300' : 'border-magenta-400/50 bg-magenta-500/10 text-magenta-300'}`}>
          <p className="font-display text-sm font-bold">
            {bossNext ? '⚠ BOSS FINAL : TITAN-X ⚠' : `Prochain : ${next.name}`}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        <Button
          onClick={() => dispatch({ type: 'OPEN', payload: { phase: GAME_PHASES.SHOP, returnTo: GAME_PHASES.LEVEL_COMPLETE } })}
          className="h-12 text-lg bg-yellow-500/15 border-2 border-yellow-400 text-yellow-200 hover:bg-yellow-500/25"
        >
          <ShoppingBag className="w-5 h-5 mr-2" /> Boutique
        </Button>
        <Button onClick={() => dispatch({ type: 'NEXT_LEVEL' })} autoFocus className="h-14 text-xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-2 border-cyan-300">
          Niveau suivant <ArrowRight className="w-6 h-6 ml-2" />
        </Button>
      </div>
    </Overlay>
  );
}
