'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Player } from '@/types/poker';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';

interface PlayerSeatProps {
  player: Player;
  isDealer: boolean;
  isActive: boolean;
  isHuman: boolean;
  revealHoleCards: boolean;
  winningCards?: Card[];
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isDealer,
  isActive,
  isHuman,
  revealHoleCards,
  winningCards = [],
}) => {
  const isWinningCard = (card: Card) =>
    winningCards.some(
      (w) => w.rank === card.rank && w.suit === card.suit
    );

  return (
    <div className="flex flex-col items-center gap-2 relative">
      {/* Current Street Bet on Table */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: isHuman ? -10 : 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`absolute ${isHuman ? '-top-12' : '-bottom-12'} z-20`}
        >
          <ChipStack amount={player.currentBet} size="sm" />
        </motion.div>
      )}

      {/* Hole Cards */}
      <div className="flex items-center -space-x-4 sm:-space-x-6 z-10">
        {player.holeCards.map((card, idx) => {
          const isHidden = !isHuman && !revealHoleCards && !player.isFolded;
          return (
            <motion.div
              key={`${card.rank}${card.suit}_${idx}`}
              initial={{ rotate: idx === 0 ? -5 : 5 }}
              animate={{
                rotate: idx === 0 ? -4 : 4,
                y: isActive ? [0, -4, 0] : 0,
              }}
              transition={{
                y: { repeat: isActive ? Infinity : 0, duration: 2 },
              }}
            >
              <CardView
                card={card}
                hidden={isHidden}
                highlight={isWinningCard(card)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Seat Badge & Info */}
      <motion.div
        animate={{
          scale: isActive ? 1.03 : 1,
        }}
        className={`relative flex items-center gap-3 px-4 py-2 rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-all ${
          isActive
            ? 'border-yellow-400 bg-zinc-900/95 ring-4 ring-yellow-400/30'
            : 'border-zinc-700/80 bg-zinc-950/85'
        }`}
      >
        {/* Dealer Button */}
        {isDealer && (
          <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center text-zinc-950 font-black text-xs">
            D
          </div>
        )}

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center shrink-0 text-xl">
          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
            {isHuman ? '👤' : (player.avatar || '🤖')}
          </div>
        </div>

        {/* Player Name and Chip Count */}
        <div className="flex flex-col min-w-[90px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-zinc-100 tracking-tight">
              {player.name}
            </span>
            {player.style && !isHuman && (
              <span className="text-[9px] font-semibold text-amber-300/90 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">
                {player.style}
              </span>
            )}
            {player.isFolded && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded">
                Folded
              </span>
            )}
            {player.isAllIn && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded">
                All-In
              </span>
            )}
          </div>
          <span className="text-amber-400 font-mono font-semibold text-xs">
            ${player.chips.toLocaleString()}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
