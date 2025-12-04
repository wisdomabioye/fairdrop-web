import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AuctionStatus } from '@/stores/auction-store';

interface StatusBadgeProps {
  status: AuctionStatus;
  size?: 'sm' | 'md';
  glow?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'md', glow, className }: StatusBadgeProps) {
  const config: Record<
  AuctionStatus, 
  {
    label: string, 
    variant: 'success' | 'info' | 'default', 
    defaultGlow: boolean
  }
  > = {
    [AuctionStatus.Active]: {
      label: 'Live',
      variant: 'success' as const,
      defaultGlow: true
    },
    [AuctionStatus.Scheduled]: {
      label: 'Upcoming',
      variant: 'info' as const,
      defaultGlow: false
    },
    [AuctionStatus.Ended]: {
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
