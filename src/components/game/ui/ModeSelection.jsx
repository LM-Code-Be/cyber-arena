import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { GAME_MODES, GAME_PHASES } from '@/game/constants';
import { audio } from '@/game/audio';
import { Swords, Infinity as InfinityIcon, Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen } from './Screen';

const MODES = [
  {
    id: GAME_MODES.CAMPAIGN,
    title: 'Campagne',
    icon: Swords,
    color: 'cyan',
    desc: 'Traversez 5 zones de la mégapole et détruisez le boss final Titan-X.',
    points: ['5 niveaux, difficulté croissante', 'Boss final en 3 phases', 'Boutique entre chaque niveau'],
  },
  {
    id: GAME_MODES.SURVIVAL,
    title: 'Survie',
    icon: InfinityIcon,
    color: 'magenta',
    desc: "Des vagues infinies d'ennemis. Jusqu'où tiendrez-vous ?",
    points: ['Vagues de plus en plus fortes', 'Un boss toutes les 5 vagues', '+15 % PV entre les vagues'],
  },
  {
    id: GAME_MODES.TRAINING,
    title: 'Entraînement',
    icon: Target,
    color: 'emerald',
    desc: 'Apprenez les commandes sans risque, contre des ennemis affaiblis.',
    points: ['Vous ne pouvez pas mourir', 'Ennemis infinis', 'Aucun score enregistré'],
  },
];

const COLORS = {
  cyan: 'border-cyan-400 from-cyan-500/20 text-cyan-300 hover:shadow-cyan-500/30',
  magenta: 'border-magenta-400 from-magenta-500/20 text-magenta-300 hover:shadow-magenta-500/30',
  emerald: 'border-emerald-400 from-emerald-500/20 text-emerald-300 hover:shadow-emerald-500/30',
};

export default function ModeSelection() {
  const { dispatch } = useGame();

  const select = (mode) => {
    audio.sfx('ui');
    dispatch({ type: 'SELECT_MODE', payload: mode });
  };

  return (
    <Screen
      title="CHOISIR UN MODE"
      wide
      footer={
        <Button onClick={() => dispatch({ type: 'SET_PHASE', payload: GAME_PHASES.MENU })} className="bg-gray-700 hover:bg-gray-600 text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
      }
    >
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {MODES.map((m) => (
          <motion.button
            key={m.id}
            type="button"
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => select(m.id)}
            className={`text-left rounded-xl border-2 bg-gradient-to-br to-black/40 p-5 sm:p-6 backdrop-blur-sm transition-shadow hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${COLORS[m.color]}`}
          >
            <m.icon className="w-12 h-12 mb-3" />
            <h2 className="font-display text-2xl font-bold mb-2">{m.title}</h2>
            <p className="text-white/90 mb-4">{m.desc}</p>
            <ul className="text-sm space-y-1 opacity-90">
              {m.points.map((p) => (
                <li key={p}>✓ {p}</li>
              ))}
            </ul>
          </motion.button>
        ))}
      </div>
    </Screen>
  );
}
