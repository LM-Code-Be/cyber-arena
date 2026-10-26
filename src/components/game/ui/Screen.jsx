import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Écran plein (menus) : fond animé, contenu centré et défilable sur petits écrans.
export function Screen({ title, subtitle, children, footer, className, wide = false }) {
  return (
    <div className="absolute inset-0 z-40 overflow-y-auto cyber-grid bg-[radial-gradient(circle_at_50%_30%,#2a0a4a_0%,#0d0220_55%,#000_100%)]">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn('w-full', wide ? 'max-w-5xl' : 'max-w-3xl', className)}
        >
          {title && (
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="font-display text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-magenta-500">
                {title}
              </h1>
              {subtitle && <p className="mt-2 text-cyan-100/70 text-base sm:text-lg">{subtitle}</p>}
            </div>
          )}
          {children}
          {footer && <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

// Fenêtre modale par-dessus la partie (pause, game over...).
export function Overlay({ children, tone = 'purple', className }) {
  const tones = {
    purple: 'border-purple-400 from-purple-950/95 to-black/95',
    red: 'border-red-500 from-red-950/95 to-black/95',
    cyan: 'border-cyan-400 from-cyan-950/95 to-black/95',
    gold: 'border-yellow-400 from-yellow-950/95 via-purple-950/95 to-black/95',
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm"
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className={cn('relative w-full max-w-md rounded-2xl border-2 bg-gradient-to-br p-6 sm:p-8 shadow-2xl', tones[tone], className)}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function StatRow({ icon: Icon, label, value, color = 'text-yellow-400' }) {
  return (
    <div className="flex items-center justify-between gap-4 text-white">
      <span className="flex items-center gap-2 text-base sm:text-lg text-gray-200">
        {Icon && <Icon className={cn('w-5 h-5', color)} />}
        {label}
      </span>
      <span className={cn('font-num text-lg sm:text-xl font-bold', color)}>{value}</span>
    </div>
  );
}

export const formatTime = (seconds) => {
  const s = Math.floor(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h} h ${String(m).padStart(2, '0')} min`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export const formatNumber = (n) => Math.round(n || 0).toLocaleString('fr-BE');
