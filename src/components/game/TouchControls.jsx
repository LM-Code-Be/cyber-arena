import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, Shield, FlaskConical, Wind } from 'lucide-react';

const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);

function Pad({ action, engineRef, className = '', children, label }) {
  const [active, setActive] = useState(false);

  const press = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setActive(true);
    engineRef.current?.setInput(action, true);
  };
  const release = (e) => {
    e.preventDefault();
    setActive(false);
    engineRef.current?.setInput(action, false);
  };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto touch-none select-none flex items-center justify-center rounded-full border-2 backdrop-blur-sm font-display font-bold transition-transform ${
        active ? 'scale-90 bg-white/30' : 'bg-black/35'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export default function TouchControls({ engineRef }) {
  const [enabled] = useState(isTouchDevice);

  // Relâche toutes les commandes maintenues si le composant disparaît (pause, fin de niveau...).
  useEffect(() => {
    const engine = engineRef.current;
    return () => engine?.clearInput();
  }, [engineRef]);

  if (!enabled) return null;

  const size = 'w-12 h-12 lg:w-16 lg:h-16';
  return (
    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 flex items-end justify-between pointer-events-none">
      <div className="flex items-end gap-2">
        <Pad action="left" label="Gauche" engineRef={engineRef} className={`${size} border-cyan-400/70 text-cyan-200`}>
          <ChevronLeft className="w-7 h-7" />
        </Pad>
        <div className="flex flex-col gap-2">
          <Pad action="jump" label="Sauter" engineRef={engineRef} className={`${size} border-cyan-400/70 text-cyan-200`}>
            <ChevronUp className="w-7 h-7" />
          </Pad>
          <Pad action="block" label="Garde" engineRef={engineRef} className={`${size} border-sky-400/70 text-sky-200`}>
            <Shield className="w-6 h-6" />
          </Pad>
        </div>
        <Pad action="right" label="Droite" engineRef={engineRef} className={`${size} border-cyan-400/70 text-cyan-200`}>
          <ChevronRight className="w-7 h-7" />
        </Pad>
      </div>

      <div className="grid grid-cols-3 gap-2 items-end">
        <Pad action="potion" label="Soin" engineRef={engineRef} className="w-10 h-10 lg:w-12 lg:h-12 border-emerald-400/70 text-emerald-200 col-start-1">
          <FlaskConical className="w-5 h-5" />
        </Pad>
        <Pad action="dash" label="Esquive" engineRef={engineRef} className="w-10 h-10 lg:w-12 lg:h-12 border-white/50 text-white">
          <Wind className="w-5 h-5" />
        </Pad>
        <Pad action="special" label="Onde plasma" engineRef={engineRef} className={`${size} border-magenta-400/80 text-magenta-300 text-lg`}>
          D
        </Pad>
        <Pad action="light" label="Coup rapide" engineRef={engineRef} className={`${size} border-yellow-400/80 text-yellow-200 text-lg col-start-2`}>
          A
        </Pad>
        <Pad action="heavy" label="Coup lourd" engineRef={engineRef} className={`${size} border-orange-400/80 text-orange-200 text-lg`}>
          S
        </Pad>
      </div>
    </div>
  );
}
