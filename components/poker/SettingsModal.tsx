'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReasoningVisibility } from '@/types/settings';
import { usePokerStore } from '@/store/usePokerStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProviderTestState {
  loading: boolean;
  valid?: boolean;
  error?: string;
  models?: { id: string; name: string }[];
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

  const [customModels, setCustomModels] = useState<{
    gemini?: string;
    anthropic?: string;
    openai?: string;
  }>(settings.customModels || {});

  const [testState, setTestState] = useState<{
    gemini: ProviderTestState;
    anthropic: ProviderTestState;
    openai: ProviderTestState;
  }>({
    gemini: { loading: false },
    anthropic: { loading: false },
    openai: { loading: false },
  });

  const [showKeys, setShowKeys] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleTestKey = async (provider: 'gemini' | 'anthropic' | 'openai') => {
    const key =
      provider === 'gemini'
        ? geminiKey
        : provider === 'anthropic'
        ? claudeKey
        : openaiKey;

    if (!key.trim()) {
      setTestState((prev) => ({
        ...prev,
        [provider]: { loading: false, valid: false, error: 'Please enter an API key first.' },
      }));
      return;
    }

    setTestState((prev) => ({
      ...prev,
      [provider]: { loading: true, error: undefined, valid: undefined },
    }));

    try {
      const res = await fetch('/api/poker/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: key }),
      });

      const data = await res.json();

      if (data.valid) {
        setTestState((prev) => ({
          ...prev,
          [provider]: { loading: false, valid: true, models: data.models },
        }));

        // Set default model if not already selected
        if (!customModels[provider] && data.models?.length > 0) {
          setCustomModels((prev) => ({
            ...prev,
            [provider]: data.models[0].id,
          }));
        }
      } else {
        let rawError = data.error || 'Failed to authenticate key.';
        try {
          if (typeof rawError === 'string' && rawError.startsWith('{')) {
            const parsed = JSON.parse(rawError);
            rawError = parsed?.error?.message || parsed?.message || rawError;
          }
        } catch {}

        setTestState((prev) => ({
          ...prev,
          [provider]: {
            loading: false,
            valid: false,
            error: rawError,
          },
        }));
      }
    } catch (err: any) {
      setTestState((prev) => ({
        ...prev,
        [provider]: {
          loading: false,
          valid: false,
          error: err?.message || 'Network error while testing connection.',
        },
      }));
    }
  };

  const handleSave = () => {
    updateSettings({
      reasoningVisibility: visibility,
      apiKeys: {
        gemini: geminiKey.trim() || undefined,
        anthropic: claudeKey.trim() || undefined,
        openai: openaiKey.trim() || undefined,
      },
      customModels: {
        gemini: customModels.gemini || undefined,
        anthropic: customModels.anthropic || undefined,
        openai: customModels.openai || undefined,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-zinc-200 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h2 className="font-extrabold text-lg text-zinc-100">
                  Settings & AI Models
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
            <div className="flex flex-col gap-1.5">
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
            </div>

            {/* API Keys & Model Selectors */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Provider Connection & Model Selection
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys ? 'Hide Keys' : 'Show Keys'}
                </button>
              </div>

              {/* 1. Google Gemini Provider */}
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                  <span>Google Gemini</span>
                  {testState.gemini.valid && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      ✓ Connection Good!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      setTestState((prev) => ({ ...prev, gemini: { loading: false } }));
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    disabled={testState.gemini.loading || !geminiKey.trim()}
                    onClick={() => handleTestKey('gemini')}
                    className="px-3.5 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-500/40 text-blue-200 text-xs font-bold disabled:opacity-40 shrink-0"
                  >
                    {testState.gemini.loading ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {/* Gemini Error Message */}
                {testState.gemini.error && (
                  <div className="text-[11px] text-red-400 font-medium bg-red-950/40 border border-red-900/50 rounded-lg p-2 leading-relaxed">
                    ✕ {testState.gemini.error}
                  </div>
                )}

                {/* Gemini Model Selector - Unlocked after good connection */}
                {testState.gemini.valid && testState.gemini.models && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex flex-col gap-1 pt-2 border-t border-zinc-800"
                  >
                    <label className="text-[11px] font-bold text-zinc-400">
                      Select Gemini Model:
                    </label>
                    <select
                      value={customModels.gemini || testState.gemini.models[0]?.id}
                      onChange={(e) =>
                        setCustomModels((prev) => ({ ...prev, gemini: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 text-amber-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                    >
                      {testState.gemini.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>

              {/* 2. Anthropic Claude Provider */}
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Anthropic Claude</span>
                  {testState.anthropic.valid && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      ✓ Connection Good!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="sk-ant-..."
                    value={claudeKey}
                    onChange={(e) => {
                      setClaudeKey(e.target.value);
                      setTestState((prev) => ({ ...prev, anthropic: { loading: false } }));
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    disabled={testState.anthropic.loading || !claudeKey.trim()}
                    onClick={() => handleTestKey('anthropic')}
                    className="px-3.5 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-500/40 text-amber-200 text-xs font-bold disabled:opacity-40 shrink-0"
                  >
                    {testState.anthropic.loading ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {testState.anthropic.error && (
                  <div className="text-[11px] text-red-400 font-medium bg-red-950/40 border border-red-900/50 rounded-lg p-2 leading-relaxed">
                    ✕ {testState.anthropic.error}
                  </div>
                )}

                {testState.anthropic.valid && testState.anthropic.models && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex flex-col gap-1 pt-2 border-t border-zinc-800"
                  >
                    <label className="text-[11px] font-bold text-zinc-400">
                      Select Claude Model:
                    </label>
                    <select
                      value={customModels.anthropic || testState.anthropic.models[0]?.id}
                      onChange={(e) =>
                        setCustomModels((prev) => ({ ...prev, anthropic: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 text-amber-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                    >
                      {testState.anthropic.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>

              {/* 3. OpenAI Provider */}
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>OpenAI</span>
                  {testState.openai.valid && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      ✓ Connection Good!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => {
                      setOpenaiKey(e.target.value);
                      setTestState((prev) => ({ ...prev, openai: { loading: false } }));
                    }}
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    disabled={testState.openai.loading || !openaiKey.trim()}
                    onClick={() => handleTestKey('openai')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-200 text-xs font-bold disabled:opacity-40 shrink-0"
                  >
                    {testState.openai.loading ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {testState.openai.error && (
                  <div className="text-[11px] text-red-400 font-medium bg-red-950/40 border border-red-900/50 rounded-lg p-2 leading-relaxed">
                    ✕ {testState.openai.error}
                  </div>
                )}

                {testState.openai.valid && testState.openai.models && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 flex flex-col gap-1 pt-2 border-t border-zinc-800"
                  >
                    <label className="text-[11px] font-bold text-zinc-400">
                      Select OpenAI Model:
                    </label>
                    <select
                      value={customModels.openai || testState.openai.models[0]?.id}
                      onChange={(e) =>
                        setCustomModels((prev) => ({ ...prev, openai: e.target.value }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 text-amber-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                    >
                      {testState.openai.models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>

              <p className="text-[10px] text-zinc-500 leading-normal">
                🔒 Keys and selected models are stored securely in your browser's private LocalStorage.
              </p>
            </div>

            {/* Bankroll Management */}
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-zinc-400">Bankroll:</span>
              <button
                type="button"
                onClick={handleResetChips}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs font-bold transition-all"
              >
                Reset to $1,000 Chips
              </button>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-sm tracking-wide shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                {saveFeedback ? '✓ Settings & Models Saved!' : 'Save & Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
