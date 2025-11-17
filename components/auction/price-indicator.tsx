import { cn } from '@/lib/utils';

interface PriceIndicatorProps {
  label: string;
  price: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export function PriceIndicator({
  label,
  price,
  size = 'md',
  variant = 'primary',
  className
}: PriceIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const priceSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const variantClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-text-primary',
  };

  return (
    <div className={cn('space-y-0.5', className)}>
      <p className={cn('text-text-secondary uppercase tracking-wide font-medium', sizeClasses[size])}>
        {label}
      </p>
      <p className={cn('font-bold', priceSizeClasses[size], variantClasses[variant])}>
        {price.toLocaleString()}
      </p>
    </div>
  );
}
