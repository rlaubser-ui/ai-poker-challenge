'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';
import { PlayerSeat } from './PlayerSeat';
import { usePokerStore } from '@/store/usePokerStore';
import { formatChips } from '@/lib/utils/format';

export const Table: React.FC = () => {
  const { gameState, isAITurn } = usePokerStore();
  const [isOverlayMinimized, setIsOverlayMinimized] = useState(false);

  useEffect(() => {
    setIsOverlayMinimized(false);
  }, [gameState?.handId]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-zinc-500 font-medium animate-pulse">Initializing 7-Max Poker Table...</div>
      </div>
    );
  }

  const dealerIdx = gameState.dealerIndex;
  const activeIdx = gameState.activePlayerIndex;
  const winner = gameState.winners?.[0];
  const winningCards = winner?.bestFiveCards || [];

  const players = gameState.players;
  const hero = players[0];
  const seat1 = players[1]; // Viktor "The Shark"
  const seat2 = players[2]; // Rex "Bulldozer"
  const seat3 = players[3]; // Larry "Lucky"
  const seat4 = players[4]; // Pete "Old School"
  const seat5 = players[5]; // Sophia "GTO"
  const seat6 = players[6]; // Vince "Vegas"

  const renderSeat = (playerIndex: number) => {
    const p = players[playerIndex];
    if (!p) return null;
    return (
      <PlayerSeat
        player={p}
        isDealer={dealerIdx === playerIndex}
        isActive={activeIdx === playerIndex && gameState.stage !== 'ended'}
        isHuman={!p.isAI}
        revealHoleCards={gameState.stage === 'ended' || !p.isAI}
        winningCards={winningCards}
      />
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto my-2 px-1 sm:px-2">
      {/* Outer Casino Table Rail (Wood/Leather Trim) */}
      <div className="relative w-full rounded-[90px] sm:rounded-[140px] md:rounded-[170px] p-3 sm:p-5 md:p-7 bg-gradient-to-b from-stone-900 via-zinc-950 to-stone-900 border-8 border-stone-800 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_4px_16px_rgba(255,255,255,0.06)]">
        {/* Inner Green Felt Table Oval */}
        <div className="relative w-full min-h-[540px] sm:min-h-[590px] md:min-h-[640px] rounded-[75px] sm:rounded-[120px] md:rounded-[150px] bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 border-4 border-amber-500/20 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] flex flex-col justify-between items-center py-4 sm:py-6 px-2 sm:px-4 overflow-hidden">
          {/* Subtle Casino Table Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-9xl font-serif font-black text-amber-300">
              ♠
            </span>
          </div>

          {/* TOP ROW: Pete (Seat 4, Top Left) and Larry (Seat 3, Top Right) */}
          <div className="w-full flex items-center justify-around z-10 px-4 sm:px-12">
            {seat4 && <div className="transform -translate-y-1">{renderSeat(4)}</div>}
            {seat3 && <div className="transform -translate-y-1">{renderSeat(3)}</div>}
          </div>

          {/* MIDDLE ROW: Sophia (Seat 5, Left), Board & Pots (Center), Rex (Seat 2, Right) */}
          <div className="w-full flex items-center justify-between z-10 px-1 sm:px-3 my-auto">
            {/* Left Flank: Sophia (Seat 5) */}
            <div className="w-28 sm:w-36 flex justify-start">
              {seat5 && renderSeat(5)}
            </div>

            {/* Center Area: Main Pot, Side Pots, Community Cards, and Stage Indicator */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 mx-auto z-10 py-1">
              {/* Pots Display: Main Pot and Side Pots */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <ChipStack
                  amount={gameState.pot}
                  label="POT"
                  size="lg"
                  className="bg-zinc-950/90 border-amber-400/70 shadow-2xl"
                />
                {gameState.sidePots && gameState.sidePots.length > 1 && (
                  <div className="flex items-center gap-1">
                    {gameState.sidePots.slice(1).map((sp, idx) => (
                      <span
                        key={sp.id}
                        className="px-2 py-0.5 rounded-full bg-zinc-900/90 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300 shadow-md"
                      >
                        Side {idx + 1}: ${sp.amount}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Board (5 Card Slots) */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const card = gameState.communityCards[slotIdx];
                  if (card) {
                    const isWinning = winningCards.some(
                      (w) => w.rank === card.rank && w.suit === card.suit
                    );
                    return (
                      <CardView
                        key={`comm_${card.rank}${card.suit}_${slotIdx}`}
                        card={card}
                        highlight={isWinning}
                      />
                    );
                  }
                  // Empty placeholder card slot
                  return (
                    <div
                      key={`empty_${slotIdx}`}
                      className="w-12 h-18 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl border-2 border-dashed border-emerald-600/30 bg-emerald-950/20 flex items-center justify-center shadow-inner"
                    >
                      <span className="text-emerald-700/40 text-lg sm:text-xl font-serif">
                        ♠
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Stage Indicator Badge */}
              <div className="px-2.5 py-0.5 rounded-full bg-black/50 border border-emerald-400/25 text-[10px] font-black tracking-widest text-emerald-300 uppercase shadow-md">
                {gameState.stage}
              </div>
            </div>

            {/* Right Flank: Rex (Seat 2) */}
            <div className="w-28 sm:w-36 flex justify-end">
              {seat2 && renderSeat(2)}
            </div>
          </div>

          {/* LOWER FLANKS ROW: Vince (Seat 6, Bottom Left) and Viktor (Seat 1, Bottom Right) */}
          <div className="w-full flex items-center justify-between z-10 px-4 sm:px-14">
            {seat6 && renderSeat(6)}
            {seat1 && renderSeat(1)}
          </div>

          {/* BOTTOM CENTER: Hero Player Seat (Seat 0) */}
          <div className="z-10 mt-1">
            {renderSeat(0)}
          </div>

          {/* Showdown Result Overlay Banner */}
          {gameState.stage === 'ended' && winner && (
            isOverlayMinimized ? (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setIsOverlayMinimized(false)}
                className="absolute bottom-3 sm:bottom-4 z-30 px-3.5 py-1.5 rounded-full bg-zinc-950/95 border border-amber-400/80 shadow-lg text-amber-300 font-bold text-xs flex items-center gap-2 hover:bg-zinc-900 transition-colors backdrop-blur-md"
              >
                <span>🏆</span>
                <span>{winner.description}</span>
                <span className="text-[10px] text-zinc-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 font-semibold">
                  👁️ Show Result
                </span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center bg-zinc-950/95 border-2 border-amber-400/80 rounded-2xl p-4 shadow-[0_0_50px_rgba(212,175,55,0.35)] backdrop-blur-lg max-w-sm mx-auto text-center"
              >
                <button
                  onClick={() => setIsOverlayMinimized(true)}
                  className="absolute top-2.5 right-2.5 text-[11px] text-zinc-400 hover:text-amber-300 px-2 py-0.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 transition-colors flex items-center gap-1 font-sans border border-zinc-700/60"
                  title="Minimize banner to inspect cards"
                >
                  <span>👁️</span> Peek Cards
                </button>
                <div className="text-3xl mb-1 mt-0.5">
                  🏆
                </div>
                <h3 className="text-lg font-black text-amber-300 tracking-tight px-4 leading-snug">
                  {winner.description}
                </h3>
                <p className="text-zinc-300 font-mono text-xs mt-1">
                  Awarded <span className="text-amber-400 font-bold">${formatChips(winner.amount)}</span> chips
                </p>
              </motion.div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
