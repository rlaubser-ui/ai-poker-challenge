'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePokerStore } from '@/store/usePokerStore';

export const TournamentSummaryModal: React.FC = () => {
  const { tournament, gameState, restartTournament } = usePokerStore();
  const [isDismissed, setIsDismissed] = useState(false);

  const human = gameState?.players.find((p) => p.id === 'player_human');
  const isHumanBusted = human?.isEliminated || (human && human.chips === 0 && gameState?.stage === 'ended');
  const isTournamentComplete = tournament.isComplete;

  // Show if tournament is completely over OR human busted and hasn't clicked spectate
  const shouldShow = (isTournamentComplete || isHumanBusted) && !isDismissed;

  if (!shouldShow) return null;

  const humanFinish = tournament.eliminations.find((e) => e.playerId === 'player_human');
  const rank = humanFinish ? humanFinish.rank : (tournament.winner?.id === 'player_human' ? 1 : 7);
  const prize = rank === 1 ? 49 : rank === 2 ? 21 : 0;
  const isWinner = rank === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-950 border-2 border-amber-500/80 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.3)] flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Decorative Golden Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Podium Icon */}
        <div className="text-5xl mb-2">
          {isWinner ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '💀'}
        </div>

        {/* Result Headline */}
        <h2 className="text-2xl font-black tracking-tight text-zinc-100">
          {isWinner ? (
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              TOURNAMENT CHAMPION!
            </span>
          ) : rank === 2 ? (
            <span className="text-zinc-200">Runner Up — 2nd Place!</span>
          ) : (
            <span className="text-red-400">Eliminated — {rank}th Place</span>
          )}
        </h2>

        <p className="text-zinc-400 text-xs font-medium mt-1">
          {tournament.name} • {tournament.handNumber} Hands Played
        </p>

        {/* Prize Money Badge */}
        <div className="my-4 px-6 py-2.5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-inner flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Prize Won</span>
          <span className={`text-2xl font-black font-mono ${prize > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {prize > 0 ? `+$${prize}.00` : '$0.00'}
          </span>
        </div>

        {/* Elimination / Standings List */}
        <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 my-2 max-h-48 overflow-y-auto text-left text-xs space-y-1.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            Tournament Standings:
          </span>
          {tournament.eliminations
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((elim) => (
              <div
                key={elim.playerId}
                className={`flex items-center justify-between p-1.5 rounded-lg font-mono text-[11px] ${
                  elim.playerId === 'player_human'
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold'
                    : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 font-bold w-5">#{elim.rank}</span>
                  <span>{elim.avatar}</span>
                  <span>{elim.name}</span>
                </div>
                <span className={elim.prize > 0 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                  {elim.prize > 0 ? `+$${elim.prize}` : '—'}
                </span>
              </div>
            ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 w-full">
          {/* If user busted but tournament is still going, let them spectate */}
          {!isTournamentComplete && (
            <button
              onClick={() => setIsDismissed(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700 shadow-md"
            >
              👁️ Spectate Table
            </button>
          )}

          {/* Start New Tournament */}
          <button
            onClick={() => {
              setIsDismissed(false);
              restartTournament();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-black tracking-wide transition-all shadow-lg shadow-amber-500/20"
          >
            Play Again ➔
          </button>
        </div>
      </motion.div>
    </div>
  );
};
