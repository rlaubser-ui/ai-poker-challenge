'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatChips } from '@/lib/utils/format';

interface ChipStackProps {
  amount: number;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ChipStack: React.FC<ChipStackProps> = ({
  amount,
  label,
  className = '',
  size = 'md',
}) => {
  if (amount <= 0 && !label) return null;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-5 py-2 font-bold',
  }[size];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full bg-zinc-950/80 border border-amber-500/50 shadow-lg text-amber-300 font-mono ${sizeClasses} ${className}`}
    >
      {/* 3D Chip Icon */}
      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-dashed border-white/80 bg-red-600 shadow-inner flex items-center justify-center shrink-0">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/90" />
      </div>

      <div className="flex items-baseline gap-1">
        {label && <span className="text-zinc-400 font-sans text-xs">{label}:</span>}
        <span className="font-bold tracking-tight">{formatChips(amount)}</span>
      </div>
    </motion.div>
  );
};
