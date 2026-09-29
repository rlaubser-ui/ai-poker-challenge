'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, Player, Suit } from '@/types/poker';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';
import { formatChips } from '@/lib/utils/format';
import { usePokerStore } from '@/store/usePokerStore';

interface PlayerSeatProps {
  player: Player;
  isDealer: boolean;
  isActive: boolean;
  isHuman: boolean;
  revealHoleCards: boolean;
  winningCards?: Card[];
  seatPosition?: 'bottom' | 'bottom-left' | 'top-left' | 'top' | 'top-right' | 'bottom-right';
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isDealer,
  isActive,
  isHuman,
  revealHoleCards,
  winningCards = [],
}) => {
  const { actionTimeRemaining } = usePokerStore();

  const isWinningCard = (card: Card) =>
    winningCards.some(
      (w) => w.rank === card.rank && w.suit === card.suit
    );

  const isEliminated = player.isEliminated || (player.chips === 0 && player.isFolded && player.currentBet === 0);
  const isFolded = player.isFolded;

  // Reveal cards if:
  // 1. It's the human player
  // 2. Showdown / hand ended (revealHoleCards is true)
  // 3. The player has folded (so the user can always see what opponents folded!)
  const isRevealed = isHuman || revealHoleCards || isFolded;
  const isHidden = !isRevealed;

  return (
    <div className={`flex flex-col items-center relative transition-opacity duration-300 ${isEliminated ? 'opacity-40 grayscale' : 'opacity-100'}`}>
      {/* 15-Second Action Countdown Timer for Hero */}
      {isActive && isHuman && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`absolute -top-7 z-30 flex items-center gap-1 px-2.5 py-0.5 rounded-full border shadow-lg backdrop-blur-md text-xs font-mono font-bold ${
            actionTimeRemaining <= 5
              ? 'bg-red-950/95 border-red-500 text-red-300 animate-pulse'
              : 'bg-zinc-950/95 border-amber-400 text-amber-300'
          }`}
        >
          <span>⏱️</span>
          <span>{actionTimeRemaining}s</span>
        </motion.div>
      )}

      {/* AI Thinking Timer Badge */}
      {isActive && !isHuman && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="absolute -top-7 z-30 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-950/90 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold shadow-md"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>Thinking...</span>
        </motion.div>
      )}

      {/* Current Street Bet on Table */}
      {player.currentBet > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: isHuman ? -12 : 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`absolute ${isHuman ? '-top-10' : '-bottom-10'} z-20 pointer-events-none`}
        >
          <ChipStack amount={player.currentBet} size="sm" />
        </motion.div>
      )}

      {/* Action Badge Announcement (e.g. RAISE 80, CALL, CHECK, FOLD) */}
      {player.lastAction && !isEliminated && !isActive && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: isHuman ? 10 : -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`absolute ${isHuman ? '-bottom-7' : '-top-7'} z-30 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg border backdrop-blur-md ${
            player.lastAction.type === 'raise'
              ? 'bg-amber-500 text-zinc-950 border-amber-300'
              : player.lastAction.type === 'fold'
              ? 'bg-red-900/90 text-red-200 border-red-500/40'
              : player.lastAction.type === 'call'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-zinc-800 text-zinc-200 border-zinc-600'
          }`}
        >
          {player.lastAction.label || player.lastAction.type}
        </motion.div>
      )}

      {/* Folded Cards Readout Badge */}
      {isFolded && player.holeCards.length === 2 && (
        <div className="text-[10px] font-black text-red-300 bg-red-950/95 border border-red-500/50 px-2 py-0.5 rounded-full shadow-lg z-20 mb-1 flex items-center gap-1 backdrop-blur-sm animate-fade-in">
          <span className="text-zinc-400 uppercase text-[9px]">Mucked</span>
          <span className="font-mono text-zinc-100 font-bold">
            {player.holeCards.map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit] || c.suit}`).join(' ')}
          </span>
        </div>
      )}

      {/* Hole Cards */}
      <div className="flex items-center -space-x-4 sm:-space-x-5 z-10 mb-1">
        {player.holeCards.map((card, idx) => {
          return (
            <motion.div
              key={`${card.rank}${card.suit}_${idx}`}
              initial={{ rotate: idx === 0 ? -6 : 6 }}
              animate={{
                rotate: isFolded ? (idx === 0 ? -12 : 12) : (idx === 0 ? -4 : 4),
                y: isActive ? [0, -3, 0] : 0,
              }}
              transition={{
                y: { repeat: isActive ? Infinity : 0, duration: 1.8 },
              }}
              className={`transition-all ${isFolded ? 'opacity-85 brightness-95 grayscale-[15%]' : 'opacity-100'}`}
            >
              <CardView
                card={card}
                hidden={isHidden}
                highlight={isWinningCard(card)}
                className={isFolded ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Seat Badge & Info */}
      <motion.div
        animate={{
          scale: isActive ? 1.04 : 1,
        }}
        className={`relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all ${
          isActive
            ? 'border-yellow-400 bg-zinc-900/95 ring-2 sm:ring-4 ring-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
            : isEliminated
            ? 'border-zinc-800 bg-zinc-950/60'
            : 'border-zinc-700/70 bg-zinc-950/85 hover:border-zinc-600'
        }`}
      >
        {/* Active Turn Pulsing Border Indicator */}
        {isActive && (
          <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 animate-ping opacity-30 pointer-events-none" />
        )}

        {/* Dealer Button */}
        {isDealer && !isEliminated && (
          <div className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-amber-400 border border-white shadow-md flex items-center justify-center text-zinc-950 font-black text-[11px] z-20">
            D
          </div>
        )}

        {/* Avatar */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center shrink-0 text-base sm:text-lg">
          <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
            {isHuman ? '🤠' : (player.avatar || '🤖')}
          </div>
        </div>

        {/* Player Name and Chip Count */}
        <div className="flex flex-col min-w-[70px] sm:min-w-[85px] leading-tight">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs text-zinc-100 truncate max-w-[70px] sm:max-w-[85px]">
              {player.name}
            </span>
            {player.style && !isHuman && (
              <span className="hidden sm:inline-block text-[8px] font-semibold text-amber-300/90 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-500/20">
                {player.style}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            {isEliminated ? (
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                {player.finishRank ? `${player.finishRank === 2 ? '2nd' : player.finishRank === 3 ? '3rd' : `${player.finishRank}th`} Place` : 'Busted'}
              </span>
            ) : (
              <>
                <span className="text-amber-400 font-mono font-bold text-xs">
                  {formatChips(player.chips)}
                </span>
                {player.isFolded && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-1 py-0.2 rounded">
                    Fold
                  </span>
                )}
                {player.isAllIn && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded">
                    All-In
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
