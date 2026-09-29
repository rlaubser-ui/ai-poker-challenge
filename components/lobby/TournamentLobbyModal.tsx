'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerStore } from '@/store/usePokerStore';
import { SNG_OPPONENTS } from '@/lib/ai/personas/sng-personas';
import { BLIND_STRUCTURE, SNG_7MAX_PAYOUTS } from '@/types/tournament';
import { formatChips, formatCurrency } from '@/lib/utils/format';

interface TournamentLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchTable: () => void;
}

export const TournamentLobbyModal: React.FC<TournamentLobbyModalProps> = ({
  isOpen,
  onClose,
  onLaunchTable,
}) => {
  const { tournament, settings, registerForTournament } = usePokerStore();
  const [activeSubTab, setActiveSubTab] = useState<'INFO' | 'STRUCTURE' | 'PAYOUTS' | 'TABLES'>('INFO');
  const [playerSearch, setPlayerSearch] = useState('');

  if (!isOpen) return null;

  const isRegistered = tournament.isRegistered;
  const userBalance = settings.userBalance ?? 1000;

  const handleRegister = () => {
    registerForTournament();
    onLaunchTable();
  };

  const currentLevel = BLIND_STRUCTURE[tournament.currentLevelIndex] || BLIND_STRUCTURE[0];
  const registeredCount = isRegistered ? 7 : 6;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-[#0e1124] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* 1. Desktop Window Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#141834] text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-sans">
              <span className="text-purple-400 font-bold">♠</span>
              <span className="font-extrabold text-zinc-200">
                {tournament.name} - Tournament Lobby
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 font-mono">
              <button className="hover:text-zinc-200 px-1">—</button>
              <button className="hover:text-zinc-200 px-1">▢</button>
              <button
                onClick={onClose}
                className="hover:bg-red-600 hover:text-white px-2 py-0.5 rounded text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 2. Tournament Banner Header */}
          <div className="p-4 bg-gradient-to-r from-[#171b3c] via-[#121630] to-[#1c122c] border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-zinc-100 tracking-tight">
                  {tournament.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {isRegistered ? 'TABLE READY' : 'REGISTERING'}
                </span>
                <span className="text-xs font-bold text-zinc-400">NL HOLD&apos;EM</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300 mt-1">
                <span>
                  Buy-In:{' '}
                  <span className="text-amber-400 font-bold">
                    {tournament.buyInDisplay || 'ZAR 9 + ZAR 1'}
                  </span>
                </span>
                <span>•</span>
                <span>
                  Entries:{' '}
                  <span className="text-purple-300 font-bold">{registeredCount} of 7</span>
                </span>
                <span>•</span>
                <span>
                  Prize Pool:{' '}
                  <span className="text-emerald-400 font-bold">ZAR {tournament.prizePool}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isRegistered ? (
                <button
                  onClick={handleRegister}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white font-extrabold text-xs tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>REGISTER (ZAR 10)</span>
                  <span>➔</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onLaunchTable}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 font-black text-xs tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse"
                  >
                    <span>OPEN TABLE WINDOW</span>
                    <span>↗</span>
                  </button>
                  <a
                    href="/table"
                    className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                  >
                    Play in Tab
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 3. Key Stat Boxes (PokerBet style) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#0a0c18] border-b border-zinc-800/80 text-xs font-mono">
            <div className="p-2 rounded-lg bg-[#111429] border border-zinc-800/60">
              <div className="text-[10px] text-zinc-500 uppercase">ACTIVE PLAYERS</div>
              <div className="text-sm font-bold text-zinc-200 mt-0.5">{registeredCount} of 7</div>
            </div>
            <div className="p-2 rounded-lg bg-[#111429] border border-zinc-800/60">
              <div className="text-[10px] text-zinc-500 uppercase">BLINDS</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {currentLevel.smallBlind} / {currentLevel.bigBlind} (Ante {currentLevel.ante})
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[#111429] border border-zinc-800/60">
              <div className="text-[10px] text-zinc-500 uppercase">STARTING CHIPS</div>
              <div className="text-sm font-bold text-zinc-200 mt-0.5">{formatChips(1000)}</div>
            </div>
            <div className="p-2 rounded-lg bg-[#111429] border border-zinc-800/60">
              <div className="text-[10px] text-zinc-500 uppercase">SPEED / CLOCK</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5">Turbo (3 Min)</div>
            </div>
          </div>

          {/* 4. Split Body: Details Sub-Tabs on Left, Players Waiting on Right */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[340px]">
            {/* Left 7 Columns: Sub-Tabs & Content */}
            <div className="md:col-span-7 border-r border-zinc-800 flex flex-col overflow-hidden">
              {/* Sub-Tabs: INFO | STRUCTURE | PAYOUTS */}
              <div className="flex items-center border-b border-zinc-800 bg-[#12152a] px-2">
                {(['INFO', 'STRUCTURE', 'PAYOUTS'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-4 py-2 font-bold text-xs tracking-wider border-b-2 transition-all ${
                      activeSubTab === tab
                        ? 'border-purple-500 text-purple-300 bg-[#1a1e3b]/50'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Sub-Tab Content */}
              <div className="p-4 overflow-y-auto flex-1 text-xs text-zinc-300 bg-[#0c0e1e]">
                {activeSubTab === 'INFO' && (
                  <div className="space-y-3">
                    <div>
                      <div className="font-bold text-zinc-100 text-xs mb-1">STARTING CHIPS</div>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        The buy-in for this tournament is ZAR 10 (1 000 chips): ZAR 9 goes to the prize pool and ZAR 1 is the tournament fee.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
                      <div>
                        <div className="text-zinc-500 text-[10px] uppercase">PLAYERS PER TABLE</div>
                        <div className="text-zinc-200 font-semibold text-[11px]">7 players (7-Max)</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-[10px] uppercase">TIME BANK / SHOT CLOCK</div>
                        <div className="text-zinc-200 font-semibold text-[11px]">15 seconds per turn</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-[10px] uppercase">BLIND INTERVALS</div>
                        <div className="text-zinc-200 font-semibold text-[11px]">Blinds increase every 3 minutes</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-[10px] uppercase">RE-ENTRY & RE-BUY</div>
                        <div className="text-zinc-200 font-semibold text-[11px]">Freezeout (No Re-entry)</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800">
                      <div className="text-zinc-500 text-[10px] uppercase mb-1">TABLE HUD FEATURES</div>
                      <p className="text-zinc-400 text-[11px]">
                        Features mucked card reveal on folds, customizable 4-color and 2-color decks, and authentic PokerBet neon purple oval felt.
                      </p>
                    </div>
                  </div>
                )}

                {activeSubTab === 'STRUCTURE' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 text-[10px]">
                          <th className="py-1.5 px-2">LEVEL</th>
                          <th className="py-1.5 px-2">BLINDS</th>
                          <th className="py-1.5 px-2">ANTE</th>
                          <th className="py-1.5 px-2">LENGTH</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {BLIND_STRUCTURE.map((lvl) => (
                          <tr
                            key={lvl.level}
                            className={
                              lvl.level === currentLevel.level
                                ? 'bg-purple-950/40 text-purple-300 font-bold'
                                : 'hover:bg-zinc-900/40'
                            }
                          >
                            <td className="py-1 px-2">Level {lvl.level}</td>
                            <td className="py-1 px-2">{lvl.smallBlind} / {lvl.bigBlind}</td>
                            <td className="py-1 px-2">{lvl.ante}</td>
                            <td className="py-1 px-2">3 min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'PAYOUTS' && (
                  <div className="space-y-2">
                    <div className="text-zinc-400 text-[11px] mb-2">
                      Total Prize Pool: <span className="font-bold text-emerald-400">ZAR {tournament.prizePool}</span> (Top 2 Paid)
                    </div>
                    {SNG_7MAX_PAYOUTS.map((pay) => (
                      <div
                        key={pay.rank}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#13162c] border border-zinc-800 font-mono text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{pay.rank === 1 ? '🥇' : '🥈'}</span>
                          <span className="font-bold text-zinc-200">
                            {pay.rank === 1 ? '1st Place (70%)' : '2nd Place (30%)'}
                          </span>
                        </div>
                        <span className="font-bold text-amber-300 text-sm">
                          ZAR {pay.amount}.00
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Waiting Players Roster */}
            <div className="md:col-span-5 flex flex-col bg-[#090b16] overflow-hidden">
              <div className="p-2.5 border-b border-zinc-800 bg-[#111326] flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-200">
                  PLAYERS ({registeredCount} / 7)
                </span>
                <input
                  type="text"
                  placeholder="Search player..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500 w-28"
                />
              </div>

              {/* Registered Players List */}
              <div className="p-2 overflow-y-auto flex-1 space-y-1 font-mono text-xs">
                {/* 6 AI Opponents Waiting */}
                {SNG_OPPONENTS.filter(
                  (bot) => !playerSearch || bot.name.toLowerCase().includes(playerSearch.toLowerCase())
                ).map((bot, idx) => (
                  <div
                    key={bot.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#111429] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-zinc-500 w-3">{idx + 1}</span>
                      <span className="text-sm">{bot.avatar}</span>
                      <div className="truncate">
                        <div className="font-bold text-zinc-200 text-[11px] truncate">
                          {bot.name}
                        </div>
                        <div className="text-[9px] text-purple-400 font-sans">{bot.badge}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-bold text-amber-400">1 000</div>
                      <span className="text-[9px] text-emerald-400">Registered</span>
                    </div>
                  </div>
                ))}

                {/* Seat 7: Hero or Waiting */}
                <div
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isRegistered
                      ? 'bg-purple-950/40 border-purple-500/50'
                      : 'bg-zinc-950/60 border-dashed border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-zinc-500 w-3">7</span>
                    <span className="text-sm">{isRegistered ? '🤠' : '⏳'}</span>
                    <div>
                      <div className="font-bold text-zinc-200 text-[11px]">
                        {isRegistered ? 'You (Hero)' : 'Waiting for Player...'}
                      </div>
                      <div className="text-[9px] text-zinc-400 font-sans">
                        {isRegistered ? 'Human Player' : 'Open Seat'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold text-amber-400">
                      {isRegistered ? '1 000' : '—'}
                    </div>
                    <span className={isRegistered ? 'text-[9px] text-emerald-400' : 'text-[9px] text-amber-500'}>
                      {isRegistered ? 'Ready' : '1 Seat Open'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Footer with Account Balance and Registration Status */}
          <div className="px-4 py-3 border-t border-zinc-800 bg-[#12152a] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-zinc-400 font-mono">
              <span>
                Your Balance:{' '}
                <span className="font-bold text-emerald-400">
                  {formatCurrency(userBalance, 'ZAR', false)}
                </span>
              </span>
              <span>•</span>
              <span>Entry Fee: <span className="text-zinc-200 font-bold">ZAR 10</span></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Close
              </button>
              {!isRegistered ? (
                <button
                  onClick={handleRegister}
                  className="px-6 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  Buy-In & Register (ZAR 10)
                </button>
              ) : (
                <button
                  onClick={onLaunchTable}
                  className="px-6 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  Take Seat ➔
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
