'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerStore } from '@/store/usePokerStore';

export const ThinkingDrawer: React.FC = () => {
  const { gameState, lastAIResponse, settings } = usePokerStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const visibility = settings.reasoningVisibility;

  // 1. Hidden mode: never show
  if (visibility === 'hidden') return null;

  // 2. Showdown mode: only show when hand is ended
  if (visibility === 'showdown' && gameState?.stage !== 'ended') {
    return null;
  }

  // 3. Check if thinking exists
  if (!lastAIResponse?.thinking) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto my-2 px-2">
      <div className="bg-zinc-950/90 border border-indigo-500/30 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🧠</span>
            <span className="font-bold text-xs text-indigo-300 tracking-wide uppercase">
              AI Strategic Reasoning
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30">
              {visibility === 'live' ? 'Live EV' : 'Showdown Reveal'}
            </span>
          </div>
          <span className="text-zinc-400 text-xs font-mono">
            {isOpen ? '▲ Hide' : '▼ View Logic'}
          </span>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-zinc-800/80 p-3.5 bg-zinc-950/60"
            >
              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                {lastAIResponse.thinking}
              </pre>
              {(lastAIResponse.thinking.includes('429') || lastAIResponse.thinking.includes('Quota')) && (
                <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between">
                  <span>💡 Tip: Switch to Gemini 2.5 Flash in Settings for higher request limits.</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
