'use client';

import React, { useState } from 'react';
import { LobbyHeader } from '@/components/lobby/LobbyHeader';
import { TournamentList } from '@/components/lobby/TournamentList';
import { TournamentLobbyModal } from '@/components/lobby/TournamentLobbyModal';
import { usePokerStore } from '@/store/usePokerStore';

export default function LobbyPage() {
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
  const { tournament } = usePokerStore();

  const launchTableWindow = () => {
    if (typeof window === 'undefined') return;

    const width = 1280;
    const height = 820;
    const left = window.screen.width ? Math.max(0, (window.screen.width - width) / 2) : 100;
    const top = window.screen.height ? Math.max(0, (window.screen.height - height) / 2) : 50;

    const popup = window.open(
      '/table',
      'PokerBetTableWindow',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // If browser blocked popup window, navigate to /table in same window
      window.location.href = '/table';
    } else {
      popup.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col justify-between font-sans select-none">
      {/* 1. PokerBet Desktop Client Header */}
      <LobbyHeader />

      {/* 2. Main Lobby Tournament Listings & SNG Browser */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-2 sm:p-4">
        {/* Quick Hero Banner */}
        <div className="mb-3 p-4 rounded-2xl bg-gradient-to-r from-[#171b3e] via-[#15122e] to-[#251036] border border-purple-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wider">
                Live Challenge
              </span>
              <span className="text-zinc-400 text-xs">7-Max Turbo Sit &amp; Go</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Challenge 6 Distinct AI Personas in Turbo Hold&apos;em
            </h1>
            <p className="text-zinc-400 text-xs mt-1 max-w-xl">
              Buy in for ZAR 10, compete for the ZAR 70 prize pool, survive 3-minute turbo blind increases, and review opponent mucked cards in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLobbyModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-purple-950/50 transition-all flex items-center gap-2"
            >
              <span>{tournament.isRegistered ? 'Table Ready ➔' : 'View Tournament Lobby'}</span>
              <span>➔</span>
            </button>
            <button
              onClick={launchTableWindow}
              className="px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
              title="Launch Pop-out Table Window directly"
            >
              <span>🪟</span>
              <span>Pop-out Table</span>
            </button>
          </div>
        </div>

        {/* 3. Sit & Go Tournament Browser Grid */}
        <div className="flex-1 rounded-2xl border border-zinc-800 bg-[#0c0e1e] overflow-hidden shadow-2xl flex flex-col">
          <TournamentList
            onOpenTournamentLobby={() => setIsLobbyModalOpen(true)}
            onLaunchTable={launchTableWindow}
          />
        </div>
      </main>

      {/* 4. Desktop Client Bottom Status Bar */}
      <footer className="w-full bg-[#0a0c18] border-t border-zinc-900 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-3">
          <span>● Server Online (38ms)</span>
          <span>•</span>
          <span>Version 1.4.0-sng</span>
          <span>•</span>
          <span>Currencies: ZAR</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/table" className="text-purple-400 hover:text-purple-300 font-bold">
            Direct Table Link
          </a>
          <span>Responsible Gaming 18+</span>
        </div>
      </footer>

      {/* 5. Tournament Lobby Window (Modal View with 6 Waiting AI Opponents) */}
      <TournamentLobbyModal
        isOpen={isLobbyModalOpen}
        onClose={() => setIsLobbyModalOpen(false)}
        onLaunchTable={launchTableWindow}
      />
    </div>
  );
}
