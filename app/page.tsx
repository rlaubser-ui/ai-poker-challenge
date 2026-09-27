'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CustomBot } from '@/types/ai';
import { ActionControls } from '@/components/poker/ActionControls';
import { BanterBox } from '@/components/poker/BanterBox';
import { CustomBotModal } from '@/components/poker/CustomBotModal';
import { SettingsModal } from '@/components/poker/SettingsModal';
import { Table } from '@/components/poker/Table';
import { ThinkingDrawer } from '@/components/poker/ThinkingDrawer';
import { usePokerStore } from '@/store/usePokerStore';

export default function PokerArenaPage() {
  const {
    initGame,
    selectedPersonaId,
    customBots,
    deleteCustomBot,
    setPersona,
    lastAIResponse,
    handsPlayed,
    stats,
    settings,
  } = usePokerStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomBotModalOpen, setIsCustomBotModalOpen] = useState(false);
  const [botToEdit, setBotToEdit] = useState<CustomBot | null>(null);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const currentCustomBot = customBots.find((b) => b.id === selectedPersonaId);

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

        {/* Persona Selector, Custom Bot Actions, Stats & Settings */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Opponent Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/60 rounded-xl px-2.5 py-1.5 shadow-inner">
            <span className="text-xs text-zinc-400 font-medium">Opponent:</span>
            <select
              value={selectedPersonaId}
              onChange={(e) => {
                if (e.target.value === '__new_bot__') {
                  setBotToEdit(null);
                  setIsCustomBotModalOpen(true);
                } else {
                  setPersona(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[190px] sm:max-w-[220px] truncate"
            >
              <optgroup label="Default AI Models">
                <option value="gemini" className="bg-zinc-900 text-zinc-100">
                  💎 Gemini ({settings.customModels?.gemini || '1.5 Flash'})
                </option>
                <option value="claude" className="bg-zinc-900 text-zinc-100">
                  🧠 Claude ({settings.customModels?.anthropic || '3.5 Sonnet'})
                </option>
                <option value="gpt" className="bg-zinc-900 text-zinc-100">
                  ⚡ GPT-4o ({settings.customModels?.openai || 'GPT-4o'})
                </option>
                <option value="mock" className="bg-zinc-900 text-zinc-100">
                  🤖 Mock Bot (Rule Engine)
                </option>
              </optgroup>

              {customBots.length > 0 && (
                <optgroup label="Custom Bots">
                  {customBots.map((bot) => (
                    <option key={bot.id} value={bot.id} className="bg-zinc-900 text-zinc-100">
                      {bot.avatar} {bot.name} ({bot.provider.toUpperCase()} • {bot.style})
                    </option>
                  ))}
                </optgroup>
              )}

              <option value="__new_bot__" className="bg-zinc-900 text-amber-400 font-bold">
                + Create Custom Bot...
              </option>
            </select>

            {/* Quick Action to Create Custom Bot */}
            <button
              onClick={() => {
                setBotToEdit(null);
                setIsCustomBotModalOpen(true);
              }}
              className="ml-1 text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-all shadow-sm"
              title="Create Custom Bot"
            >
              + Bot
            </button>

            {/* Edit / Delete buttons if current selection is custom */}
            {currentCustomBot && (
              <div className="flex items-center gap-1 ml-1 border-l border-zinc-700/60 pl-1.5">
                <button
                  onClick={() => {
                    setBotToEdit(currentCustomBot);
                    setIsCustomBotModalOpen(true);
                  }}
                  className="text-xs p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 transition-colors"
                  title="Edit Bot"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete custom bot "${currentCustomBot.name}"?`)) {
                      deleteCustomBot(currentCustomBot.id);
                    }
                  }}
                  className="text-xs p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Delete Bot"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          {/* Session Record */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <span className="text-zinc-400">Record:</span>
            <span className="text-emerald-400 font-bold">{stats.humanWins}W</span>
            <span className="text-zinc-600">-</span>
            <span className="text-red-400 font-bold">{stats.aiWins}L</span>
            <span className="text-zinc-500 ml-1">({handsPlayed} hands)</span>
          </div>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition-colors shadow-sm"
            title="Settings & API Keys"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Poker Arena */}
      <section className="flex-1 flex flex-col justify-center items-center py-2 w-full max-w-5xl mx-auto">
        {/* Live AI Banter Quick Bubble */}
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

        {/* Collapsible AI Thinking Process Drawer */}
        <ThinkingDrawer />

        {/* Live Banter & Dialogue History */}
        <div className="w-full mt-2">
          <BanterBox />
        </div>
      </section>

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Custom Bot Modal Dialog */}
      <CustomBotModal
        isOpen={isCustomBotModalOpen}
        onClose={() => {
          setIsCustomBotModalOpen(false);
          setBotToEdit(null);
        }}
        botToEdit={botToEdit}
      />
    </main>
  );
}
