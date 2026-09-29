'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Suit } from '@/types/poker';
import { CardFaceTheme, CardBackTheme } from '@/types/settings';
import { usePokerStore } from '@/store/usePokerStore';

interface CardViewProps {
  card?: Card;
  hidden?: boolean;
  highlight?: boolean;
  faceTheme?: CardFaceTheme;
  backTheme?: CardBackTheme;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

// 4-Color Deck Colors (Standard in Pro Online Poker)
const FOUR_COLOR_MAP: Record<Suit, string> = {
  s: 'text-slate-900',
  h: 'text-red-600',
  d: 'text-blue-600',
  c: 'text-emerald-600',
};

// Traditional 2-Color Deck Colors
const TWO_COLOR_MAP: Record<Suit, string> = {
  s: 'text-slate-900',
  c: 'text-slate-900',
  h: 'text-red-600',
  d: 'text-red-600',
};

// Classic Casino Serif Colors
const CLASSIC_COLOR_MAP: Record<Suit, string> = {
  s: 'text-zinc-950',
  c: 'text-zinc-950',
  h: 'text-rose-700',
  d: 'text-rose-700',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  hidden = false,
  highlight = false,
  faceTheme,
  backTheme,
  className = '',
  size = 'md',
}) => {
  const storeSettings = usePokerStore((state) => state.settings);
  const activeFaceTheme = faceTheme || storeSettings?.cardFaceTheme || 'four-color';
  const activeBackTheme = backTheme || storeSettings?.cardBackTheme || 'pokerbet-magenta';

  const sizeClasses = {
    sm: 'w-11 h-16 sm:w-12 sm:h-18 text-xs',
    md: 'w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 text-sm sm:text-base',
    lg: 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 text-base sm:text-lg',
  }[size];

  // ==========================================
  // CARD BACK RENDERING (4 Authentic Variations)
  // ==========================================
  if (hidden || !card) {
    if (activeBackTheme === 'pokerbet-magenta') {
      // PokerBet Iconic Magenta Geometric Diamond Back (as seen in screenshot)
      return (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`${sizeClasses} rounded-xl border-2 border-fuchsia-400/80 bg-gradient-to-br from-fuchsia-950 via-purple-950 to-zinc-950 shadow-xl p-1 sm:p-1.5 flex items-center justify-center select-none shadow-fuchsia-950/50 ${className}`}
        >
          <div className="w-full h-full rounded-lg border border-fuchsia-500/40 bg-[linear-gradient(45deg,#d946ef22_25%,transparent_25%),linear-gradient(-45deg,#d946ef22_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d946ef22_75%),linear-gradient(-45deg,transparent_75%,#d946ef22_75%)] [background-size:10px_10px] [background-position:0_0,0_5px,5px_-5px,-5px_0] flex items-center justify-center shadow-inner">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-fuchsia-400/60 bg-fuchsia-900/60 flex items-center justify-center text-fuchsia-300 text-[10px] sm:text-xs font-serif font-black shadow-md">
              ◆
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeBackTheme === 'midnight-navy') {
      // Midnight Navy & Gold Filigree
      return (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`${sizeClasses} rounded-xl border-2 border-amber-300/50 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 shadow-xl p-1 sm:p-1.5 flex items-center justify-center select-none shadow-blue-950/60 ${className}`}
        >
          <div className="w-full h-full rounded-lg border border-amber-400/30 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:7px_7px] flex items-center justify-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-amber-400/50 bg-indigo-900/70 flex items-center justify-center text-amber-300 text-[10px] sm:text-xs font-serif font-bold shadow-md">
              ♠
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeBackTheme === 'casino-red') {
      // Classic Vegas Casino Ruby Red Crosshatch
      return (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`${sizeClasses} rounded-xl border-2 border-red-200/90 bg-gradient-to-br from-red-700 via-red-900 to-rose-950 shadow-xl p-1 sm:p-1.5 flex items-center justify-center select-none shadow-red-950/60 ${className}`}
        >
          <div className="w-full h-full rounded-lg border border-white/40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] flex items-center justify-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/60 bg-red-950/70 flex items-center justify-center text-white text-[10px] sm:text-xs font-serif font-bold shadow-md">
              ★
            </div>
          </div>
        </motion.div>
      );
    }

    // Default / cyber-gold: Sleek Carbon Gold
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`${sizeClasses} rounded-xl border-2 border-amber-400/80 bg-gradient-to-br from-zinc-900 via-neutral-950 to-black shadow-xl p-1 sm:p-1.5 flex items-center justify-center select-none shadow-amber-950/30 ${className}`}
      >
        <div className="w-full h-full rounded-lg border border-amber-500/30 bg-[linear-gradient(135deg,#eab30815_25%,transparent_25%),linear-gradient(225deg,#eab30815_25%,transparent_25%)] [background-size:8px_8px] flex items-center justify-center shadow-inner">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-amber-400 bg-amber-950/80 flex items-center justify-center text-amber-300 text-[10px] sm:text-xs font-serif font-black shadow-md">
            👑
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // CARD FACE RENDERING (3 Distinct Variations)
  // ==========================================
  const symbol = SUIT_SYMBOLS[card.suit];
  const colorMap =
    activeFaceTheme === 'two-color'
      ? TWO_COLOR_MAP
      : activeFaceTheme === 'classic'
      ? CLASSIC_COLOR_MAP
      : FOUR_COLOR_MAP;

  const color = colorMap[card.suit];

  const faceBg =
    activeFaceTheme === 'classic'
      ? 'bg-[#fcfaf2] border-amber-200/90 font-serif'
      : 'bg-white border-zinc-300 font-sans';

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: -6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25 }}
      className={`${sizeClasses} rounded-xl ${faceBg} border-2 shadow-2xl flex flex-col justify-between p-1.5 sm:p-2 select-none relative transition-colors ${
        highlight
          ? 'border-yellow-400 ring-4 ring-yellow-400/50 shadow-yellow-500/30 brightness-105'
          : ''
      } ${className}`}
    >
      {/* Top Left Corner */}
      <div className={`flex flex-col items-center leading-none ${color}`}>
        <span className="font-extrabold tracking-tighter">
          {card.rank}
        </span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>

      {/* Center Watermark Pip */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${color} opacity-85 pointer-events-none`}
      >
        <span className="text-xl sm:text-2xl md:text-3xl font-bold">{symbol}</span>
      </div>

      {/* Bottom Right Inverted Corner */}
      <div className={`flex flex-col items-center leading-none rotate-180 self-end ${color}`}>
        <span className="font-extrabold tracking-tighter">
          {card.rank}
        </span>
        <span className="text-[10px] sm:text-xs">{symbol}</span>
      </div>
    </motion.div>
  );
};
