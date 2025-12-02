'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { userBidData } from '@/hooks';
import { useState } from "react";
import { BidStatus } from "@/hooks/useAuctionData";

export interface MyBidsProps {
  applicationId: string;
  walletAddress: string;
}

export function MyBids({ applicationId, walletAddress }: MyBidsProps) {
  const {
    bidsForBidder,
    bidderSummary,
    loading,
    error,
    refetch
  } = userBidData(walletAddress, { applicationId });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Bid status configuration
  const statusConfig = {
    PENDING: { variant: "info" as const, label: "Pending" },
    ACCEPTED: { variant: "success" as const, label: "Accepted" },
    REJECTED: { variant: "default" as const, label: "Rejected" },
  } satisfies Record<BidStatus, Record<string, string>> ;

  return (
    <Card variant="cosmic" className="w-full">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle>My Bids</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            disabled={loading || isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="relative space-y-4">
        {/* Loading State */}
        {loading && !bidsForBidder && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-4 px-4 rounded-lg bg-error/10 border border-error/20">
            <p className="text-sm text-error">{error.message}</p>
          </div>
        )}

        {/* Summary Card */}
        {bidderSummary && !loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg bg-glass border border-white/10">
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Total Quantity</p>
              <p className="text-lg font-bold text-text-primary">{bidderSummary.totalQuantity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Total Cost</p>
              <p className="text-lg font-bold text-text-primary">{bidderSummary.totalCost}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Net Cost</p>
              <p className="text-lg font-bold text-primary">{bidderSummary.netCost}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Total Refund</p>
              <p className="text-lg font-bold text-success">{bidderSummary.totalRefund}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Accepted</p>
              <p className="text-lg font-bold text-success">{bidderSummary.acceptedBids}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Rejected</p>
              <p className="text-lg font-bold text-text-secondary">{bidderSummary.rejectedBids}</p>
            </div>
          </div>
        )}

        {/* Bids List */}
        {bidsForBidder && bidsForBidder.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Bid History</h3>
            <div className="space-y-2">
              {bidsForBidder.map((bid, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-glass border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={statusConfig[bid.status].variant}
                        className="text-xs"
                      >
                        {statusConfig[bid.status].label}
                      </Badge>
                      <span className="text-xs text-text-secondary">
                        {new Date(Number(bid.timestamp)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div>
                        <span className="text-xs text-text-secondary">Qty: </span>
                        <span className="text-sm font-semibold text-text-primary">{bid.quantity}</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-secondary">Bid Price: </span>
                        <span className="text-sm font-semibold text-primary">{bid.bidPrice}</span>
                      </div>
                      {bid.clearingPrice && bid.clearingPrice !== "0" && (
                        <div>
                          <span className="text-xs text-text-secondary">Clearing: </span>
                          <span className="text-sm font-semibold text-success">{bid.clearingPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loading && !error && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div className="w-16 h-16 rounded-full bg-glass border border-white/10 flex items-center justify-center">
                <span className="text-2xl">📭</span>
              </div>
              <p className="text-sm text-text-secondary">No bids yet</p>
              <p className="text-xs text-text-secondary/70">Place your first bid to see it here</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
