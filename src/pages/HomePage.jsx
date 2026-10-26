import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Gamepad2, Swords, Infinity as InfinityIcon, Bot, ShoppingBag, Smartphone, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LmCodeCredit, { LM_CODE_URL } from '@/components/brand/LmCodeCredit';
import useDocumentTitle from '@/hooks/useDocumentTitle';

const FEATURES = [
  { icon: Swords, title: 'Campagne', text: '5 zones de la mégapole, de plus en plus dangereuses.' },
  { icon: Bot, title: 'Boss Titan-X', text: 'Un mécha géant en 3 phases : charge, onde de choc, lasers.' },
  { icon: InfinityIcon, title: 'Survie', text: 'Vagues infinies et boss toutes les 5 vagues.' },
  { icon: ShoppingBag, title: 'Progression', text: 'Crédits, améliorations permanentes, classement et stats.' },
];

export default function HomePage() {
  useDocumentTitle('Cyber Arena Fighter — LM-Code');

  return (
    <div className="min-h-[100dvh] flex flex-col cyber-grid bg-[radial-gradient(120%_90%_at_50%_100%,#ff4ff0_0%,#7c3aed_18%,#2a0a4a_42%,#0a0014_75%)]">
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href={LM_CODE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
          <img src={`${import.meta.env.BASE_URL}lm-code-logo.jpg`} alt="Logo LM-Code" className="w-10 h-10 rounded-full ring-1 ring-white/20 group-hover:ring-cyan-400 transition" />
          <span className="font-display font-bold tracking-wide text-white/90 group-hover:text-white">LM-Code</span>
        </a>
        <Button asChild variant="ghost" className="text-cyan-200 hover:text-white hover:bg-white/10">
          <Link to="/game">
            <Gamepad2 className="w-4 h-4 mr-2" /> Jouer
          </Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
          <p className="font-display text-xs sm:text-sm tracking-[0.5em] text-cyan-300 mb-3">COMBAT 2D · CYBERPUNK</p>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-magenta-500 drop-shadow-[0_0_30px_rgba(255,0,230,0.35)]">
            CYBER ARENA
          </h1>
          <p className="font-display text-xl sm:text-3xl font-bold text-white/90 tracking-[0.3em] mt-2">FIGHTER</p>
          <p className="max-w-xl mx-auto mt-6 text-lg sm:text-xl text-purple-100/85">
            Choisissez votre combattant, nettoyez les bas-fonds néon et abattez le titan qui contrôle la ville. Directement dans votre navigateur, sur ordinateur comme sur mobile.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="mt-10">
          <Button asChild className="h-16 px-12 font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-500 to-magenta-500 hover:from-cyan-400 hover:to-magenta-400 text-white border-2 border-cyan-300 shadow-xl shadow-magenta-500/40">
            <Link to="/game">
              <Gamepad2 className="w-7 h-7 mr-3" /> Lancer le jeu
            </Link>
          </Button>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-purple-100/70">
            <span className="flex items-center gap-1.5"><Keyboard className="w-4 h-4" /> Clavier</span>
            <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> Tactile</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl"
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-5 text-left">
              <Icon className="w-8 h-8 text-cyan-300 mb-2" />
              <h2 className="font-display font-bold text-white mb-1">{title}</h2>
              <p className="text-sm text-gray-300">{text}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="w-full border-t border-white/10 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <LmCodeCredit />
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Cyber Arena Fighter · LM-Code. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
