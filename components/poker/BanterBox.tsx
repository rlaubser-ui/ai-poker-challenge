'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePokerStore } from '@/store/usePokerStore';

export const BanterBox: React.FC = () => {
  const { banterLog, clearBanter, isAITurn } = usePokerStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [banterLog]);

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-zinc-300">
          <span>💬</span>
          <span>Table Dialogue</span>
          <span className="text-zinc-600 font-normal">({banterLog.length})</span>
        </div>
        {banterLog.length > 0 && (
          <button
            onClick={clearBanter}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message List */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-2 max-h-36 sm:max-h-44 overflow-y-auto pr-1 text-xs select-none scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {banterLog.length === 0 ? (
          <div className="text-center py-4 text-zinc-600 italic">
            Deal a hand to start the conversation...
          </div>
        ) : (
          banterLog.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 bg-zinc-900/60 rounded-xl p-2 border border-zinc-800/50"
            >
              <div className="text-base shrink-0 mt-0.5">{msg.avatar}</div>
              <div className="flex flex-col flex-1">
                <span className="font-bold text-[11px] text-amber-400">
                  {msg.sender}
                </span>
                <p className="text-zinc-200 mt-0.5 leading-relaxed font-sans">
                  {msg.text}
                </p>
              </div>
            </motion.div>
          ))
        )}

        {/* AI Typing Indicator */}
        {isAITurn && (
          <div className="flex items-center gap-2 text-zinc-500 italic py-1 px-2">
            <span className="animate-pulse">Opponent is speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
};
