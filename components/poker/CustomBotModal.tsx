'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomBot } from '@/types/ai';
import { usePokerStore } from '@/store/usePokerStore';

interface CustomBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  botToEdit?: CustomBot | null;
}

const AVATAR_OPTIONS = [
  '🦈', '🦁', '🤖', '🎭', '🧠', '🤠', '🐍', '👑',
  '🦊', '⚡', '🕶️', '💰', '🃏', '🐉', '🧙‍♂️', '👾'
];

interface StrategyPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  promptSnippet: string;
}

const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: 'lag',
    name: 'Loose-Aggressive (Maniac)',
    badge: 'LAG',
    description: 'Plays a wide range of hands, bluffs frequently, and applies relentless pressure.',
    promptSnippet: 'You play Loose-Aggressive (LAG/Maniac). You play many starting hands, bluff frequently on scare cards, and apply relentless pressure by raising and three-betting.',
  },
  {
    id: 'tag',
    name: 'Tight-Aggressive (The Shark)',
    badge: 'TAG',
    description: 'Selects only premium hands preflop, then bets aggressively for maximum value.',
    promptSnippet: 'You play Tight-Aggressive (TAG/Shark). You are very selective preflop (folding weak unsuited hands), but once you enter a pot, you play aggressively for value and protect strong hands with solid raises.',
  },
  {
    id: 'rock',
    name: 'Tight-Passive (The Rock)',
    badge: 'Rock',
    description: 'Only enters pots with monster hands. Folds easily to aggression unless holding the nuts.',
    promptSnippet: 'You play Tight-Passive (Rock/Nit). You only play premium starting cards (high pocket pairs, AK, AQ). You rarely bluff and will fold to aggression unless you have top pair with top kicker or better.',
  },
  {
    id: 'trapper',
    name: 'Tricky / Trapper',
    badge: 'Trapper',
    description: 'Slowplays big hands to induce bluffs, check-raising on later streets.',
    promptSnippet: 'You are a deceptive trapper. When you hit monster hands (sets, flushes, two pair), you check the flop to induce bluffs, then check-raise the turn or shove the river.',
  },
  {
    id: 'gto',
    name: 'Balanced (GTO Wizard)',
    badge: 'GTO',
    description: 'Mathematically sound, balanced bluff/value frequencies based on pot odds and equity.',
    promptSnippet: 'You play Game Theory Optimal (GTO). You calculate pot odds, balance your bluff and value-bet frequencies, and make mathematically disciplined decisions.',
  },
  {
    id: 'custom',
    name: 'Custom Playstyle Rules',
    badge: 'Custom',
    description: 'Define your own tactical strategy and situational rules.',
    promptSnippet: '',
  },
];

interface BanterPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  promptSnippet: string;
}

const BANTER_PRESETS: BanterPreset[] = [
  {
    id: 'trash_talk',
    name: 'Trash Talker',
    icon: '🔥',
    description: 'Cocky, boasts about chips, mocks folds and bad calls.',
    promptSnippet: 'Your personality is a trash talker. You are arrogant, cocky, and love to boast about taking the player chips. You tease them when they fold and mock their bets.',
  },
  {
    id: 'gentleman',
    name: 'Polite Gentleman',
    icon: '🎩',
    description: 'Courteous casino veteran, compliments clever moves, respectful.',
    promptSnippet: 'Your personality is a distinguished, polite casino gentleman. You speak with poise and elegance, compliment the player on good folds or bets, and remain classy whether winning or losing.',
  },
  {
    id: 'robot',
    name: 'Cold Analytical Robot',
    icon: '🤖',
    description: 'Speaks only in EV calculations, percentages, and board analysis.',
    promptSnippet: 'Your personality is a pure calculation engine. You speak in cold probabilities, EV percentages, and statistical analysis. You exhibit zero emotion, only cold data.',
  },
  {
    id: 'tilted',
    name: 'Tilted Gambler',
    icon: '🤪',
    description: 'Emotional, superstitious, complains about luck or goes wild.',
    promptSnippet: 'Your personality is an emotional gambler on the verge of tilt. You believe in hot streaks and bad luck, complain loudly when outflopped, and celebrate wildly when you hit your cards.',
  },
  {
    id: 'silent',
    name: 'Silent Assassin',
    icon: '🤐',
    description: 'Speaks rarely, delivers short and sharp one-liners.',
    promptSnippet: 'You speak very little. Your banter consists of short, razor-sharp one-liners (under 8 words). You let your chips do the talking.',
  },
  {
    id: 'custom',
    name: 'Custom Banter',
    icon: '✍️',
    description: 'Write custom personality instructions.',
    promptSnippet: '',
  },
];

const DEFAULT_MODELS_BY_PROVIDER: Record<string, string[]> = {
  gemini: ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  claude: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  mock: ['offline-rule-engine'],
};

export const CustomBotModal: React.FC<CustomBotModalProps> = ({
  isOpen,
  onClose,
  botToEdit,
}) => {
  const { settings, createCustomBot, updateCustomBot } = usePokerStore();

  const [name, setName] = useState('The Shark');
  const [avatar, setAvatar] = useState('🦈');
  const [provider, setProvider] = useState<'gemini' | 'claude' | 'openai' | 'mock'>('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [customModelInput, setCustomModelInput] = useState('');
  const [strategyPresetId, setStrategyPresetId] = useState('lag');
  const [customStrategyText, setCustomStrategyText] = useState('');
  const [banterPresetId, setBanterPresetId] = useState('trash_talk');
  const [customBanterText, setCustomBanterText] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isAdvancedPromptOpen, setIsAdvancedPromptOpen] = useState(false);
  const [hasManuallyEditedPrompt, setHasManuallyEditedPrompt] = useState(false);

  // Initialize or reset when modal opens or botToEdit changes
  useEffect(() => {
    if (botToEdit) {
      setName(botToEdit.name);
      setAvatar(botToEdit.avatar);
      setProvider(botToEdit.provider);
      setModel(botToEdit.model);
      setTemperature(botToEdit.temperature);
      setSystemPrompt(botToEdit.systemPrompt);
      setHasManuallyEditedPrompt(true);

      const strat = STRATEGY_PRESETS.find((s) => s.badge === botToEdit.style);
      if (strat) {
        setStrategyPresetId(strat.id);
      } else {
        setStrategyPresetId('custom');
        setCustomStrategyText(botToEdit.style);
      }

      const banter = BANTER_PRESETS.find((b) => b.name === botToEdit.banterFlavor);
      if (banter) {
        setBanterPresetId(banter.id);
      } else {
        setBanterPresetId('custom');
        setCustomBanterText(botToEdit.banterFlavor);
      }
    } else {
      // Default new bot setup
      setName('The Shark');
      setAvatar('🦈');
      setStrategyPresetId('lag');
      setCustomStrategyText('');
      setBanterPresetId('trash_talk');
      setCustomBanterText('');
      setTemperature(0.7);
      setHasManuallyEditedPrompt(false);

      // Default provider & model based on configured keys or settings
      let initialProvider: 'gemini' | 'claude' | 'openai' | 'mock' = 'gemini';
      if (settings.apiKeys.gemini) {
        initialProvider = 'gemini';
      } else if (settings.apiKeys.anthropic) {
        initialProvider = 'claude';
      } else if (settings.apiKeys.openai) {
        initialProvider = 'openai';
      } else {
        initialProvider = 'mock';
      }
      setProvider(initialProvider);

      const prefModel =
        initialProvider === 'gemini'
          ? settings.customModels?.gemini
          : initialProvider === 'claude'
          ? settings.customModels?.anthropic
          : initialProvider === 'openai'
          ? settings.customModels?.openai
          : undefined;

      setModel(prefModel || DEFAULT_MODELS_BY_PROVIDER[initialProvider][0]);
    }
  }, [isOpen, botToEdit, settings]);

  // Update default model when provider changes (if not editing an existing bot)
  const handleProviderChange = (newProvider: 'gemini' | 'claude' | 'openai' | 'mock') => {
    setProvider(newProvider);
    const prefModel =
      newProvider === 'gemini'
        ? settings.customModels?.gemini
        : newProvider === 'claude'
        ? settings.customModels?.anthropic
        : newProvider === 'openai'
        ? settings.customModels?.openai
        : undefined;

    setModel(prefModel || DEFAULT_MODELS_BY_PROVIDER[newProvider][0]);
  };

  // Rebuild system prompt dynamically if not manually customized
  useEffect(() => {
    if (hasManuallyEditedPrompt) return;

    const strat =
      strategyPresetId === 'custom'
        ? customStrategyText || 'Play a solid, aggressive game.'
        : STRATEGY_PRESETS.find((s) => s.id === strategyPresetId)?.promptSnippet || '';

    const banter =
      banterPresetId === 'custom'
        ? customBanterText || 'Keep it friendly and banter occasionally.'
        : BANTER_PRESETS.find((b) => b.id === banterPresetId)?.promptSnippet || '';

    const prompt = `You are "${name}", an elite AI poker opponent playing Heads-Up No-Limit Texas Hold'em.

STRATEGY & PLAYSTYLE:
${strat}

PERSONALITY & BANTER:
${banter}

CRITICAL RULES:
1. You must respond ONLY with a raw valid JSON object. Do not include markdown codeblocks (no \`\`\`json), explanations, or preamble.
2. The JSON object must strictly match this schema:
{
  "action": "fold" | "check" | "call" | "raise",
  "amount": <number>, // total amount to raise to, or 0 for fold/check/call
  "thinking": "<concise explanation of your strategic reasoning, math, and read on the opponent>",
  "chat": "<your conversational dialogue or table banter in character, 1-2 sentences maximum>"
}
3. Never take an illegal action. If you cannot check, either call or fold. If you cannot raise, call or check.`;

    setSystemPrompt(prompt);
  }, [
    name,
    strategyPresetId,
    customStrategyText,
    banterPresetId,
    customBanterText,
    hasManuallyEditedPrompt,
  ]);

  if (!isOpen) return null;

  const currentStrat = STRATEGY_PRESETS.find((s) => s.id === strategyPresetId);
  const currentBanter = BANTER_PRESETS.find((b) => b.id === banterPresetId);
  const hasKey =
    provider === 'mock' ||
    (provider === 'gemini' && !!settings.apiKeys.gemini) ||
    (provider === 'claude' && !!settings.apiKeys.anthropic) ||
    (provider === 'openai' && !!settings.apiKeys.openai);

  const handleSave = () => {
    if (!name.trim()) return;

    const finalModel = customModelInput.trim() || model;
    const styleBadge = currentStrat?.badge || 'Custom';
    const banterName = currentBanter?.name || 'Custom';

    if (botToEdit) {
      updateCustomBot({
        ...botToEdit,
        name: name.trim(),
        avatar,
        provider,
        model: finalModel,
        style: styleBadge,
        banterFlavor: banterName,
        systemPrompt,
        temperature,
      });
    } else {
      createCustomBot({
        name: name.trim(),
        avatar,
        provider,
        model: finalModel,
        style: styleBadge,
        banterFlavor: banterName,
        systemPrompt,
        temperature,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 text-zinc-100 flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center text-xl shadow-lg">
              <span className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center">
                {avatar}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                {botToEdit ? 'Edit Custom Bot' : 'Create Custom AI Opponent'}
              </h2>
              <p className="text-xs text-zinc-400">
                Design your bot's personality, strategy, and connect it to your preferred AI model.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-lg p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Bot Identity (Name & Avatar) */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Bot Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Phil Tiltmuth, The Shark, GTObot"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300">Avatar Icon</label>
            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
              {AVATAR_OPTIONS.slice(0, 10).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                    avatar === emoji
                      ? 'bg-amber-400/20 border-2 border-amber-400 shadow-md scale-110'
                      : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: AI Provider & Model Connection */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              AI Engine & Model
            </span>
            {hasKey ? (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ✓ Provider Ready
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full">
                ⚠️ API Key Missing in Settings
              </span>
            )}
          </div>

          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'gemini', label: 'Google Gemini', icon: '💎' },
              { id: 'claude', label: 'Anthropic Claude', icon: '🧠' },
              { id: 'openai', label: 'OpenAI GPT', icon: '⚡' },
              { id: 'mock', label: 'Offline Engine', icon: '🤖' },
            ].map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300 shadow-md'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-base mb-1">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Model Dropdown & Custom Model Input */}
          {provider !== 'mock' && (
            <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-400">Select Model</label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setCustomModelInput('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                >
                  {DEFAULT_MODELS_BY_PROVIDER[provider].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  {/* Also show configured custom model if different */}
                  {settings.customModels?.[provider as 'gemini' | 'anthropic' | 'openai'] &&
                    !DEFAULT_MODELS_BY_PROVIDER[provider].includes(
                      settings.customModels[provider as 'gemini' | 'anthropic' | 'openai']!
                    ) && (
                      <option
                        value={settings.customModels[provider as 'gemini' | 'anthropic' | 'openai']!}
                      >
                        {settings.customModels[provider as 'gemini' | 'anthropic' | 'openai']!} (from Settings)
                      </option>
                    )}
                </select>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-400">
                  Or Custom Model ID (Optional)
                </label>
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => {
                    setCustomModelInput(e.target.value);
                    if (e.target.value) setModel(e.target.value);
                  }}
                  placeholder="e.g. gemini-3.8-flash, gpt-4.5-preview"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Poker Playstyle Strategy */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Playing Style & Strategy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STRATEGY_PRESETS.map((strat) => {
              const isSelected = strategyPresetId === strat.id;
              return (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => {
                    setStrategyPresetId(strat.id);
                    setHasManuallyEditedPrompt(false);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 shadow-md ring-1 ring-amber-400/30'
                      : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100">{strat.name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                      {strat.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {strat.description}
                  </p>
                </button>
              );
            })}
          </div>

          {strategyPresetId === 'custom' && (
            <textarea
              rows={2}
              value={customStrategyText}
              onChange={(e) => {
                setCustomStrategyText(e.target.value);
                setHasManuallyEditedPrompt(false);
              }}
              placeholder="e.g. Always 3-bet from dealer button. If board has paired cards on the flop, fire a 75% pot bluff."
              className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          )}
        </div>

        {/* Section 4: Personality & Banter Flavor */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Table Personality & Banter
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BANTER_PRESETS.map((banter) => {
              const isSelected = banterPresetId === banter.id;
              return (
                <button
                  key={banter.id}
                  type="button"
                  onClick={() => {
                    setBanterPresetId(banter.id);
                    setHasManuallyEditedPrompt(false);
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/10 shadow-md ring-1 ring-amber-400/30'
                      : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{banter.icon}</span>
                    <span className="text-xs font-bold text-zinc-100 truncate">{banter.name}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                    {banter.description}
                  </p>
                </button>
              );
            })}
          </div>

          {banterPresetId === 'custom' && (
            <textarea
              rows={2}
              value={customBanterText}
              onChange={(e) => {
                setCustomBanterText(e.target.value);
                setHasManuallyEditedPrompt(false);
              }}
              placeholder="e.g. Speak like a pirate or a cyberpunk hacker with cryptic poker slang."
              className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          )}
        </div>

        {/* Section 5: Advanced System Prompt Accordion */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAdvancedPromptOpen(!isAdvancedPromptOpen)}
            className="w-full px-4 py-2.5 bg-zinc-900/70 hover:bg-zinc-900 flex items-center justify-between text-xs text-zinc-400 font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>⚙️</span>
              <span>Advanced: Generated System Prompt Preview</span>
              {hasManuallyEditedPrompt && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/30">
                  Customized
                </span>
              )}
            </div>
            <span>{isAdvancedPromptOpen ? '▲ Hide' : '▼ Inspect / Edit'}</span>
          </button>

          <AnimatePresence>
            {isAdvancedPromptOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-3 bg-zinc-950 border-t border-zinc-800"
              >
                <textarea
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setHasManuallyEditedPrompt(true);
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Note: The bot must return JSON with action, amount, thinking, and chat keys.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            <span>{avatar}</span>
            <span>{botToEdit ? 'Save Changes' : 'Create & Play Bot'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
