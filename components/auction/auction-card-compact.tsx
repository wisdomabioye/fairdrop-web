'use client';

import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceIndicator } from "@/components/auction/price-indicator";
import { CountdownTimer } from "@/components/auction/countdown-timer";
import { ProgressBar } from "@/components/auction/progress-bar";
import { StatusBadge } from "@/components/auction/status-badge";
import { calculateAuctionState, AuctionConfig } from "@/utils/auction";
import { useAuctionData, useAuctionMutations, /* useAuctionNotifications */ } from '@/hooks';

export interface AuctionCardCompactProps {
  applicationId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  config: AuctionConfig;
  onBid?: (auctionId: string) => void;
  className?: string;
}

export function AuctionCardCompact({
  applicationId,
  title,
  description,
  imageUrl,
  config,
  onBid,
  className
}: AuctionCardCompactProps) {
  const [bidAmount, setBidAmount] = useState('1');
  // Use client-side calculated state for UI responsiveness
  const staticAuctionState = calculateAuctionState(config);
  
  // Auction data
  const {
    cachedAuctionState,
    // error: auctionFetchError,
    loading: auctionFetchLoading,
    // isCreatorChain,
    isSubscriberChain,
    refetch: refreshCacheAuctionData
  } = useAuctionData({
    applicationId,
    pollInterval: 15000,
  });

  // Auction mutation
  const auctionMutation = useAuctionMutations({
    applicationId,
    onBidSuccess(quantity) {
      setBidAmount('1');
      toast.success('Bid Placed Successfully!', {
        description: `Your bid for ${quantity} item(s) has been placed successfully.`,
      });
      // trigger auction data refresh
      refreshCacheAuctionData();
      onBid?.(applicationId);
    },

    onBidError(error) {
      toast.error('Bid Failed', {
        description: error.message || 'An unknown error occurred. Please try again.',
      });
    },

    onSubscribeSuccess() {
      toast.success('Subscription successful', {
        description: 'Subscribed to cache state data',
      });
    },
  })

  // Block Notification
  // const auctionNotification = useAuctionNotifications({
  //   enabled: true,
  //   maxHistory: 10,
  //   onNotification() {
  //     // trigger auction data refresh
  //     // auction.refetch();
  //   }
  // })

  // Auto-subscribe on subscriber chains
  useEffect(() => {
    if (
      isSubscriberChain &&
      !auctionMutation.isSubscribed &&
      !auctionMutation.isSubscribing &&
      !cachedAuctionState &&
      !auctionFetchLoading
    ) {
      console.log('[AuctionCardCompact] Subscriber chain detected, subscribing...');
      auctionMutation.subscribeToAuction();
    }
  }, [
    isSubscriberChain,
    auctionMutation.isSubscribed,
    auctionMutation.isSubscribing,
    cachedAuctionState,
    auctionFetchLoading,
    auctionMutation.subscribeToAuction
  ]);

  const handlePlaceBid = async () => {
    if (!auctionMutation.isConnected) {
      await auctionMutation.connectWallet();
      return
    }
    
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid bid quantity.',
      });
      return;
    }
    await auctionMutation.placeBid(Number(bidAmount));
  };


  // Calculate derived values from blockchain data with config fallback
  const currentPrice = Number(cachedAuctionState?.currentPrice ?? staticAuctionState.currentPrice ?? 0);
  const floorPrice = Number(cachedAuctionState?.floorPrice ?? config.floorPrice ?? 0);
  const totalQuantity = Number(cachedAuctionState?.totalQuantity ?? config.totalQuantity ?? 0);
  const soldQuantity = Number(cachedAuctionState?.quantitySold ?? 0);
  const status = cachedAuctionState?.status.toLowerCase() as 'active' | 'scheduled' | 'ended' || staticAuctionState?.status;
  const remaining = totalQuantity - soldQuantity;
  const startTimestamp = Number(cachedAuctionState?.startTimestamp ?? config.startTimestamp ?? 0);

  // Use calculated state for price decrease info
  const {
    timeToFloorPrice,
    percentageDecreased,
    isAtFloorPrice,
    nextPriceDropIn,
  } = staticAuctionState;

  return (
    <Card
      variant="cosmic"
      hover
      className={cn('overflow-hidden group w-full flex flex-col', className)}
    >
      {/* Compact Header */}
      <CardHeader className="relative pb-2 space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <StatusBadge status={status} size="sm" />
          {remaining <= 10 && remaining > 0 && (
            <StatusBadge
              status="active"
              size="sm"
              className="bg-warning/20 text-warning border-warning/30"
            />
          )}
        </div>

        <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
          {title || 'Fairdrop Auction'}
        </h3>

        {description && (
          <p className="text-xs text-text-secondary leading-snug line-clamp-1">
            {description}
          </p>
        )}
      </CardHeader>

      {/* Compact Content */}
      <CardContent className="relative space-y-3 pt-0 flex-1 p-4">
        {/* Image - Small */}
        {imageUrl && (
          <div className="relative h-28 rounded-lg overflow-hidden bg-glass border border-white/10">
            <img
              src={imageUrl}
              alt={title || 'Auction item'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Price Grid */}
        <div className="grid grid-cols-2 gap-2">
          <PriceIndicator
            label="Current"
            price={currentPrice}
            size="sm"
            variant="primary"
          />
          <PriceIndicator
            label="Floor"
            price={floorPrice}
            size="sm"
            variant="muted"
          />
        </div>

        {/* Progress */}
        <ProgressBar
          value={percentageDecreased}
          variant="gradient"
          size="sm"
          showLabel={false}
        />

        {/* Timers */}
        <div className="space-y-1.5 py-2 px-2.5 rounded-lg bg-glass border border-white/10">
          {status === 'active' && !isAtFloorPrice && (
            <>
              <CountdownTimer
                label="Next drop"
                targetTime={Date.now() + nextPriceDropIn}
                compact
                variant="primary"
                size="sm"
              />
              <CountdownTimer
                label="Floor in"
                targetTime={Date.now() + timeToFloorPrice}
                compact
                variant="secondary"
                size="sm"
              />
            </>
          )}

          {status === 'active' && isAtFloorPrice && (
            <div className="text-center py-1">
              <span className="text-xs text-success font-semibold">
                At Floor Price
              </span>
            </div>
          )}

          {status === 'scheduled' && startTimestamp && (
            <CountdownTimer
              label="Starts in"
              targetTime={startTimestamp}
              compact={false}
              variant="warning"
              size="sm"
            />
          )}
        </div>

        {/* Supply Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">Supply</span>
          <span className="font-semibold text-text-primary">
            {remaining}/{totalQuantity}
          </span>
        </div>

        {/* Balance - only show when connected */}
        {auctionMutation.isConnected && (
          <div className="text-xs text-text-secondary flex items-center justify-between py-1 px-2 rounded bg-glass/50">
            <span>Balance:</span>
            <span className="font-medium">{0}</span>
          </div>
        )}
      </CardContent>

      {/* Compact Footer */}
      <CardFooter className="relative flex-col space-y-2 pt-2 p-4">
        {status === 'active' && (
          <>
            {/* Bid Input & Button */}
            <div className="w-full flex gap-2">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Qty"
                className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-white/20 rounded-lg bg-glass backdrop-blur-sm text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={auctionMutation.isConnecting || auctionMutation.isBidding}
                min="1"
              />
              <Button
                variant="primary"
                size="sm"
                className="px-3 shrink-0"
                onClick={handlePlaceBid}
                disabled={!bidAmount || remaining === 0 || auctionMutation.isConnecting || auctionMutation.isBidding}
              >
                {auctionMutation.isConnecting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : auctionMutation.isBidding ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Bidding...
                  </>
                ) : auctionMutation.canWrite ? "Bid" : "Connect"}
              </Button>
            </div>
            
            

            {/* Helper text */}
            {!auctionMutation.canWrite && !auctionMutation.isConnecting && !auctionMutation.isBidding && (
              <p className="text-xs text-text-secondary text-center leading-tight">
                Will connect wallet
              </p>
            )}
          </>
        )}
        {status === 'scheduled' && (
          <Button variant="outline" size="sm" className="w-full" disabled>
            Not Started
          </Button>
        )}
        {status === 'ended' && (
          <Button variant="ghost" size="sm" className="w-full" disabled>
            Ended
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
