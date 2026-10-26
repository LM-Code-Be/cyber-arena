import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_PHASES, UPGRADES, upgradeCost, POTION_COST, MAX_POTIONS, POTION_HEAL } from '@/game/constants';
import { audio } from '@/game/audio';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Shield, Sword, Zap, Heart, FlaskConical, Coins, ShoppingBag } from 'lucide-react';
import { Screen, formatNumber } from './Screen';

const ICONS = { damage: Sword, maxHealth: Heart, maxStamina: Zap, defense: Shield };

function ItemCard({ icon: Icon, name, desc, level, max, cost, canBuy, onBuy, maxed }) {
  return (
    <div className="flex flex-col rounded-xl border-2 border-white/10 bg-gray-950/70 p-4 hover:border-cyan-400/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-9 h-9 text-cyan-300" />
        {max !== undefined && (
          <div className="flex gap-1" aria-label={`Niveau ${level} sur ${max}`}>
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={`w-3 h-3 rounded-sm ${i < level ? 'bg-cyan-400 shadow shadow-cyan-400' : 'bg-white/15'}`} />
            ))}
          </div>
        )}
      </div>
      <h3 className="font-display text-lg font-bold text-white">{name}</h3>
      <p className="text-sm text-gray-400 mb-4 flex-1">{desc}</p>
      <Button
        onClick={onBuy}
        disabled={!canBuy}
        className={`w-full font-bold ${maxed ? 'bg-emerald-700/40 text-emerald-200' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`}
      >
        {maxed ? 'MAXIMUM' : (
          <>
            <Coins className="w-4 h-4 mr-1.5" /> {cost} ¢
          </>
        )}
      </Button>
    </div>
  );
}

export default function ShopScreen() {
  const { state, dispatch } = useGame();
  const { wallet, upgrades, potions } = state.profile;
  const betweenLevels = state.returnTo === GAME_PHASES.LEVEL_COMPLETE;

  const buyUpgrade = (id) => {
    dispatch({ type: 'BUY_UPGRADE', payload: id });
    audio.sfx('buy');
    toast({ title: `${UPGRADES[id].name} amélioré`, description: `Niveau ${upgrades[id] + 1} / ${UPGRADES[id].max}`, duration: 2000 });
  };

  const buyPotion = () => {
    dispatch({ type: 'BUY_POTION' });
    audio.sfx('buy');
    toast({ title: 'Soin acheté', description: `${potions + 1} / ${MAX_POTIONS} en réserve`, duration: 2000 });
  };

  return (
    <Screen
      title="CYBER MARCHÉ"
      subtitle="Améliorations permanentes pour tous vos combattants"
      wide
      footer={
        <>
          <Button onClick={() => dispatch({ type: 'BACK' })} className="h-12 px-6 bg-gray-700 hover:bg-gray-600 text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </Button>
          {betweenLevels && (
            <Button onClick={() => dispatch({ type: 'NEXT_LEVEL' })} className="h-12 px-8 font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white">
              Niveau suivant <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </>
      }
    >
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-3 rounded-full border-2 border-yellow-400/60 bg-black/50 px-6 py-2">
          <ShoppingBag className="w-5 h-5 text-yellow-300" />
          <span className="font-num text-2xl font-bold text-yellow-300">{formatNumber(wallet)}</span>
          <span className="text-yellow-200/70">crédits</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.values(UPGRADES).map((u) => {
          const level = upgrades[u.id];
          const maxed = level >= u.max;
          const cost = upgradeCost(u.id, level);
          return (
            <ItemCard
              key={u.id}
              icon={ICONS[u.id]}
              name={u.name}
              desc={u.desc}
              level={level}
              max={u.max}
              cost={cost}
              maxed={maxed}
              canBuy={!maxed && wallet >= cost}
              onBuy={() => buyUpgrade(u.id)}
            />
          );
        })}
        <ItemCard
          icon={FlaskConical}
          name="Soin d'urgence"
          desc={`Restaure ${POTION_HEAL * 100} % des PV en combat (touche R). En réserve : ${potions} / ${MAX_POTIONS}`}
          cost={POTION_COST}
          maxed={potions >= MAX_POTIONS}
          canBuy={potions < MAX_POTIONS && wallet >= POTION_COST}
          onBuy={buyPotion}
        />
      </div>
    </Screen>
  );
}
