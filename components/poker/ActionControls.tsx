'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlayerAction } from '@/types/poker';
import { getValidActions } from '@/lib/poker/engine';
import { formatChips } from '@/lib/utils/format';
import { usePokerStore } from '@/store/usePokerStore';

export const ActionControls: React.FC = () => {
  const {
    gameState,
    tournament,
    isAITurn,
    isFastForward,
    actionTimeRemaining,
    dispatchAction,
    startNewHand,
    toggleFastForward,
    restartTournament,
  } = usePokerStore();

  const [raiseAmount, setRaiseAmount] = useState<number>(0);
  const [showRaiseSlider, setShowRaiseSlider] = useState<boolean>(false);

  const isHumanTurn =
    gameState &&
    gameState.stage !== 'ended' &&
    gameState.stage !== 'showdown' &&
    !isAITurn &&
    gameState.activePlayerIndex === 0;

  const valid = gameState ? getValidActions(gameState) : null;
  const humanPlayer = gameState?.players[0];

  // Sync raise amount whenever valid actions change
  useEffect(() => {
    if (valid && valid.canRaise) {
      setRaiseAmount(valid.minRaiseAmount);
    }
  }, [valid?.minRaiseAmount, valid?.canRaise]);

  if (!gameState) return null;

  // Tournament Completed State
  if (tournament.isComplete) {
    return (
      <div className="flex justify-center p-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => restartTournament()}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 font-black text-lg shadow-xl shadow-amber-500/20 hover:brightness-110 tracking-wide flex items-center gap-2"
        >
          🏆 Start New Tournament
        </motion.button>
      </div>
    );
  }

  // Hand Ended State
  if (gameState.stage === 'ended') {
    return (
      <div className="flex justify-center p-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => startNewHand()}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-zinc-950 font-black text-lg shadow-xl shadow-amber-500/20 hover:brightness-110 tracking-wide flex items-center gap-2"
        >
          Deal Next Hand ➔
        </motion.button>
      </div>
    );
  }

  // AI Thinking State Indicator
  if (isAITurn) {
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const aiPlayerName = activePlayer?.name || 'AI Opponent';
    return (
      <div className="flex flex-col items-center justify-center p-4 gap-2 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-amber-300">
            {aiPlayerName} is deciding...
          </span>
        </div>

        {/* Quick Fast Forward Option while AIs battle */}
        {humanPlayer?.isFolded && (
          <button
            onClick={toggleFastForward}
            className={`text-xs px-3 py-1 rounded-full border transition-all mt-1 ${
              isFastForward
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            {isFastForward ? '⏩ Turbo Active (Resolving Hand)' : '⚡ Fast Forward AI Turns'}
          </button>
        )}
      </div>
    );
  }

  if (!valid) return null;

  const handleAction = (action: PlayerAction) => {
    setShowRaiseSlider(false);
    dispatchAction(action);
  };

  // Quick Bet Presets
  const setQuickBet = (type: 'min' | '2.5bb' | 'halfPot' | 'pot' | 'allIn') => {
    if (!valid.canRaise) return;
    const currentBet = gameState.currentBet;
    const pot = gameState.pot;
    const bb = gameState.bigBlind;

    let target = valid.minRaiseAmount;

    if (type === 'min') {
      target = valid.minRaiseAmount;
    } else if (type === '2.5bb') {
      target = Math.round(bb * 2.5);
    } else if (type === 'halfPot') {
      target = Math.round(currentBet + pot / 2);
    } else if (type === 'pot') {
      target = currentBet + pot;
    } else if (type === 'allIn') {
      target = valid.maxRaiseAmount;
    }

    const clamped = Math.max(
      valid.minRaiseAmount,
      Math.min(target, valid.maxRaiseAmount)
    );
    setRaiseAmount(clamped);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 w-full max-w-xl mx-auto px-4 pb-4">
      {/* 15-Second Action Countdown Timer Bar for Hero */}
      {isHumanTurn && (
        <div className="w-full bg-zinc-950/85 border border-zinc-800 rounded-xl px-3 py-1.5 flex flex-col gap-1 backdrop-blur-md shadow-md">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 font-sans text-[11px] font-semibold flex items-center gap-1.5">
              <span>⏱️</span>
              <span>Your Turn (15s Shot Clock)</span>
            </span>
            <span
              className={`font-bold font-mono px-2 py-0.2 rounded ${
                actionTimeRemaining <= 5
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse text-xs'
                  : 'bg-zinc-900 text-amber-300 text-xs'
              }`}
            >
              {actionTimeRemaining}s
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                actionTimeRemaining <= 5
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (actionTimeRemaining / 15) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Raise Slider Drawer */}
      {showRaiseSlider && valid.canRaise && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-zinc-950/95 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3"
        >
          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setQuickBet('min')}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              Min
            </button>
            <button
              onClick={() => setQuickBet('2.5bb')}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              2.5x
            </button>
            <button
              onClick={() => setQuickBet('halfPot')}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              1/2 Pot
            </button>
            <button
              onClick={() => setQuickBet('pot')}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              Pot
            </button>
            <button
              onClick={() => setQuickBet('allIn')}
              className="px-2 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-lg text-xs font-bold"
            >
              All-In
            </button>
          </div>

          {/* Slider and Value */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={valid.minRaiseAmount}
              max={valid.maxRaiseAmount}
              step={gameState.bigBlind / 2}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
            <span className="font-mono font-bold text-amber-400 text-lg min-w-[70px] text-right">
              ${formatChips(raiseAmount)}
            </span>
          </div>

          {/* Confirm Raise Button */}
          <button
            onClick={() => handleAction({ type: 'raise', amount: raiseAmount })}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-sm tracking-wide shadow-lg hover:brightness-110"
          >
            Confirm Raise to ${formatChips(raiseAmount)}
          </button>
        </motion.div>
      )}

      {/* Main Action Bar */}
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Fold Button */}
        <button
          disabled={!isHumanTurn || !valid.canFold}
          onClick={() => handleAction({ type: 'fold' })}
          className="flex-1 py-3.5 rounded-2xl bg-zinc-900 border border-red-500/30 text-red-400 font-bold text-base shadow-lg hover:bg-red-950/40 hover:border-red-500 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          Fold
        </button>

        {/* Check or Call Button */}
        {valid.canCheck ? (
          <button
            disabled={!isHumanTurn}
            onClick={() => handleAction({ type: 'check' })}
            className="flex-1 py-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-emerald-400 font-bold text-base shadow-lg hover:bg-emerald-950/40 hover:border-emerald-500 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Check
          </button>
        ) : (
          <button
            disabled={!isHumanTurn || !valid.canCall}
            onClick={() => handleAction({ type: 'call' })}
            className="flex-1 py-3.5 rounded-2xl bg-zinc-900 border border-blue-500/40 text-blue-400 font-bold text-base shadow-lg hover:bg-blue-950/40 hover:border-blue-500 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Call ${formatChips(valid.callAmount)}
          </button>
        )}

        {/* Raise Button */}
        {valid.canRaise && (
          <button
            disabled={!isHumanTurn}
            onClick={() => setShowRaiseSlider(!showRaiseSlider)}
            className={`flex-1 py-3.5 rounded-2xl border font-bold text-base shadow-lg transition-all disabled:opacity-40 disabled:pointer-events-none ${
              showRaiseSlider
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                : 'bg-zinc-900 border-amber-500/40 text-amber-400 hover:bg-amber-950/40 hover:border-amber-500'
            }`}
          >
            {showRaiseSlider ? 'Cancel' : `Raise...`}
          </button>
        )}
      </div>
    </div>
  );
};
