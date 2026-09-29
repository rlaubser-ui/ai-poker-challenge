'use client';

import React, { useState } from 'react';
import { usePokerStore } from '@/store/usePokerStore';

interface TournamentListProps {
  onOpenTournamentLobby: () => void;
  onLaunchTable: () => void;
}

export const TournamentList: React.FC<TournamentListProps> = ({
  onOpenTournamentLobby,
  onLaunchTable,
}) => {
  const [selectedGameTab, setSelectedGameTab] = useState<'SIT & GO' | 'TOURNAMENTS' | 'CASH GAMES' | 'SPIN&GO' | 'QUICK SEAT'>('SIT & GO');
  const [speedFilter, setSpeedFilter] = useState<'All' | 'Turbo' | 'Hyper'>('All');
  const { tournament } = usePokerStore();

  const isRegistered = tournament.isRegistered;
  const registeredCount = isRegistered ? 7 : 6;

  return (
    <div className="w-full flex flex-col flex-1 bg-[#0c0e1e] select-none text-xs">
      {/* 1. Main Navigation Game Category Tabs (PokerBet Style) */}
      <div className="flex items-center px-4 bg-[#111326] border-b border-zinc-800 overflow-x-auto">
        {(['QUICK SEAT', 'CASH GAMES', 'SPIN&GO', 'TOURNAMENTS', 'SIT & GO'] as const).map(
          (tab) => {
            const isActive = selectedGameTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedGameTab(tab)}
                className={`px-5 py-3 font-black tracking-wider text-xs whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                  isActive
                    ? 'border-fuchsia-500 text-fuchsia-300 bg-[#191d3d]/70 shadow-sm'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                {tab === 'SIT & GO' && <span className="text-amber-400">★</span>}
                <span>{tab}</span>
              </button>
            );
          }
        )}
      </div>

      {/* 2. Sub-Filters Bar (Game, Type, Buy-in) */}
      <div className="px-4 py-2 bg-[#090b16] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px]">Game:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold text-[11px]">
              NL Hold&apos;em
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px]">Speed:</span>
            <div className="flex rounded-lg overflow-hidden border border-zinc-800">
              {(['All', 'Turbo', 'Hyper'] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedFilter(spd)}
                  className={`px-2 py-0.5 text-[11px] font-bold ${
                    speedFilter === spd
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Showing 3 active events • 1 available for registration
        </div>
      </div>

      {/* 3. Tournament List Table */}
      <div className="flex-1 overflow-x-auto p-3">
        <table className="w-full text-left font-sans text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#121528] text-zinc-400 text-[11px] font-bold tracking-wider uppercase">
              <th className="py-2.5 px-3">Start Date</th>
              <th className="py-2.5 px-3">Game</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Buy-In</th>
              <th className="py-2.5 px-3">Tournament Name</th>
              <th className="py-2.5 px-3">Prize Pool</th>
              <th className="py-2.5 px-3">Reg</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {/* Primary Event: 7-Seater Turbo Sit & Go */}
            <tr
              onClick={onOpenTournamentLobby}
              className="bg-[#151936]/80 hover:bg-[#1a1f44] cursor-pointer transition-all border-l-4 border-l-fuchsia-500 group shadow-md"
            >
              <td className="py-3 px-3 font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Starting Soon</span>
              </td>
              <td className="py-3 px-3 text-zinc-300 font-semibold">NL Hold&apos;em</td>
              <td className="py-3 px-3 text-purple-300 font-bold font-mono">Turbo (7-Max)</td>
              <td className="py-3 px-3 font-mono font-black text-amber-300">
                ZAR 9 + ZAR 1
              </td>
              <td className="py-3 px-3 font-black text-zinc-100 group-hover:text-fuchsia-300 transition-colors">
                <div className="flex items-center gap-2">
                  <span>{tournament.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/40 text-[9px] uppercase font-bold">
                    Featured
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 font-mono font-black text-emerald-400">
                ZAR {tournament.prizePool}
              </td>
              <td className="py-3 px-3 font-mono font-bold text-zinc-200">
                <span className={registeredCount === 7 ? 'text-emerald-400' : 'text-amber-400'}>
                  {registeredCount}
                </span>
                <span className="text-zinc-500"> / 7</span>
              </td>
              <td className="py-3 px-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isRegistered
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/40'
                  }`}
                >
                  {isRegistered ? 'Table Ready' : 'Registering'}
                </span>
              </td>
              <td className="py-3 px-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isRegistered) {
                      onLaunchTable();
                    } else {
                      onOpenTournamentLobby();
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black shadow-sm transition-all ${
                    isRegistered
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 animate-pulse'
                      : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                  }`}
                >
                  {isRegistered ? 'Take Seat ↗' : 'Lobby ➔'}
                </button>
              </td>
            </tr>

            {/* Event 2: Hyper SNG */}
            <tr className="hover:bg-zinc-900/40 opacity-70 transition-colors">
              <td className="py-3 px-3 font-mono text-zinc-400">In 15 min</td>
              <td className="py-3 px-3 text-zinc-300">NL Hold&apos;em</td>
              <td className="py-3 px-3 text-cyan-400 font-mono">Hyper (7-Max)</td>
              <td className="py-3 px-3 font-mono text-zinc-300">ZAR 18 + ZAR 2</td>
              <td className="py-3 px-3 text-zinc-300 font-bold">
                ZAR 140 GTD | (7 Seater Hyper SNG)
              </td>
              <td className="py-3 px-3 font-mono text-emerald-400">ZAR 140</td>
              <td className="py-3 px-3 font-mono text-zinc-400">3 / 7</td>
              <td className="py-3 px-3">
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold">
                  Registering
                </span>
              </td>
              <td className="py-3 px-3 text-right">
                <button
                  onClick={onOpenTournamentLobby}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  View
                </button>
              </td>
            </tr>

            {/* Event 3: Completed Sit & Go */}
            <tr className="hover:bg-zinc-900/40 opacity-40 transition-colors">
              <td className="py-3 px-3 font-mono text-zinc-500">Completed</td>
              <td className="py-3 px-3 text-zinc-400">NL Hold&apos;em</td>
              <td className="py-3 px-3 text-zinc-400 font-mono">Turbo (7-Max)</td>
              <td className="py-3 px-3 font-mono text-zinc-400">ZAR 9 + ZAR 1</td>
              <td className="py-3 px-3 text-zinc-400 font-bold">
                ZAR 70 GTD | (7 Seater Turbo SNG)
              </td>
              <td className="py-3 px-3 font-mono text-zinc-400">ZAR 70</td>
              <td className="py-3 px-3 font-mono text-zinc-500">7 / 7</td>
              <td className="py-3 px-3">
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 text-[10px] uppercase font-bold">
                  Finished
                </span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-zinc-600 text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Info Banner */}
      <div className="p-3 bg-[#0a0c18] border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span>Click any row to inspect tournament details and waiting players.</span>
          <span>•</span>
          <span className="text-purple-400 font-bold">6 AI Opponents are waiting in the Turbo 7-Max lobby!</span>
        </div>
        <button
          onClick={onOpenTournamentLobby}
          className="text-amber-400 hover:underline font-bold"
        >
          Open Tournament Lobby ➔
        </button>
      </div>
    </div>
  );
};
