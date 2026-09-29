'use client';

import React, { useState } from 'react';
import { usePokerStore } from '@/store/usePokerStore';
import { BLIND_STRUCTURE } from '@/types/tournament';
import { formatChips } from '@/lib/utils/format';

export const TableLogDrawer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'HANDS' | 'NOTES' | 'INFO'>('CHAT');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { banterLog, gameState, tournament } = usePokerStore();

  const currentLevel = BLIND_STRUCTURE[tournament.currentLevelIndex] || BLIND_STRUCTURE[0];
  const minutes = Math.floor(tournament.secondsRemaining / 60);
  const seconds = tournament.secondsRemaining % 60;
  const formattedNextLevel = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0f1e]/95 backdrop-blur-md shadow-2xl flex flex-col text-xs text-zinc-300">
      {/* Header Tabs matching PokerBet: CHAT | HANDS | NOTES | INFO */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#121528] px-1">
        <div className="flex items-center">
          {(['CHAT', 'HANDS', 'NOTES', 'INFO'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 font-bold tracking-wider text-[11px] transition-all border-b-2 ${
                activeTab === tab && !isCollapsed
                  ? 'border-purple-500 text-purple-300 bg-[#1c203c]/60'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Collapse / Expand Toggle Arrow */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-xs font-mono"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>

      {/* Tab Contents */}
      {!isCollapsed && (
        <div className="p-2.5 h-36 overflow-y-auto font-mono text-[11px] space-y-1.5 bg-[#090b16]/90">
          {activeTab === 'CHAT' && (
            <div>
              {banterLog.length === 0 ? (
                <div className="text-zinc-600 italic py-2 text-center">Dealer: Welcome to the table. Shuffling...</div>
              ) : (
                banterLog.slice(-15).map((msg) => (
                  <div key={msg.id} className="leading-tight">
                    <span className={`font-bold ${msg.isAI ? 'text-purple-400' : 'text-amber-400'}`}>
                      {msg.sender}:{' '}
                    </span>
                    <span className="text-zinc-300">{msg.text}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'HANDS' && (
            <div className="space-y-1 text-zinc-400">
              <div className="text-zinc-300 font-bold border-b border-zinc-800 pb-1">
                Hand #{tournament.handNumber || 1} — Level {currentLevel.level} ({currentLevel.smallBlind}/{currentLevel.bigBlind})
              </div>
              {gameState?.winners && gameState.winners.length > 0 ? (
                <div className="text-emerald-400">
                  Last Winner:{' '}
                  {gameState.players.find((p) => p.id === gameState.winners?.[0].playerId)?.name || 'Player'}{' '}
                  ({gameState.winners[0].description})
                </div>
              ) : (
                <div className="text-zinc-500 italic">Hand currently in progress...</div>
              )}
              <div className="text-[10px] text-zinc-500">
                Pots: {formatChips(gameState?.pot || 0)} chips | Street: {gameState?.stage.toUpperCase()}
              </div>
            </div>
          )}

          {activeTab === 'NOTES' && (
            <div className="space-y-1 text-zinc-400">
              <div className="text-zinc-300 font-bold">Opponent Scouting Notes:</div>
              <div className="text-[10px] space-y-0.5">
                <div><span className="text-purple-400 font-bold">Viktor:</span> Tight-Aggressive (TAG). Three-bets premium hands.</div>
                <div><span className="text-purple-400 font-bold">Rex:</span> Loose-Aggressive (LAG). Bullies blinds relentlessly.</div>
                <div><span className="text-purple-400 font-bold">Larry:</span> Calling Station. Calls down wide with any pair.</div>
                <div><span className="text-purple-400 font-bold">Pete:</span> Nit / Rock. Only bets when holding nuts.</div>
                <div><span className="text-purple-400 font-bold">Sophia:</span> GTO Solver. Balanced ranges and pot odds bets.</div>
                <div><span className="text-purple-400 font-bold">Vince:</span> Maniac / Action Junkie. High variance overbets.</div>
              </div>
            </div>
          )}

          {activeTab === 'INFO' && (
            <div className="space-y-1 text-zinc-400 text-[11px]">
              <div><span className="text-zinc-500">Table ID:</span> #3447111</div>
              <div><span className="text-zinc-500">Tournament:</span> {tournament.name}</div>
              <div><span className="text-zinc-500">Blinds:</span> {currentLevel.smallBlind} / {currentLevel.bigBlind} (Ante: {currentLevel.ante})</div>
              <div><span className="text-zinc-500">Next Level:</span> in {formattedNextLevel}</div>
              <div><span className="text-zinc-500">Active Players:</span> {gameState?.players.filter(p => !p.isEliminated).length || 7} of 7</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
