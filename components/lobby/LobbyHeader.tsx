'use client';

import React from 'react';
import { usePokerStore } from '@/store/usePokerStore';
import { formatCurrency } from '@/lib/utils/format';

export const LobbyHeader: React.FC = () => {
  const { settings, updateSettings } = usePokerStore();
  const userBalance = settings.userBalance ?? 1000;

  const handleDeposit = () => {
    updateSettings({ userBalance: userBalance + 500 });
  };

  return (
    <header className="w-full bg-[#0a0c18] border-b border-zinc-800/80 flex flex-col select-none text-xs">
      {/* 1. Desktop Window Frame Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0f1224] border-b border-zinc-900 text-[11px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5 font-sans font-semibold text-zinc-300">
          <span className="text-red-500 font-black">♠</span>
          <span>pokerbet - Poker Client</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="hover:text-zinc-200 px-1">—</button>
          <button className="hover:text-zinc-200 px-1">▢</button>
          <button className="hover:bg-red-600 hover:text-white px-2 py-0.5 rounded transition-colors">✕</button>
        </div>
      </div>

      {/* 2. Main PokerBet Client Navbar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#111429]">
        {/* Logo and Main Nav */}
        <div className="flex items-center gap-6">
          {/* PokerBet Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-red-900/40">
              ♠
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg text-white tracking-wider leading-none">
                pokerbet
              </span>
              <span className="text-[8px] font-bold text-red-400 tracking-widest uppercase">
                Challenge Arena
              </span>
            </div>
          </div>

          {/* Quick Utility Links */}
          <div className="hidden lg:flex items-center gap-4 text-zinc-400 text-xs font-semibold">
            <button className="hover:text-zinc-200 flex items-center gap-1 transition-colors">
              <span>⚙</span> Preferences
            </button>
            <button className="hover:text-zinc-200 flex items-center gap-1 transition-colors">
              <span>❓</span> Help
            </button>
            <button className="hover:text-zinc-200 flex items-center gap-1 transition-colors">
              <span>💬</span> Online Support
            </button>
            <span className="text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[10px] font-mono">
              ENG ▾
            </span>
          </div>
        </div>

        {/* User Account Bar (Matching PokerBet Screenshot) */}
        <div className="flex items-center gap-3">
          {/* Missions and Leaderboards */}
          <div className="hidden sm:flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors">
              <span>🎯</span> Missions
            </button>
            <button className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-purple-300 border border-purple-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors">
              <span>🏆</span> Leaderboards
            </button>
          </div>

          {/* Balance & Profile Badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-900 border border-purple-500/40 flex items-center justify-center text-sm shadow-md">
              🤠
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-extrabold text-xs text-zinc-100">TopGunner (Hero)</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300">
                <span>{formatCurrency(userBalance, 'ZAR', true)}</span>
              </div>
            </div>

            {/* Quick Deposit '+' Button */}
            <button
              onClick={handleDeposit}
              className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-950/40 transition-transform active:scale-95 ml-1"
              title="Add ZAR 500 Demo Bankroll"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
