import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'upcoming' | 'ended';
  size?: 'sm' | 'md';
  glow?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'md', glow, className }: StatusBadgeProps) {
  const config = {
    active: {
      label: 'Live',
      variant: 'success' as const,
      defaultGlow: true
    },
    upcoming: {
      label: 'Upcoming',
      variant: 'info' as const,
      defaultGlow: false
    },
    ended: {
      label: 'Ended',
      variant: 'default' as const,
      defaultGlow: false
    },
  };

  const { label, variant, defaultGlow } = config[status];
  const shouldGlow = glow !== undefined ? glow : defaultGlow;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <Badge
      variant={variant}
      glow={shouldGlow}
      className={cn(sizeClass, className)}
    >
      {label}
    </Badge>
  );
}
