'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';
import { PlayerSeat } from './PlayerSeat';
import { usePokerStore } from '@/store/usePokerStore';
import { formatChips } from '@/lib/utils/format';

export const Table: React.FC = () => {
  const { gameState, startNewHand } = usePokerStore();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-zinc-500 font-medium animate-pulse flex items-center gap-2">
          <span className="text-purple-400">♠</span> Loading PokerBet Table #3447111...
        </div>
      </div>
    );
  }

  const dealerIdx = gameState.dealerIndex;
  const activeIdx = gameState.activePlayerIndex;
  const winner = gameState.winners?.[0];
  const winningCards = winner?.bestFiveCards || [];

  const players = gameState.players;
  const hero = players[0];
  const seat1 = players[1]; // Viktor "The Shark" (Bottom Right)
  const seat2 = players[2]; // Rex "Bulldozer" (Right Flank)
  const seat3 = players[3]; // Larry "Lucky" (Top Right)
  const seat4 = players[4]; // Pete "Old School" (Top Left)
  const seat5 = players[5]; // Sophia "GTO" (Left Flank)
  const seat6 = players[6]; // Vince "Vegas" (Bottom Left)

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
    <div className="relative w-full max-w-7xl mx-auto my-1 px-1 sm:px-2 select-none flex flex-col xl:flex-row items-center justify-center gap-4">
      {/* 1. The Poker Table (Felt & Rail) */}
      <div className="relative w-full max-w-4xl xl:max-w-[960px]">
        {/* Outer Dark Leather / Carbon Table Rail with Subtle Specular Highlight */}
        <div className="relative w-full rounded-[140px] sm:rounded-[200px] md:rounded-[240px] p-2.5 sm:p-4 md:p-5 bg-gradient-to-b from-[#1c1d2b] via-[#10111a] to-[#181926] border-4 sm:border-[6px] border-[#222436] shadow-[0_25px_60px_rgba(0,0,0,0.95),inset_0_2px_8px_rgba(255,255,255,0.08)]">
          {/* Inner Dark Navy Oval Felt with Vibrant Neon Purple Rim Glow */}
          <div className="relative w-full min-h-[480px] sm:min-h-[530px] md:min-h-[560px] rounded-[120px] sm:rounded-[180px] md:rounded-[220px] bg-gradient-to-b from-[#141838] via-[#10142e] to-[#0b0e22] border-2 border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.3),inset_0_0_120px_rgba(0,0,0,0.9)] flex flex-col justify-between items-center py-3 sm:py-5 px-2 sm:px-4 overflow-hidden">
            
            {/* Authentic PokerBet Center Felt Watermark */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-6xl sm:text-7xl font-black">♠</span>
                <span className="text-4xl sm:text-5xl font-black tracking-widest uppercase">pokerbet</span>
              </div>
            </div>

            {/* TOP ROW: Pete (Seat 4, Top Left) and Larry (Seat 3, Top Right) */}
            <div className="w-full flex items-center justify-around z-10 px-4 sm:px-14">
              {seat4 && (
                <div className="relative transform -translate-y-1">
                  {renderSeat(4)}
                  {/* Seat 4 Bet Chips placed forward onto felt */}
                  {seat4.currentBet > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-28 z-20 pointer-events-none">
                      <ChipStack amount={seat4.currentBet} size="sm" />
                    </div>
                  )}
                </div>
              )}
              {seat3 && (
                <div className="relative transform -translate-y-1">
                  {renderSeat(3)}
                  {/* Seat 3 Bet Chips placed forward onto felt */}
                  {seat3.currentBet > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-28 z-20 pointer-events-none">
                      <ChipStack amount={seat3.currentBet} size="sm" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MIDDLE ROW: Sophia (Seat 5, Left), Board & Pots (Center), Rex (Seat 2, Right) */}
            <div className="w-full flex items-center justify-between z-10 px-1 sm:px-3 my-auto">
              {/* Left Flank: Sophia (Seat 5) */}
              <div className="relative w-28 sm:w-36 flex justify-start">
                {seat5 && (
                  <>
                    {renderSeat(5)}
                    {seat5.currentBet > 0 && (
                      <div className="absolute left-28 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <ChipStack amount={seat5.currentBet} size="sm" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Center Area: PokerBet POT Display, Side Pots, Community Board */}
              <div className="flex flex-col items-center gap-2 sm:gap-2.5 mx-auto z-10 py-1">
                {/* PokerBet Pot Readout (POT: 10 500) */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <div className="px-3.5 py-1 rounded-full bg-black/80 border border-purple-500/40 shadow-xl backdrop-blur-md flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-200 shadow-sm" />
                    <span className="text-xs sm:text-sm font-black tracking-wider text-amber-300 font-mono">
                      POT: {formatChips(gameState.pot)}
                    </span>
                  </div>

                  {gameState.sidePots && gameState.sidePots.length > 1 && (
                    <div className="flex items-center gap-1">
                      {gameState.sidePots.slice(1).map((sp, idx) => (
                        <span
                          key={sp.id}
                          className="px-2 py-0.5 rounded-full bg-black/80 border border-purple-400/40 text-[10px] font-mono font-bold text-purple-300 shadow-md"
                        >
                          Side {idx + 1}: {formatChips(sp.amount)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Community Board (5 Card Slots) - ALWAYS FULLY VISIBLE */}
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
                    // Empty placeholder card slot matching PokerBet navy felt
                    return (
                      <div
                        key={`empty_${slotIdx}`}
                        className="w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl border-2 border-dashed border-indigo-500/25 bg-indigo-950/20 flex items-center justify-center shadow-inner"
                      >
                        <span className="text-indigo-400/20 text-lg sm:text-xl font-serif">
                          ♠
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Stage Indicator Badge */}
                <div className="px-2.5 py-0.5 rounded-full bg-black/60 border border-purple-400/30 text-[10px] font-black tracking-widest text-purple-300 uppercase shadow-md">
                  {gameState.stage}
                </div>
              </div>

              {/* Right Flank: Rex (Seat 2) */}
              <div className="relative w-28 sm:w-36 flex justify-end">
                {seat2 && (
                  <>
                    {renderSeat(2)}
                    {seat2.currentBet > 0 && (
                      <div className="absolute right-28 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <ChipStack amount={seat2.currentBet} size="sm" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* LOWER FLANKS ROW: Vince (Seat 6, Bottom Left) and Viktor (Seat 1, Bottom Right) */}
            <div className="w-full flex items-center justify-between z-10 px-4 sm:px-14">
              {seat6 && (
                <div className="relative">
                  {renderSeat(6)}
                  {seat6.currentBet > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20 pointer-events-none">
                      <ChipStack amount={seat6.currentBet} size="sm" />
                    </div>
                  )}
                </div>
              )}
              {seat1 && (
                <div className="relative">
                  {renderSeat(1)}
                  {seat1.currentBet > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20 pointer-events-none">
                      <ChipStack amount={seat1.currentBet} size="sm" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BOTTOM CENTER: Hero Player Seat (Seat 0) */}
            <div className="relative z-10 mt-1">
              {renderSeat(0)}
              {hero && hero.currentBet > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-20 pointer-events-none">
                  <ChipStack amount={hero.currentBet} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Showdown Result Box - Moved COMPLETELY OFF the table onto the RIGHT-HAND SIDE */}
      <AnimatePresence>
        {gameState.stage === 'ended' && winner && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full sm:w-80 xl:w-72 p-4 rounded-2xl bg-[#0c0f22]/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.3)] backdrop-blur-xl text-center shrink-0 flex flex-col items-center justify-between z-30"
          >
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400/90 font-mono mb-1">
              Hand Showdown
            </div>
            <h3 className="text-sm sm:text-base font-black text-zinc-100 tracking-wide leading-snug">
              {winner.description}
            </h3>
            <p className="text-xs text-zinc-300 font-mono mt-1.5">
              Awarded <span className="font-bold text-amber-400">ZAR {formatChips(winner.amount)}</span> chips
            </p>

            <button
              onClick={() => startNewHand()}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              Deal Next Hand ➔
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
