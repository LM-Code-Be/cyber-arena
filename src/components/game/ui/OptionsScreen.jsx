import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_PHASES } from '@/game/constants';
import { audio } from '@/game/audio';
import { ArrowLeft, Volume2, VolumeX, Music, Zap, User, Lightbulb, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { Screen } from './Screen';

const Row = ({ icon: Icon, label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <span className="flex items-center gap-2 font-semibold text-lg text-white">
      <Icon className="w-5 h-5 text-purple-300" /> {label}
    </span>
    <div className="sm:w-64">{children}</div>
  </div>
);

export default function OptionsScreen() {
  const { state, dispatch } = useGame();
  const settings = state.profile.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  const inRun = state.returnTo === GAME_PHASES.PAUSED;

  const update = (payload) => dispatch({ type: 'UPDATE_SETTINGS', payload });

  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    dispatch({ type: 'RESET_PROGRESS' });
    toast({ title: 'Progression réinitialisée', description: 'Crédits, améliorations, scores et statistiques ont été effacés.' });
  };

  return (
    <Screen
      title="OPTIONS"
      footer={
        <Button onClick={() => dispatch({ type: 'BACK' })} className="h-12 px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
      }
    >
      <div className="bg-black/50 border-2 border-purple-400/70 rounded-xl p-5 sm:p-8 space-y-6">
        <Row icon={User} label="Pseudo">
          <input
            type="text"
            value={settings.playerName}
            maxLength={16}
            onChange={(e) => update({ playerName: e.target.value })}
            onBlur={(e) => !e.target.value.trim() && update({ playerName: 'Joueur' })}
            className="w-full rounded-md bg-black/60 border border-purple-400/50 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="Pseudo affiché dans le classement"
          />
        </Row>

        <Row icon={settings.audioEnabled ? Volume2 : VolumeX} label="Son">
          <Button
            onClick={() => {
              update({ audioEnabled: !settings.audioEnabled });
              audio.unlock();
            }}
            className={`w-full font-bold ${settings.audioEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'} text-white`}
          >
            {settings.audioEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
          </Button>
        </Row>

        <Row icon={Music} label={`Musique · ${settings.musicVolume} %`}>
          <Slider value={[settings.musicVolume]} onValueChange={([v]) => update({ musicVolume: v })} max={100} step={5} disabled={!settings.audioEnabled} aria-label="Volume de la musique" />
        </Row>

        <Row icon={Zap} label={`Effets · ${settings.sfxVolume} %`}>
          <Slider
            value={[settings.sfxVolume]}
            onValueChange={([v]) => update({ sfxVolume: v })}
            onValueCommit={() => audio.sfx('hit')}
            max={100}
            step={5}
            disabled={!settings.audioEnabled}
            aria-label="Volume des effets sonores"
          />
        </Row>

        <Row icon={Lightbulb} label="Aide aux commandes en jeu">
          <Button
            onClick={() => update({ showHints: !settings.showHints })}
            className={`w-full font-bold ${settings.showHints ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-gray-600 hover:bg-gray-500'} text-white`}
          >
            {settings.showHints ? 'AFFICHÉE' : 'MASQUÉE'}
          </Button>
        </Row>

        {!inRun && (
          <div className="pt-6 border-t border-purple-400/30">
            <Row icon={Trash2} label="Réinitialiser la progression">
              <Button onClick={reset} onBlur={() => setConfirmReset(false)} className="w-full bg-red-900/60 border border-red-500 text-red-200 hover:bg-red-800">
                {confirmReset ? 'Cliquez encore pour confirmer' : 'Tout effacer'}
              </Button>
            </Row>
          </div>
        )}
      </div>
    </Screen>
  );
}
