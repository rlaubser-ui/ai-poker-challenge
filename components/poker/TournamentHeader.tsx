'use client';

import React, { useEffect, useState } from 'react';
import { BLIND_STRUCTURE } from '@/types/tournament';
import { usePokerStore } from '@/store/usePokerStore';
import { formatChips } from '@/lib/utils/format';

export const TournamentHeader: React.FC = () => {
  const {
    tournament,
    gameState,
    isFastForward,
    toggleFastForward,
    togglePauseTournament,
    tickTimer,
    settings,
    updateSettings,
    startNewHand,
  } = usePokerStore();

  // Run 1-second countdown clock for the 3-minute turbo levels
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimer]);

  const currentLevel = BLIND_STRUCTURE[tournament.currentLevelIndex] || BLIND_STRUCTURE[0];
  const nextLevel = BLIND_STRUCTURE[tournament.currentLevelIndex + 1];

  const minutes = Math.floor(tournament.secondsRemaining / 60);
  const seconds = tournament.secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.max(
    0,
    Math.min(100, (tournament.secondsRemaining / currentLevel.durationSeconds) * 100)
  );

  const activePlayers = gameState?.players.filter((p) => p.chips > 0 && !p.isEliminated) || [];
  const remainingCount = activePlayers.length;
  const avgStack = remainingCount > 0 ? Math.floor(7000 / remainingCount) : 1000;

  // Calculate Hero's rank by chip stack
  const humanPlayer = gameState?.players.find((p) => p.id === 'player_human');
  const humanChips = humanPlayer?.chips || 0;
  const sortedByChips = [...activePlayers].sort((a, b) => b.chips - a.chips);
  const heroRankIndex = sortedByChips.findIndex((p) => p.id === 'player_human');
  const heroRank = heroRankIndex >= 0 ? heroRankIndex + 1 : 'Busted';

  return (
    <div className="w-full max-w-5xl mx-auto mb-3 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-2.5 sm:p-3.5 backdrop-blur-md shadow-xl flex flex-col gap-2.5">
      {/* Top Bar: Tournament Title, Payout Info, and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs shadow-inner">
            🏆
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-zinc-100 tracking-tight flex items-center gap-1.5">
              <span>{tournament.name}</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-mono">
                Prize: ${tournament.prizePool}
              </span>
            </h2>
          </div>
        </div>

        {/* Payout Structure Badges */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
          <span className="text-zinc-400">Payouts:</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
            🥇 1st: $49 (70%)
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
            🥈 2nd: $21 (30%)
          </span>
        </div>

        {/* Quick Utility Toggles: Fast Forward, Sound, Pause, Deal Next Hand */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Deal Next Hand button if current hand ended and tournament is not complete */}
          {gameState?.stage === 'ended' && !tournament.isComplete && (
            <button
              onClick={() => startNewHand()}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs hover:from-amber-400 hover:to-yellow-400 transition-all shadow-md animate-pulse"
            >
              Deal Next Hand ➔
            </button>
          )}

          {/* Fast Forward Toggle */}
          <button
            onClick={toggleFastForward}
            className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
              isFastForward
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
            title="Fast Forward AI Turns"
          >
            <span>⏩</span>
            <span className="hidden sm:inline">Turbo AI</span>
          </button>

          {/* Mute Audio Toggle */}
          <button
            onClick={() => updateSettings({ isSoundMuted: !settings.isSoundMuted })}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700/60 text-zinc-300 hover:text-amber-400 transition-colors text-xs"
            title={settings.isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {settings.isSoundMuted ? '🔇' : '🔊'}
          </button>

          {/* Pause Clock Toggle */}
          <button
            onClick={togglePauseTournament}
            className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${
              tournament.isPaused
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
            title="Pause Blind Clock"
          >
            {tournament.isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
        </div>
      </div>

      {/* Bottom Bar: Blind Clock & Level Progress, Players Remaining, Average Stack */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Blind Clock Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 font-medium text-[11px]">
            <span>Level {currentLevel.level}</span>
            <span className={`font-mono font-bold ${tournament.secondsRemaining <= 30 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
              ⏱️ {formattedTime}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden my-1">
            <div
              className={`h-full transition-all duration-1000 ${
                tournament.secondsRemaining <= 30 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono font-bold text-zinc-200 text-[11px]">
            <span>Blinds: {currentLevel.smallBlind}/{currentLevel.bigBlind}</span>
            {currentLevel.ante > 0 && <span className="text-zinc-400">Ante: {currentLevel.ante}</span>}
          </div>
        </div>

        {/* Next Level Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 flex flex-col justify-between">
          <span className="text-zinc-400 text-[11px]">Next Blind Level</span>
          <div className="font-mono font-bold text-amber-300 text-sm">
            {nextLevel ? `${nextLevel.smallBlind} / ${nextLevel.bigBlind}` : 'MAX LEVEL'}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {nextLevel ? `in ${formattedTime}` : 'Tournament freezeout'}
          </span>
        </div>

        {/* Players Remaining & Average Stack */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 flex flex-col justify-between">
          <span className="text-zinc-400 text-[11px]">Players Remaining</span>
          <div className="font-mono font-bold text-zinc-100 text-sm flex items-center gap-1.5">
            <span className="text-emerald-400">{remainingCount}</span>
            <span className="text-zinc-500">/ 7</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            Avg Stack: <span className="text-zinc-200">{formatChips(avgStack)}</span>
          </span>
        </div>

        {/* Your Tournament Rank */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 flex flex-col justify-between">
          <span className="text-zinc-400 text-[11px]">Your Standing</span>
          <div className="font-mono font-bold text-sm flex items-center gap-1.5">
            {heroRank === 'Busted' ? (
              <span className="text-red-400">Busted</span>
            ) : (
              <span className={heroRank === 1 ? 'text-amber-400' : heroRank === 2 ? 'text-zinc-200' : 'text-emerald-400'}>
                {heroRank === 1 ? '🥇 1st' : heroRank === 2 ? '🥈 2nd' : heroRank === 3 ? '🥉 3rd' : `${heroRank}th`}
              </span>
            )}
            <span className="text-zinc-500 text-xs">of {remainingCount}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">
            Your Chips: <span className="text-amber-300 font-bold">{formatChips(humanChips)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
