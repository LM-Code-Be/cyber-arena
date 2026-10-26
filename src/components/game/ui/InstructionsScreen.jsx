import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { CONTROLS, ENEMY_TYPES } from '@/game/constants';
import { ArrowLeft, Keyboard, Smartphone, Target, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Screen } from './Screen';

const ENEMY_TIPS = {
  Grunt: 'Soldat de base. Lent mais tenace.',
  Assassin: 'Très rapide, se jette sur vous. Gardez vos distances ou bloquez.',
  Berserker: 'Insensible aux coups rapides : utilisez coups lourds et onde plasma.',
  Archer: 'Tire des flèches à distance. Sautez ou bloquez-les.',
  Mage: 'Lance des orbes visant votre position. Bougez !',
};

export default function InstructionsScreen() {
  const { dispatch } = useGame();

  return (
    <Screen
      title="AIDE"
      wide
      footer={
        <Button onClick={() => dispatch({ type: 'BACK' })} className="h-12 px-8 bg-gradient-to-r from-cyan-600 to-magenta-600 hover:from-cyan-500 hover:to-magenta-500 text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </Button>
      }
    >
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <section className="bg-black/50 border-2 border-cyan-400/70 rounded-xl p-5">
          <h2 className="font-display text-xl font-bold text-cyan-300 flex items-center gap-2 mb-3">
            <Keyboard className="w-6 h-6" /> Clavier
          </h2>
          <ul className="space-y-1.5">
            {CONTROLS.map((c) => (
              <li key={c.keys} className="flex justify-between gap-3 bg-cyan-500/10 px-3 py-2 rounded">
                <kbd className="font-display font-bold text-cyan-100 text-sm">{c.keys}</kbd>
                <span className="text-right">{c.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4 sm:space-y-6">
          <section className="bg-black/50 border-2 border-magenta-400/70 rounded-xl p-5">
            <h2 className="font-display text-xl font-bold text-magenta-300 flex items-center gap-2 mb-3">
              <Smartphone className="w-6 h-6" /> Mobile / tablette
            </h2>
            <ul className="space-y-1 text-sm text-gray-200">
              <li>• Jouez en mode paysage.</li>
              <li>• À gauche : flèches de déplacement, saut et garde (bouclier).</li>
              <li>• À droite : A (rapide), S (lourd), D (onde plasma), esquive et soin.</li>
              <li>• Bouton pause en haut à droite.</li>
            </ul>
          </section>

          <section className="bg-black/50 border-2 border-yellow-400/70 rounded-xl p-5">
            <h2 className="font-display text-xl font-bold text-yellow-300 flex items-center gap-2 mb-3">
              <Target className="w-6 h-6" /> Conseils
            </h2>
            <ul className="space-y-1 text-sm text-gray-200">
              <li>• Enchaînez les coups pour monter le combo : il multiplie le score (jusqu'à ×2).</li>
              <li>• Être touché remet le combo à zéro.</li>
              <li>• La garde bloque les attaques de face mais consomme de la stamina.</li>
              <li>• L'esquive rend invincible un court instant (traverse même les ondes du boss).</li>
              <li>• Un « ! » au-dessus d'un ennemi annonce son attaque.</li>
              <li>• Dépensez vos crédits en boutique pour des améliorations permanentes.</li>
            </ul>
          </section>
        </div>
      </div>

      <section className="mt-4 sm:mt-6 bg-black/50 border-2 border-red-400/60 rounded-xl p-5">
        <h2 className="font-display text-xl font-bold text-red-300 flex items-center gap-2 mb-3">
          <Skull className="w-6 h-6" /> Ennemis
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {Object.values(ENEMY_TYPES).map((e) => (
            <div key={e.name} className="flex gap-3 items-start">
              <span className="mt-1 w-3 h-3 rounded-sm shrink-0" style={{ background: e.color }} />
              <span>
                <strong style={{ color: e.color }}>{e.name}</strong> — {ENEMY_TIPS[e.name]}
              </span>
            </div>
          ))}
          <div className="flex gap-3 items-start">
            <span className="mt-1 w-3 h-3 rounded-sm shrink-0 bg-orange-500" />
            <span>
              <strong className="text-orange-400">Titan-X</strong> — Charge (traversez-la avec l'esquive), onde de choc (sautez !), tirs laser (bloquez) et renforts en phase 3.
            </span>
          </div>
        </div>
      </section>
    </Screen>
  );
}
