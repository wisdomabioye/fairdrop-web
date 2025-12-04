'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCachedAllBids } from '@/hooks';
import { ChevronDown, TrendingUp, Clock, User } from 'lucide-react';

export interface AllBidsHistoryProps {
  applicationId: string;
}

export function AllBidsHistory({ applicationId }: AllBidsHistoryProps) {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const {
    bids,
    totalCount,
    hasMore,
    loading,
    isFetching,
    error,
    refetch,
  } = useCachedAllBids({
    applicationId,
    status: 'ACCEPTED',
    offset,
    limit,
  });

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleString();
  };

  const getBidStatusConfig = (status: string) => {
    const configs = {
      ACCEPTED: { variant: 'success' as const, label: 'Accepted' },
      PENDING: { variant: 'info' as const, label: 'Pending' },
      REJECTED: { variant: 'default' as const, label: 'Rejected' },
    };
    return configs[status as keyof typeof configs] || configs.ACCEPTED;
  };

  if (loading && bids.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-text-secondary">Loading bid history...</p>
        </div>
      </div>
    );
  }

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

  if (bids.length === 0) {
    return (
      <Card variant="cosmic" className="p-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-glass border border-white/10 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-text-secondary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-text-primary">No Bids Yet</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Be the first to place a bid in this auction! The bidding history will appear here.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">All Bids</h2>
          <p className="text-sm text-text-secondary mt-1">
            {totalCount} total bids • Showing {bids.length}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          isLoading={isFetching}
        >
          Refresh
        </Button>
      </div>

      {/* Bids List */}
      <div className="space-y-3">
        {bids.map((bid, index) => {
          const statusConfig = getBidStatusConfig(bid.status);

          return (
            <Card
              key={`${bid.bidder}-${bid.timestamp}-${index}`}
              variant="cosmic"
              hover
              className="p-4 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Bidder & Time */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-text-primary truncate">
                        {formatAddress(bid.bidder)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(bid.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: Bid Details */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Quantity</p>
                    <p className="text-lg font-bold text-text-primary">{bid.quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Bid Price</p>
                    <p className="text-lg font-bold text-primary">{bid.bidPrice}</p>
                  </div>

                  {bid.clearingPrice && bid.clearingPrice !== '0' && (
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Clearing Price</p>
                      <p className="text-lg font-bold text-success">{bid.clearingPrice}</p>
                    </div>
                  )}
                </div>

                {/* Right: Status */}
                <Badge variant={statusConfig.variant} className="shrink-0">
                  {statusConfig.label}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isFetching}
            isLoading={isFetching}
            className="min-w-[200px]"
          >
            {isFetching ? (
              'Loading...'
            ) : (
              <>
                Load More
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {!hasMore && bids.length > 0 && (
        <p className="text-center text-sm text-text-secondary py-4">
          You've reached the end of the bid history
        </p>
      )}
    </div>
  );
}
