import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { ArrowLeft, Gamepad2, Trophy, Skull, Coins, Clock, Flame, Waves, Bot, Swords, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen, formatNumber, formatTime } from './Screen';

export default function StatsScreen() {
  const { state, dispatch } = useGame();
  const s = state.profile.stats;

  const items = [
    { icon: Gamepad2, label: 'Parties jouées', value: formatNumber(s.gamesPlayed), color: 'text-cyan-300' },
    { icon: Trophy, label: 'Campagnes gagnées', value: formatNumber(s.victories), color: 'text-yellow-300' },
    { icon: Flag, label: 'Niveaux terminés', value: formatNumber(s.levelsCleared), color: 'text-sky-300' },
    { icon: Skull, label: 'Ennemis éliminés', value: formatNumber(s.totalKills), color: 'text-red-400' },
    { icon: Bot, label: 'Titans détruits', value: formatNumber(s.bossKills), color: 'text-orange-400' },
    { icon: Swords, label: 'Dégâts infligés', value: formatNumber(s.damageDealt), color: 'text-magenta-300' },
    { icon: Flame, label: 'Meilleur combo', value: `${s.bestCombo}x`, color: 'text-orange-300' },
    { icon: Waves, label: 'Meilleure vague (survie)', value: s.bestWave, color: 'text-purple-300' },
    { icon: Coins, label: 'Crédits gagnés', value: formatNumber(s.totalCoins), color: 'text-yellow-300' },
    { icon: Clock, label: 'Temps de combat', value: formatTime(s.playTime), color: 'text-emerald-300' },
  ];

  return (
    <Screen
      title="STATISTIQUES"
      wide
      footer={
        <Button onClick={() => dispatch({ type: 'BACK' })} className="h-12 px-8 bg-gray-700 hover:bg-gray-600 text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-black/50 p-4 text-center">
            <Icon className={`w-7 h-7 mx-auto mb-2 ${color}`} />
            <div className={`font-num text-xl sm:text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
