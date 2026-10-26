import React, { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_PHASES, GAME_MODES } from '@/game/constants';
import { Play, Home, Settings, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Overlay } from './Screen';

export default function PauseMenu() {
  const { state, dispatch } = useGame();
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if ((k === 'p' || k === 'escape') && !e.repeat) {
        e.preventDefault();
        dispatch({ type: 'RESUME' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  const open = (phase) => dispatch({ type: 'OPEN', payload: { phase, returnTo: GAME_PHASES.PAUSED } });

  return (
    <Overlay tone="purple">
      <h2 className="font-display text-4xl sm:text-5xl font-black text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-magenta-400">PAUSE</h2>
      <div className="space-y-3">
        <Button onClick={() => dispatch({ type: 'RESUME' })} autoFocus className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border-2 border-emerald-400">
          <Play className="w-5 h-5 mr-2" /> Reprendre
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => open(GAME_PHASES.OPTIONS)} className="h-12 bg-purple-600/40 border border-purple-400 hover:bg-purple-600/60 text-white">
            <Settings className="w-5 h-5 mr-2" /> Options
          </Button>
          <Button onClick={() => open(GAME_PHASES.INSTRUCTIONS)} className="h-12 bg-sky-600/30 border border-sky-400 hover:bg-sky-600/50 text-white">
            <Book className="w-5 h-5 mr-2" /> Aide
          </Button>
        </div>
        <Button
          onClick={() => (confirmQuit ? dispatch({ type: 'QUIT_RUN' }) : setConfirmQuit(true))}
          className="w-full h-12 bg-red-600/30 border border-red-400 hover:bg-red-600/50 text-white"
        >
          <Home className="w-5 h-5 mr-2" /> {confirmQuit ? 'Confirmer l’abandon' : 'Abandonner la partie'}
        </Button>
        {confirmQuit && state.mode !== GAME_MODES.TRAINING && (
          <p className="text-center text-sm text-red-300">Les crédits gagnés dans le niveau en cours seront perdus.</p>
        )}
      </div>
      <p className="mt-5 text-center text-xs text-gray-400">Appuyez sur P ou Échap pour reprendre</p>
    </Overlay>
  );
}
