'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePokerStore } from '@/store/usePokerStore';
import { Table } from '@/components/poker/Table';
import { ActionControls } from '@/components/poker/ActionControls';
import { TableLogDrawer } from '@/components/poker/TableLogDrawer';
import { CardThemeModal } from '@/components/poker/CardThemeModal';
import { TournamentSummaryModal } from '@/components/poker/TournamentSummaryModal';
import { BLIND_STRUCTURE } from '@/types/tournament';
import { pokerSFX } from '@/lib/audio/sfx';

export default function TablePage() {
  const {
    gameState,
    tournament,
    initTournament,
    tickTimer,
    isFastForward,
    toggleFastForward,
    settings,
    updateSettings,
  } = usePokerStore();

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [hasOpener, setHasOpener] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.opener) {
      setHasOpener(true);
    }
  }, []);

  // Initialize tournament game on load if none exists
  useEffect(() => {
    if (!gameState) {
      initTournament();
    }
  }, [gameState, initTournament]);

  // Run 1-second countdown clock for the 3-minute turbo levels
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimer]);

  const currentLevel = BLIND_STRUCTURE[tournament.currentLevelIndex] || BLIND_STRUCTURE[0];
  const minutes = Math.floor(tournament.secondsRemaining / 60);
  const seconds = tournament.secondsRemaining % 60;
  const formattedNextLevel = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      if (window.opener) {
        window.close();
      } else {
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-zinc-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* 1. Authentic PokerBet Desktop Window Title Bar */}
      <header className="w-full bg-[#0d0f1f] border-b border-zinc-800/80 px-3 py-1.5 flex items-center justify-between text-xs z-40 shadow-md">
        <div className="flex items-center gap-2 text-zinc-300 font-sans truncate">
          <span className="text-purple-400 font-black text-sm">♠</span>
          <span className="font-bold text-zinc-200 truncate">
            {tournament.name} - Table 3447111 - {currentLevel.smallBlind} / {currentLevel.bigBlind} - NL Hold&apos;em
          </span>
        </div>

        {/* Desktop Window Controls: Tile, Duplicate, Minimize, Maximize, Close */}
        <div className="flex items-center gap-2 text-zinc-400 font-mono shrink-0">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
            title="Card & Deck Themes"
          >
            <span>🎴</span>
            <span>Deck Themes</span>
          </button>

          <div className="h-3.5 w-[1px] bg-zinc-700/60 hidden sm:block mx-1" />

          <button className="hover:text-zinc-200 px-1" title="Tile Tables">
            ⊞
          </button>
          <button className="hover:text-zinc-200 px-1" title="Cascade Windows">
            ❐
          </button>
          <button className="hover:text-zinc-200 px-1" title="Minimize">
            —
          </button>
          <button className="hover:text-zinc-200 px-1" title="Maximize">
            ▢
          </button>
          <button
            onClick={handleClose}
            className="hover:bg-red-600 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
            title="Close Table Window"
          >
            ✕
          </button>
        </div>
      </header>

      {/* 2. Top In-Table Status & HUD Bar */}
      <div className="w-full px-3 py-1.5 bg-[#0a0c18] border-b border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">Hand ID: #372254751</span>
          <button
            onClick={() => {}}
            className="hover:text-zinc-200 transition-colors"
            title="Replay Previous Hand"
          >
            ↺ Replay
          </button>
          <button
            onClick={() => updateSettings({ isSoundMuted: !settings.isSoundMuted })}
            className="hover:text-zinc-200 transition-colors"
          >
            {settings.isSoundMuted ? '🔇 Muted' : '🔊 Sound'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-zinc-500">Current Level: </span>
            <span className="font-bold text-zinc-200">{currentLevel.level}</span>
          </div>
          <div>
            <span className="text-zinc-500">Next Level: </span>
            <span className="font-bold text-amber-300">{formattedNextLevel}</span>
          </div>
          <button
            onClick={toggleFastForward}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              isFastForward
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {isFastForward ? '⏩ Turbo On' : '⚡ Turbo Off'}
          </button>
        </div>
      </div>

      {/* 3. Main Oval Poker Table Arena */}
      <main className="flex-1 flex flex-col justify-center items-center py-2 px-1">
        <Table />
      </main>

      {/* 4. Bottom Controls: Tabbed Drawer on Left, 15s Action Controls in Center */}
      <footer className="w-full max-w-6xl mx-auto px-2 sm:px-4 pb-2 pt-1 flex flex-col md:flex-row items-end justify-between gap-3">
        {/* Left: PokerBet CHAT | HANDS | NOTES | INFO Tabbed Drawer */}
        <div className="w-full md:w-auto md:min-w-[320px]">
          <TableLogDrawer />
        </div>

        {/* Right: 15-Second Action Controls */}
        <div className="w-full md:flex-1 flex justify-center md:justify-end">
          <ActionControls />
        </div>
      </footer>

      {/* 5. Bottom Navigation Bar */}
      <div className="w-full bg-[#0a0c18] border-t border-zinc-900/80 px-4 py-1.5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          {hasOpener ? (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.opener?.focus();
              }}
              className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>↩</span> Tournament Lobby
            </button>
          ) : (
            <Link
              href="/"
              className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>↩</span> Main Lobby
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>Speed: Turbo (3 min)</span>
          <span>•</span>
          <span>Starting Stack: 1 000 chips</span>
          <span>•</span>
          <span>Prize Pool: ZAR 70</span>
        </div>
      </div>

      {/* Card & Deck Themes Modal */}
      <CardThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Tournament Finish & Summary Modal */}
      <TournamentSummaryModal />
    </div>
  );
}
