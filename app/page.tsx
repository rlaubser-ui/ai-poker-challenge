'use client';

import React, { useEffect, useState } from 'react';
import { ActionControls } from '@/components/poker/ActionControls';
import { BanterBox } from '@/components/poker/BanterBox';
import { SettingsModal } from '@/components/poker/SettingsModal';
import { Table } from '@/components/poker/Table';
import { TournamentHeader } from '@/components/poker/TournamentHeader';
import { TournamentSummaryModal } from '@/components/poker/TournamentSummaryModal';
import { usePokerStore } from '@/store/usePokerStore';

export default function PokerArenaPage() {
  const {
    gameState,
    initTournament,
    tournament,
    handsPlayed,
    stats,
    settings,
    updateSettings,
    restartTournament,
  } = usePokerStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!gameState) {
      initTournament();
    }
  }, [gameState, initTournament]);

  return (
    <main className="flex flex-col min-h-screen bg-radial-gradient from-zinc-900 to-zinc-950 px-2 sm:px-4 py-2 sm:py-3">
      {/* Top Header Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm">♠</span>
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-xl tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              AI Poker Challenge
            </h1>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline-block">
              Turbo Sit & Go Series • 7-Max
            </span>
          </div>
        </div>

        {/* Tournament Stats & Settings */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Trophies & Record */}
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              🏆 {stats.firstPlaceFinishes || 0}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400 font-bold">{stats.humanWins}W</span>
            <span className="text-zinc-600">-</span>
            <span className="text-red-400 font-bold">{stats.aiWins}L</span>
            <span className="text-zinc-500 ml-1 hidden md:inline">({handsPlayed} hands)</span>
          </div>

          {/* Quick Restart Tournament Button */}
          <button
            onClick={() => {
              if (confirm('Restart current tournament with 1,000 starting chips?')) {
                restartTournament();
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-semibold transition-all shadow-sm flex items-center gap-1"
            title="Restart Tournament"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">New SNG</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors shadow-sm text-xs"
            title="Settings & Audio"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Tournament Arena */}
      <section className="flex-1 flex flex-col justify-center items-center py-1 sm:py-2 w-full max-w-5xl mx-auto">
        {/* Tournament HUD / Header with 3-minute Turbo Blind Clock */}
        <TournamentHeader />

        {/* 7-Max Stadium Poker Table */}
        <Table />

        {/* Player Betting Action Controls */}
        <ActionControls />

        {/* Live Banter & Dialogue History */}
        <div className="w-full mt-2">
          <BanterBox />
        </div>
      </section>

      {/* Tournament Finish / Elimination Summary Modal */}
      <TournamentSummaryModal />

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}
