'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCachedBidHistory } from '@/hooks';
import { useWalletConnection } from 'linera-react-client';
import { TrendingUp, Clock, Wallet } from 'lucide-react';
import { useState } from 'react';

export interface UserBidsTabProps {
  applicationId: string;
  walletAddress: string;
  isConnected: boolean;
}

export function UserBidsTab({
  applicationId,
  walletAddress,
  isConnected,
}: UserBidsTabProps) {
  const { connect, isConnecting } = useWalletConnection();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    bidsForBidder,
    bidderSummary,
    loading,
    error,
    refetch,
  } = useCachedBidHistory({
    applicationId,
    walletAddress,
    skip: !isConnected || !walletAddress,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleString();
  };

  const getBidStatusConfig = (status: string) => {
    const configs = {
      ACCEPTED: { variant: 'success' as const, label: 'Accepted', icon: '✓' },
      PENDING: { variant: 'info' as const, label: 'Pending', icon: '⏳' },
      REJECTED: { variant: 'default' as const, label: 'Rejected', icon: '✗' },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Card variant="cosmic" className="p-12">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-text-primary">Connect Your Wallet</h3>
            <p className="text-sm text-text-secondary">
              Connect your wallet to view your personal bid history and track your auction activity.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => connect()}
            isLoading={isConnecting}
            disabled={isConnecting}
            className="min-w-[200px]"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (loading && !bidsForBidder) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-text-secondary">Loading your bids...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="cosmic" className="p-8">
        <div className="text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-error">{error.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // No bids state
  if (!bidsForBidder || bidsForBidder.length === 0) {
    return (
      <Card variant="cosmic" className="p-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-glass border border-white/10 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-text-secondary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text-primary">No Bids Yet</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              You haven't placed any bids in this auction yet. Place your first bid to see it here!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">My Bids</h2>
          <p className="text-sm text-text-secondary mt-1">
            Your bidding activity for this auction
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          isLoading={isRefreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {bidderSummary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card variant="cosmic" className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Total Qty</p>
              <p className="text-2xl font-bold text-text-primary">{bidderSummary.totalQuantity}</p>
            </div>
          </Card>

          <Card variant="cosmic" className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Total Cost</p>
              <p className="text-2xl font-bold text-text-primary">{bidderSummary.totalCost}</p>
            </div>
          </Card>

          <Card variant="cosmic" className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Net Cost</p>
              <p className="text-2xl font-bold text-primary">{bidderSummary.netCost}</p>
            </div>
          </Card>

          <Card variant="cosmic" className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Refund</p>
              <p className="text-2xl font-bold text-success">{bidderSummary.totalRefund}</p>
            </div>
          </Card>

          <Card variant="cosmic" className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Accepted</p>
              <p className="text-2xl font-bold text-success">{bidderSummary.acceptedBids}</p>
            </div>
          </Card>

          <Card variant="cosmic" className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Rejected</p>
              <p className="text-2xl font-bold text-text-secondary">{bidderSummary.rejectedBids}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Bids List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          Bid History
        </h3>
        <div className="space-y-3">
          {bidsForBidder.map((bid, index) => {
            const statusConfig = getBidStatusConfig(bid.status);

            return (
              <Card
                key={index}
                variant="cosmic"
                hover
                className="p-4 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Status & Time */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(bid.timestamp)}
                    </div>
                  </div>

                  {/* Right: Bid Details */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Quantity</p>
                      <p className="text-sm font-semibold text-text-primary">{bid.quantity}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Bid Price</p>
                      <p className="text-sm font-semibold text-primary">{bid.bidPrice}</p>
                    </div>

                    {bid.clearingPrice && bid.clearingPrice !== '0' && (
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">Clearing</p>
                        <p className="text-sm font-semibold text-success">{bid.clearingPrice}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
