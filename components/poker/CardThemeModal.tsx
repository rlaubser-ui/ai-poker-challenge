'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardBackTheme, CardFaceTheme } from '@/types/settings';
import { usePokerStore } from '@/store/usePokerStore';
import { CardView } from './CardView';
import { Card } from '@/types/poker';

interface CardThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_CARDS: Card[] = [
  { rank: 'A', suit: 's' },
  { rank: 'K', suit: 'h' },
  { rank: 'Q', suit: 'd' },
  { rank: 'J', suit: 'c' },
];

export const CardThemeModal: React.FC<CardThemeModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = usePokerStore();

  const currentFace = settings.cardFaceTheme || 'four-color';
  const currentBack = settings.cardBackTheme || 'pokerbet-magenta';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎴</span>
              <h3 className="font-extrabold text-base text-zinc-100">
                Card & Deck Customizer
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center text-sm font-bold transition-all"
            >
              ✕
            </button>
          </div>

          <div className="p-5 space-y-6 overflow-y-auto max-h-[75vh]">
            {/* Live Interactive Preview */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-950/40 via-zinc-900 to-zinc-950 border border-indigo-500/20 shadow-inner">
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest text-center mb-3">
                Live Table Preview
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {/* Card Back Preview */}
                <CardView hidden size="md" backTheme={currentBack} />
                {/* 4 Sample Cards */}
                {PREVIEW_CARDS.map((card) => (
                  <CardView
                    key={`${card.rank}${card.suit}`}
                    card={card}
                    size="md"
                    faceTheme={currentFace}
                  />
                ))}
              </div>
            </div>

            {/* 1. Card Face Selection */}
            <div>
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Card Face Theme</span>
                <span className="text-[10px] text-zinc-500 font-normal">Prevents suit misreading</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'four-color' as CardFaceTheme,
                    name: '4-Color Pro',
                    desc: '♠ Black, ♥ Red, ♦ Blue, ♣ Green (PokerBet / WSOP Standard)',
                    accent: 'border-fuchsia-500/60 text-fuchsia-300',
                  },
                  {
                    id: 'two-color' as CardFaceTheme,
                    name: 'Classic 2-Color',
                    desc: 'Traditional Red (♥♦) & Black (♠♣) Casino Deck',
                    accent: 'border-amber-500/60 text-amber-300',
                  },
                  {
                    id: 'classic' as CardFaceTheme,
                    name: 'Vintage Casino',
                    desc: 'Aged Ivory felt finish with elegant Serif typography',
                    accent: 'border-emerald-500/60 text-emerald-300',
                  },
                ].map((face) => {
                  const isSelected = currentFace === face.id;
                  return (
                    <button
                      key={face.id}
                      onClick={() => updateSettings({ cardFaceTheme: face.id })}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? `bg-zinc-900 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400`
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-zinc-100">{face.name}</span>
                          {isSelected && <span className="text-xs text-amber-400">✓</span>}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">{face.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Card Back Selection */}
            <div>
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                Card Back Pattern
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'pokerbet-magenta' as CardBackTheme,
                    name: 'PokerBet Magenta',
                    colorDot: 'bg-fuchsia-500',
                    desc: 'Official geometric magenta lattice',
                  },
                  {
                    id: 'midnight-navy' as CardBackTheme,
                    name: 'Midnight Navy',
                    colorDot: 'bg-blue-600',
                    desc: 'Sapphire blue with gold trim',
                  },
                  {
                    id: 'casino-red' as CardBackTheme,
                    name: 'Casino Ruby Red',
                    colorDot: 'bg-red-600',
                    desc: 'Vegas red crosshatch',
                  },
                  {
                    id: 'cyber-gold' as CardBackTheme,
                    name: 'Cyber Carbon',
                    colorDot: 'bg-amber-400',
                    desc: 'Carbon graphite & gold',
                  },
                ].map((back) => {
                  const isSelected = currentBack === back.id;
                  return (
                    <button
                      key={back.id}
                      onClick={() => updateSettings({ cardBackTheme: back.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center gap-2 text-center ${
                        isSelected
                          ? `bg-zinc-900 border-amber-400 ring-1 ring-amber-400 shadow-md`
                          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-12 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                        <CardView hidden size="sm" backTheme={back.id} />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-[11px] text-zinc-200">{back.name}</span>
                        <span className="text-[9px] text-zinc-500 leading-tight">{back.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-md"
            >
              Apply & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
