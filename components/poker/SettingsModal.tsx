'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReasoningVisibility } from '@/types/settings';
import { usePokerStore } from '@/store/usePokerStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, resetBankroll } = usePokerStore();

  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || '');
  const [claudeKey, setClaudeKey] = useState(settings.apiKeys.anthropic || '');
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys.openai || '');
  const [visibility, setVisibility] = useState<ReasoningVisibility>(
    settings.reasoningVisibility
  );

  const [showKeys, setShowKeys] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSave = () => {
    updateSettings({
      reasoningVisibility: visibility,
      apiKeys: {
        gemini: geminiKey.trim() || undefined,
        anthropic: claudeKey.trim() || undefined,
        openai: openaiKey.trim() || undefined,
      },
    });

    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
      onClose();
    }, 500);
  };

  const handleResetChips = () => {
    if (confirm('Reset bankrolls back to $1,000 and clear win/loss records?')) {
      resetBankroll();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-zinc-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h2 className="font-extrabold text-lg text-zinc-100">
                  Settings & API Keys
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* AI Reasoning Visibility */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                AI Reasoning ("Thinking") Visibility
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs font-semibold">
                {(['live', 'showdown', 'hidden'] as ReasoningVisibility[]).map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => setVisibility(opt)}
                      className={`py-2 rounded-lg capitalize transition-all ${
                        visibility === opt
                          ? 'bg-amber-500 text-zinc-950 font-black shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>
              <span className="text-[11px] text-zinc-500">
                {visibility === 'live' && 'View the AI\'s internal probabilities and calculations in real time.'}
                {visibility === 'showdown' && 'Reveal the AI\'s reasoning only when cards are revealed at hand completion.'}
                {visibility === 'hidden' && 'Keep internal reasoning completely hidden like classic poker.'}
              </span>
            </div>

            {/* API Keys Configuration */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Custom Model API Keys (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys ? 'Hide Keys' : 'Show Keys'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-[11px] text-zinc-400">Gemini API Key:</span>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-zinc-400">Anthropic Claude Key:</span>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="sk-ant-..."
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-zinc-400">OpenAI Key:</span>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <p className="text-[10px] text-zinc-500 leading-normal">
                🔒 Keys are saved strictly in your browser's LocalStorage and sent only for your AI turns. Leave blank to use server environment keys or play offline with Mock Bot.
              </p>
            </div>

            {/* Bankroll Management */}
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-zinc-400">Bankroll Reset:</span>
              <button
                type="button"
                onClick={handleResetChips}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs font-bold transition-all"
              >
                Reset to $1,000 Chips
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-sm tracking-wide shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                {saveFeedback ? '✓ Settings Saved!' : 'Save & Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
