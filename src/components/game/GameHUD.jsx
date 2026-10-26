import React, { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GAME_MODES, CONTROLS, CAMPAIGN_LEVELS } from '@/game/constants';
import { Heart, Zap, Coins, FlaskConical, Pause, X } from 'lucide-react';
import { formatNumber } from './ui/Screen';

const Bar = ({ pct, className, children, barClass }) => (
  <div className={`relative overflow-hidden rounded-md border border-white/20 bg-gray-950/80 ${className}`}>
    <div className={`absolute inset-y-0 left-0 transition-[width] duration-150 ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    <div className="relative h-full flex items-center px-2 gap-1 font-bold drop-shadow">{children}</div>
  </div>
);

export default function GameHUD({ engineRef }) {
  const { state, dispatch } = useGame();
  const [hud, setHud] = useState(() => engineRef.current?.getHud() ?? null);
  const [showHints, setShowHints] = useState(
    state.profile.settings.showHints && (state.mode === GAME_MODES.TRAINING || (state.mode === GAME_MODES.CAMPAIGN && state.level === 1)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (engineRef.current) setHud(engineRef.current.getHud());
    }, 80);
    return () => clearInterval(id);
  }, [engineRef]);

  useEffect(() => {
    if (!showHints) return;
    const t = setTimeout(() => setShowHints(false), 12000);
    return () => clearTimeout(t);
  }, [showHints]);

  if (!hud) return null;

  const stageLabel =
    state.mode === GAME_MODES.CAMPAIGN
      ? `NIVEAU ${state.level} · ${CAMPAIGN_LEVELS[state.level - 1]?.name ?? ''}`
      : state.mode === GAME_MODES.SURVIVAL
        ? `VAGUE ${hud.wave}`
        : 'ENTRAÎNEMENT';

  return (
    <div className="absolute inset-0 pointer-events-none select-none text-white p-2 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        {/* Joueur */}
        <div className="flex flex-col gap-1 sm:gap-1.5 w-[34%] max-w-[300px]">
          <Bar pct={(hud.hp / hud.maxHp) * 100} className="h-5 sm:h-7 text-[10px] sm:text-sm" barClass={hud.hp / hud.maxHp < 0.3 ? 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse' : 'bg-gradient-to-r from-red-600 to-rose-400'}>
            <Heart className="w-3 h-3 sm:w-4 sm:h-4" /> {hud.hp} / {hud.maxHp}
          </Bar>
          <Bar pct={(hud.stamina / hud.maxStamina) * 100} className="h-3 sm:h-4 w-[85%] text-[8px] sm:text-[10px] text-black/80" barClass={hud.guardBroken ? 'bg-gray-500' : 'bg-gradient-to-r from-yellow-500 to-amber-300'}>
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> STAMINA
          </Bar>
          <div className="flex items-center gap-1 text-emerald-300 text-[10px] sm:text-xs font-semibold">
            <FlaskConical className="w-3 h-3 sm:w-4 sm:h-4" /> Soins : {hud.potions}
            <span className="hidden sm:inline text-white/40 ml-1">(R)</span>
          </div>
        </div>

        {/* Centre */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="font-num text-xl sm:text-4xl font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {formatNumber(hud.score)}
          </div>
          <div className="mt-0.5 text-[9px] sm:text-xs font-num font-bold tracking-wide text-cyan-300 bg-black/50 px-2 py-0.5 rounded truncate max-w-full">
            {stageLabel}
            {state.mode === GAME_MODES.CAMPAIGN && hud.totalWaves > 1 && hud.wave > 0 && ` · VAGUE ${hud.wave}/${hud.totalWaves}`}
          </div>
          {hud.boss && (
            <div className="mt-2 w-full max-w-[420px]">
              <div className="flex justify-between text-[10px] sm:text-sm font-num font-bold text-red-400 mb-0.5">
                <span className="animate-pulse">{hud.boss.name}</span>
                <span>PHASE {hud.boss.phase}</span>
              </div>
              <div className="h-3 sm:h-5 bg-gray-950/90 border-2 border-red-800 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-700 via-red-500 to-orange-400 transition-[width] duration-150" style={{ width: `${(hud.boss.hp / hud.boss.maxHp) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Droite */}
        <div className="flex flex-col items-end gap-1 sm:gap-2 w-[34%] max-w-[300px]">
          <div className="flex items-center gap-2">
            {state.mode !== GAME_MODES.TRAINING && (
              <div className="flex items-center text-yellow-300 bg-black/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-yellow-500/30">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span className="font-num font-bold text-sm sm:text-lg">{hud.coins}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: 'PAUSE' })}
              className="pointer-events-auto p-1.5 sm:p-2 rounded-lg bg-black/50 border border-white/20 hover:bg-white/10"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          {hud.combo > 1 && (
            <div className="text-right">
              <div className="font-num text-2xl sm:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-red-600 drop-shadow-lg">
                {hud.combo}x
              </div>
              <div className="text-orange-300 text-[10px] sm:text-sm font-bold uppercase tracking-wider">Combo</div>
              <div className="h-1 bg-black/50 rounded mt-0.5 w-16 sm:w-24 ml-auto overflow-hidden">
                <div className="h-full bg-orange-400" style={{ width: `${hud.comboPct * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showHints && (
        <div className="hidden md:block [@media(pointer:coarse)]:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 px-5 py-3 rounded-xl border border-cyan-400/30 pointer-events-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-display text-cyan-300 text-xs font-bold">COMMANDES</span>
            <button type="button" onClick={() => setShowHints(false)} className="text-white/50 hover:text-white" aria-label="Masquer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-0.5 text-xs">
            {CONTROLS.map((c) => (
              <span key={c.keys}>
                <span className="text-cyan-200 font-bold">{c.keys}</span> : {c.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
