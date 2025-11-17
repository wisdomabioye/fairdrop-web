import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'gradient' | 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressBar({
  value,
  variant = 'gradient',
  size = 'md',
  showLabel = false,
  label,
  className
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  const variantClasses = {
    gradient: 'bg-gradient-to-r from-primary via-secondary to-accent',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && label && (
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{label}</span>
          <span className="font-medium">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-glass rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all duration-500 ease-out', variantClasses[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
