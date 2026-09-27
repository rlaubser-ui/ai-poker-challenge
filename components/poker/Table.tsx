'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CardView } from './CardView';
import { ChipStack } from './ChipStack';
import { PlayerSeat } from './PlayerSeat';
import { usePokerStore } from '@/store/usePokerStore';

export const Table: React.FC = () => {
  const { gameState, isAITurn } = usePokerStore();

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="text-zinc-500 font-medium">Initializing table...</div>
      </div>
    );
  }

  const human = gameState.players[0];
  const ai = gameState.players[1];
  const dealerIdx = gameState.dealerIndex;
  const activeIdx = gameState.activePlayerIndex;
  const winner = gameState.winners?.[0];
  const winningCards = winner?.bestFiveCards || [];

  return (
    <div className="relative w-full max-w-4xl mx-auto my-4 px-2">
      {/* Outer Casino Table Rail (Wood/Leather Trim) */}
      <div className="relative w-full rounded-[100px] sm:rounded-[150px] p-4 sm:p-7 bg-gradient-to-b from-stone-900 via-zinc-950 to-stone-900 border-8 border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_4px_12px_rgba(255,255,255,0.05)]">
        {/* Inner Green Felt Table Oval */}
        <div className="relative w-full min-h-[500px] sm:min-h-[560px] rounded-[80px] sm:rounded-[120px] bg-gradient-to-b from-emerald-800 via-emerald-900 to-emerald-950 border-4 border-amber-500/20 shadow-[inset_0_0_100px_rgba(0,0,0,0.85)] flex flex-col justify-between items-center py-6 px-4 overflow-hidden">
          {/* Subtle Casino Table Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-9xl font-serif font-black text-amber-300">
              ♠
            </span>
          </div>

          {/* AI Opponent Seat (Top) */}
          <div className="z-10">
            <PlayerSeat
              player={ai}
              isDealer={dealerIdx === 1}
              isActive={activeIdx === 1 && !isAITurn && gameState.stage !== 'ended'}
              isHuman={false}
              revealHoleCards={gameState.stage === 'ended'}
              winningCards={winningCards}
            />
          </div>

          {/* Community Cards & Pot Center Area */}
          <div className="flex flex-col items-center gap-3.5 my-auto z-10">
            {/* Pot Badge */}
            <ChipStack
              amount={gameState.pot}
              label="POT"
              size="lg"
              className="bg-zinc-950/90 border-amber-400/60 shadow-2xl"
            />

            {/* Community Board (5 Card Slots) */}
            <div className="flex items-center gap-2 sm:gap-3">
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
                    className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-dashed border-emerald-600/30 bg-emerald-950/20 flex items-center justify-center"
                  >
                    <span className="text-emerald-700/40 text-xl font-serif">
                      ♠
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Stage Indicator Badge */}
            <div className="px-3 py-1 rounded-full bg-black/40 border border-emerald-400/20 text-[11px] font-bold tracking-widest text-emerald-300/80 uppercase">
              {gameState.stage}
            </div>
          </div>

          {/* Human Player Seat (Bottom) */}
          <div className="z-10">
            <PlayerSeat
              player={human}
              isDealer={dealerIdx === 0}
              isActive={activeIdx === 0 && !isAITurn && gameState.stage !== 'ended'}
              isHuman={true}
              revealHoleCards={true}
              winningCards={winningCards}
            />
          </div>

          {/* Showdown Result Overlay Banner */}
          {gameState.stage === 'ended' && winner && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center bg-zinc-950/95 border-2 border-amber-400/80 rounded-3xl p-5 shadow-[0_0_50px_rgba(212,175,55,0.3)] backdrop-blur-lg max-w-md mx-auto text-center"
            >
              <div className="text-2xl mb-1">
                {winner.playerId.includes('ai') ? '🤖' : '🏆'}
              </div>
              <h3 className="text-xl font-black text-amber-300 tracking-tight">
                {winner.description}
              </h3>
              <p className="text-zinc-300 font-mono text-sm mt-1">
                Awarded <span className="text-amber-400 font-bold">${winner.amount.toLocaleString()}</span> to pot winner
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
