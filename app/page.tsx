'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AIPersonaId } from '@/types/ai';
import { ActionControls } from '@/components/poker/ActionControls';
import { Table } from '@/components/poker/Table';
import { PERSONAS } from '@/lib/ai/personas';
import { usePokerStore } from '@/store/usePokerStore';

export default function PokerArenaPage() {
  const {
    gameState,
    initGame,
    selectedPersonaId,
    setPersona,
    lastAIResponse,
    handsPlayed,
    stats,
  } = usePokerStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <main className="flex flex-col min-h-screen bg-radial-gradient from-zinc-900 to-zinc-950 px-2 sm:px-4 py-3">
      {/* Top Header Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm">♠</span>
          </div>
          <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            AI Poker Challenge
          </h1>
        </div>

        {/* Persona Selector & Stats */}
        <div className="flex items-center gap-3">
          {/* Persona Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/60 rounded-xl px-3 py-1.5 shadow-inner">
            <span className="text-xs text-zinc-400">Opponent:</span>
            <select
              value={selectedPersonaId}
              onChange={(e) => setPersona(e.target.value as AIPersonaId)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              {Object.values(PERSONAS).map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-zinc-100">
                  {p.avatar} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Record */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <span className="text-zinc-400">Record:</span>
            <span className="text-emerald-400 font-bold">{stats.humanWins}W</span>
            <span className="text-zinc-600">-</span>
            <span className="text-red-400 font-bold">{stats.aiWins}L</span>
            <span className="text-zinc-500 ml-1">({handsPlayed} hands)</span>
          </div>
        </div>
      </header>

      {/* Main Poker Arena */}
      <section className="flex-1 flex flex-col justify-center items-center py-2">
        {/* Live AI Banter Bubble */}
        {lastAIResponse?.chat && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 max-w-lg px-4 py-2 rounded-2xl bg-zinc-900/90 border border-amber-500/30 shadow-xl flex items-center gap-2.5 text-xs sm:text-sm text-zinc-200"
          >
            <span className="text-base shrink-0">💬</span>
            <p className="italic font-medium">"{lastAIResponse.chat}"</p>
          </motion.div>
        )}

        {/* Master Poker Table */}
        <Table />

        {/* Player Betting Action Controls */}
        <ActionControls />
      </section>
    </main>
  );
}
