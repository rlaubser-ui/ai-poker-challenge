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

  // Calculate circular timer ring for active turn
  const timerRadius = 18;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerPercent = isHuman ? Math.max(0, actionTimeRemaining / 15) : 1;
  const strokeDashoffset = timerCircumference - (timerPercent * timerCircumference);

  const timerColor =
    actionTimeRemaining <= 5
      ? 'stroke-red-500'
      : actionTimeRemaining <= 9
      ? 'stroke-amber-400'
      : 'stroke-emerald-400';

  return (
    <div className={`flex flex-col items-center relative transition-opacity duration-300 ${isEliminated ? 'opacity-35 grayscale' : 'opacity-100'}`}>
      {/* 15-Second Action Countdown Readout for Hero */}
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

      {/* AI Thinking Indicator */}
      {isActive && !isHuman && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="absolute -top-7 z-30 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-950/95 border border-purple-500/60 text-purple-300 font-mono text-[10px] font-bold shadow-md shadow-purple-950/50"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          <span>Thinking...</span>
        </motion.div>
      )}

      {/* Action Announcement Bubble (e.g. RAISE 80, CALL, CHECK, FOLD) */}
      {player.lastAction && !isEliminated && !isActive && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: isHuman ? 10 : -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className={`absolute ${isHuman ? '-bottom-7' : '-top-7'} z-30 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg border backdrop-blur-md ${
            player.lastAction.type === 'raise'
              ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-amber-500/20'
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
          <span className="text-zinc-400 uppercase text-[8px]">Mucked</span>
          <span className="font-mono text-zinc-100 font-bold">
            {player.holeCards.map((c) => `${c.rank}${SUIT_SYMBOLS[c.suit] || c.suit}`).join(' ')}
          </span>
        </div>
      )}

      {/* Hole Cards */}
      <div className="flex items-center -space-x-4 sm:-space-x-5 z-10 mb-1">
        {player.holeCards.map((card, idx) => (
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
            className={`transition-all ${isFolded ? 'opacity-80 brightness-95 grayscale-[20%]' : 'opacity-100'}`}
          >
            <CardView
              card={card}
              hidden={isHidden}
              highlight={isWinningCard(card)}
              className={isFolded ? 'border-red-500/50 ring-1 ring-red-500/30' : ''}
            />
          </motion.div>
        ))}
      </div>

      {/* PokerBet Sleek Capsule Pill Seat */}
      <motion.div
        animate={{
          scale: isActive ? 1.04 : 1,
        }}
        className={`relative flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border backdrop-blur-md shadow-2xl transition-all ${
          isActive
            ? 'border-purple-400 bg-zinc-950/95 ring-2 sm:ring-4 ring-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.4)]'
            : isEliminated
            ? 'border-zinc-800 bg-zinc-950/60'
            : 'border-zinc-700/60 bg-zinc-950/85 hover:border-zinc-600'
        }`}
      >
        {/* Dealer Button - PokerBet 3D Gold Disc */}
        {isDealer && !isEliminated && (
          <div className="absolute -top-3 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 border-2 border-amber-100 shadow-[0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center text-zinc-950 font-black text-[11px] z-30">
            D
          </div>
        )}

        {/* Circular Avatar with Action Timer Ring */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
          {/* SVG Timer Ring */}
          {isActive && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
              <circle
                cx="50%"
                cy="50%"
                r={timerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-zinc-800"
              />
              <circle
                cx="50%"
                cy="50%"
                r={timerRadius}
                fill="none"
                strokeWidth="2.5"
                strokeDasharray={timerCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`${timerColor} transition-all duration-300`}
              />
            </svg>
          )}

          {/* Avatar Disc */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-purple-900 to-indigo-950 border border-purple-500/40 p-0.5 shadow-md flex items-center justify-center overflow-hidden text-base">
            <span>{isHuman ? '🤠' : (player.avatar || '🤖')}</span>
          </div>
        </div>

        {/* Player Name and Chip Count */}
        <div className="flex flex-col min-w-[75px] sm:min-w-[90px] leading-tight text-left">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-xs text-zinc-100 truncate max-w-[70px] sm:max-w-[85px]">
              {player.name}
            </span>
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
                  <span className="text-[8px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-1 py-0.2 rounded border border-red-500/30">
                    Fold
                  </span>
                )}
                {player.isAllIn && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/30">
                    All-In
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Note / Info Icon (PokerBet style '+' pill) */}
        <button
          className="w-4 h-4 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-[10px] font-bold transition-colors ml-0.5"
          title={`${player.name} - ${player.style || 'Player'}`}
        >
          +
        </button>
      </motion.div>
    </div>
  );
};
