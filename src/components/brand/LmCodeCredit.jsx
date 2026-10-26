import React from 'react';
import { cn } from '@/lib/utils';

export const LM_CODE_URL = 'https://lm-code.be';

export default function LmCodeCredit({ className, size = 'sm' }) {
  const logo = size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <a
      href={LM_CODE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('group inline-flex items-center gap-3 text-gray-400 hover:text-white transition-colors', className)}
    >
      <img
        src={`${import.meta.env.BASE_URL}lm-code-logo.jpg`}
        alt="Logo LM-Code"
        className={cn(logo, 'rounded-full ring-1 ring-white/20 group-hover:ring-cyan-400 transition')}
        loading="lazy"
      />
      <span className="text-left leading-tight">
        <span className="block text-[11px] uppercase tracking-widest text-gray-500">Développé par</span>
        <span className="block font-semibold">
          Michael · <span className="text-cyan-300 group-hover:text-cyan-200">LM-Code</span>
        </span>
      </span>
    </a>
  );
}
