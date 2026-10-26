import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_MODES, MODE_LABELS, CHARACTERS, DIFFICULTIES } from '@/game/constants';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen, formatNumber } from './Screen';

const TABS = [GAME_MODES.CAMPAIGN, GAME_MODES.SURVIVAL];

export default function LeaderboardScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState(GAME_MODES.CAMPAIGN);
  const scores = state.profile.bestScores.filter((s) => s.mode === tab).slice(0, 10);

  return (
    <Screen
      title="CLASSEMENT"
      subtitle="Vos 10 meilleures parties sur cet appareil"
      footer={
        <Button onClick={() => dispatch({ type: 'BACK' })} className="h-12 px-8 bg-gray-700 hover:bg-gray-600 text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
      }
    >
      <div className="flex justify-center gap-2 mb-4" role="tablist">
        {TABS.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={tab === m}
            onClick={() => setTab(m)}
            className={`px-5 py-2 rounded-lg font-display text-sm font-bold border transition-colors ${
              tab === m ? 'bg-purple-500/30 border-purple-300 text-white' : 'border-white/15 text-gray-400 hover:text-white'
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="bg-black/50 border-2 border-purple-400/60 rounded-xl overflow-hidden">
        {scores.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            Aucune partie enregistrée pour ce mode. À vous de jouer !
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:text-base">
              <thead className="bg-purple-500/15 text-purple-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Joueur</th>
                  <th className="px-3 py-2 text-right">Score</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Combattant</th>
                  <th className="px-3 py-2">{tab === GAME_MODES.CAMPAIGN ? 'Niveau' : 'Vague'}</th>
                  <th className="px-3 py-2 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={s.id} className="border-t border-white/5 odd:bg-white/[0.02]">
                    <td className="px-3 py-2 font-num font-bold text-gray-300">
                      {i === 0 ? <Crown className="w-5 h-5 text-yellow-400" /> : i + 1}
                    </td>
                    <td className="px-3 py-2 font-semibold text-white truncate max-w-[8rem]">{s.name}</td>
                    <td className="px-3 py-2 text-right font-num font-bold text-yellow-300">{formatNumber(s.score)}</td>
                    <td className="px-3 py-2 hidden sm:table-cell text-gray-300">
                      {CHARACTERS[s.character]?.name ?? '—'}
                      <span className="text-gray-500 text-xs"> · {DIFFICULTIES[s.difficulty]?.name ?? ''}</span>
                    </td>
                    <td className="px-3 py-2 text-cyan-300">
                      {s.victory ? '🏆 Victoire' : s.reached}
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-gray-500 text-sm">{new Date(s.date).toLocaleDateString('fr-BE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Screen>
  );
}
