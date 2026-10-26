import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { GAME_PHASES } from '@/game/constants';
import { audio } from '@/game/audio';
import { Play, Settings, Trophy, Book, BarChart3, ShoppingBag, Home, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LmCodeCredit from '@/components/brand/LmCodeCredit';
import { formatNumber } from './Screen';

export default function MainMenu() {
  const { state, dispatch } = useGame();

  const go = (phase) => {
    audio.sfx('ui');
    dispatch({ type: 'OPEN', payload: { phase, returnTo: GAME_PHASES.MENU } });
  };

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto cyber-grid bg-[radial-gradient(circle_at_50%_35%,#3b0a63_0%,#0d0220_55%,#000_100%)]">
      <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center w-full max-w-md space-y-6 sm:space-y-8"
        >
          <div>
            <h1 className="font-display text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-magenta-500 leading-tight">
              CYBER ARENA
            </h1>
            <p className="font-display text-cyan-200 tracking-[0.4em] text-xs sm:text-sm mt-1">ULTIMATE FIGHTER</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/40 px-4 py-1.5 text-yellow-300">
            <Coins className="w-4 h-4" />
            <span className="font-num font-bold">{formatNumber(state.profile.wallet)}</span>
            <span className="text-yellow-200/70 text-sm">crédits</span>
          </div>

          <div className="grid gap-3">
            <Button
              onClick={() => go(GAME_PHASES.MODE_SELECTION)}
              className="h-14 font-display text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30"
              autoFocus
            >
              <Play className="mr-2 h-5 w-5" /> JOUER
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => go(GAME_PHASES.SHOP)} className="h-12 bg-yellow-500/10 border border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/20">
                <ShoppingBag className="mr-2 h-5 w-5" /> Boutique
              </Button>
              <Button onClick={() => go(GAME_PHASES.LEADERBOARD)} className="h-12 bg-purple-500/10 border border-purple-500/60 text-purple-300 hover:bg-purple-500/20">
                <Trophy className="mr-2 h-5 w-5" /> Classement
              </Button>
              <Button onClick={() => go(GAME_PHASES.STATS)} className="h-12 bg-emerald-500/10 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/20">
                <BarChart3 className="mr-2 h-5 w-5" /> Statistiques
              </Button>
              <Button onClick={() => go(GAME_PHASES.INSTRUCTIONS)} className="h-12 bg-sky-500/10 border border-sky-500/60 text-sky-300 hover:bg-sky-500/20">
                <Book className="mr-2 h-5 w-5" /> Aide
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => go(GAME_PHASES.OPTIONS)} className="text-gray-300 hover:text-white hover:bg-white/10">
                <Settings className="mr-2 h-4 w-4" /> Options
              </Button>
              <Button variant="ghost" asChild className="text-gray-300 hover:text-white hover:bg-white/10">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" /> Accueil
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center gap-2">
            <LmCodeCredit />
            <span className="text-[11px] text-gray-600">v2.1.0</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
