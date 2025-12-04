'use client';

import { useEffect, useState } from 'react';
import { formatTimeRemaining, formatTimeCompact } from '@/utils/time';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  label: string;
  targetTime: number; // Unix timestamp in milliseconds
  compact?: boolean;
  variant?: 'primary' | 'secondary' | 'warning' | 'success';
  size?: 'sm' | 'md';
  className?: string;
}

export function CountdownTimer({
  label,
  targetTime,
  compact = false,
  variant = 'primary',
  size = 'md',
  className
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      setTimeRemaining(compact ? formatTimeCompact(diff) : formatTimeRemaining(diff));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime, compact]);

  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    warning: 'text-warning',
    success: 'text-success',
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  const timeSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <span className={cn('text-text-secondary font-medium', sizeClasses[size])}>
        {label}
      </span>
      <span className={cn('font-semibold tabular-nums', timeSizeClasses[size], variantClasses[variant])}>
        {timeRemaining || ' 0s'}
      </span>
    </div>
  );
}
