'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Suit } from '@/types/poker';

interface CardViewProps {
  card?: Card;
  hidden?: boolean;
  highlight?: boolean;
  className?: string;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

const SUIT_COLORS: Record<Suit, string> = {
  s: 'text-slate-900',
  c: 'text-slate-900',
  h: 'text-red-600',
  d: 'text-red-600',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  hidden = false,
  highlight = false,
  className = '',
}) => {
  if (hidden || !card) {
    // Card back
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-amber-200/40 bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950 shadow-xl p-1.5 flex items-center justify-center select-none ${className}`}
      >
        <div className="w-full h-full rounded-lg border border-amber-400/20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border border-amber-400/30 flex items-center justify-center text-amber-300 text-xs font-serif font-bold">
            ♠
          </div>
        </div>
      </motion.div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0, y: -8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25 }}
      className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-white border-2 shadow-2xl flex flex-col justify-between p-1.5 sm:p-2 select-none relative ${
        highlight
          ? 'border-yellow-400 ring-4 ring-yellow-400/50 shadow-yellow-500/20'
          : 'border-zinc-300'
      } ${className}`}
    >
      {/* Top Left */}
      <div className={`flex flex-col items-center leading-none ${color}`}>
        <span className="font-extrabold text-sm sm:text-base tracking-tighter">
          {card.rank}
        </span>
        <span className="text-xs sm:text-sm">{symbol}</span>
      </div>

      {/* Center Big Icon */}
      <div className={`absolute inset-0 flex items-center justify-center ${color} opacity-90 pointer-events-none`}>
        <span className="text-2xl sm:text-3xl font-bold">{symbol}</span>
      </div>

      {/* Bottom Right Rotated */}
      <div className={`flex flex-col items-center leading-none rotate-180 self-end ${color}`}>
        <span className="font-extrabold text-sm sm:text-base tracking-tighter">
          {card.rank}
        </span>
        <span className="text-xs sm:text-sm">{symbol}</span>
      </div>
    </motion.div>
  );
};
