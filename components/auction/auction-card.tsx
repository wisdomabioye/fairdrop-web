'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuctionTimer } from "./auction-timer";
import { Button } from "@/components/ui/button";
import { Dialog, useDialog } from "@/components/ui/dialog";
import { useAuctionData, useAuctionMutations } from '@/hooks';
import { calculateAuctionState, AuctionConfig } from "@/utils/auction";
import { toast } from "sonner";

export interface AuctionCardProps {
  applicationId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  config: AuctionConfig;
  onBid?: (auctionId: string) => void;
}

export function AuctionCard({
  applicationId,
  title,
  description,
  imageUrl,
  config,
  onBid,
}: AuctionCardProps) {
  const { dialogState, showDialog, closeDialog } = useDialog();
  const [bidAmount, setBidAmount] = useState('');
  const staticAuctionState = calculateAuctionState(config);
  
  // Auction data
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
    pollInterval: 5000,
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



  // Extract auction data with config fallback
  // Calculate derived values from blockchain data with config fallback
  const currentPrice = Number(cachedAuctionState?.currentPrice ?? staticAuctionState.currentPrice ?? 0);
  const floorPrice = Number(cachedAuctionState?.floorPrice ?? config.floorPrice ?? 0);
  const totalQuantity = Number(cachedAuctionState?.totalQuantity ?? config.totalQuantity ?? 0);
  const soldQuantity = Number(cachedAuctionState?.quantitySold ?? 0);
  const status = cachedAuctionState?.status.toLowerCase() as 'active' | 'upcoming' | 'ended' || cachedAuctionState?.status;
  const remaining = totalQuantity - soldQuantity;
  const startTimestamp = Number(cachedAuctionState?.startTimestamp ?? config.startTimestamp ?? 0);
  const percentageSold = Math.round((soldQuantity / totalQuantity) * 100) 

  const statusConfig = {
    active: { label: "Live", variant: "success" as const, glow: true },
    upcoming: { label: "Upcoming", variant: "info" as const, glow: false },
    ended: { label: "Ended", variant: "default" as const, glow: false },
  };

  return (
    <>
      <Card variant="cosmic" hover className="overflow-hidden group w-full h-full flex flex-col min-w-[280px]">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl animate-float" />
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
        </div>

        {/* Header */}
        <CardHeader className="relative pb-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusConfig[status].variant} glow={statusConfig[status].glow} className="text-xs">
                {statusConfig[status].label}
              </Badge>
              {remaining <= 10 && remaining > 0 && (
                <Badge variant="warning" glow className="text-xs">
                  {remaining} left
                </Badge>
              )}
              {isSubscriberChain && (
                <Badge variant="info" className="text-xs">
                  Subscriber
                </Badge>
              )}
            </div>
            <Badge variant={auctionMutation.isConnected ? "success" : "warning"} className="text-xs shrink-0">
              {auctionMutation.isConnected ? "✓" : "○"}
            </Badge>
          </div>

          <CardTitle className="group-hover:text-primary transition-colors text-lg leading-tight">
            {title || 'Fairdrop Auction'}
          </CardTitle>

          {description && (
            <p className="text-xs text-text-secondary leading-snug line-clamp-2">{description}</p>
          )}
        </CardHeader>

        {/* Content */}
        <CardContent className="relative space-y-3 pt-0 flex-1">
          {/* Image Preview */}
          {imageUrl && (
            <div className="relative h-32 sm:h-36 rounded-lg overflow-hidden bg-glass border border-white/10">
              <img
                src={imageUrl}
                alt={title || 'Auction item'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Price & Supply Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current Price */}
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Price</p>
              <p className="text-lg font-bold text-primary">{currentPrice}</p>
              <p className="text-xs text-text-secondary">Floor: {floorPrice}</p>
            </div>

            {/* Supply */}
            <div className="space-y-1">
              <p className="text-xs text-text-secondary uppercase tracking-wide">Supply</p>
              <p className="text-lg font-bold text-text-primary">{remaining}/{totalQuantity}</p>
              <p className="text-xs text-text-secondary">{percentageSold.toFixed(0)}% sold</p>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={soldQuantity} max={totalQuantity} variant="gradient" className="h-1.5" />

          {/* Timer */}
          {status === "active" && staticAuctionState.nextPriceDropIn && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-glass border border-white/10">
              <span className="text-xs text-text-secondary">Next drop</span>
              <span className="text-sm font-semibold text-primary">
                {Math.floor(Number(staticAuctionState.nextPriceDropIn) / 1000)}s
              </span>
            </div>
          )}

          {status === "upcoming" && startTimestamp && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-glass border border-white/10">
              <span className="text-xs text-text-secondary">Starts in</span>
              <AuctionTimer endTime={Number(startTimestamp)} />
            </div>
          )}

          {/* Wallet Info */}
          {auctionMutation.isConnected && (
            <div className="text-xs text-text-secondary flex items-center justify-between py-1 px-2 rounded bg-glass/50">
              <span>Balance:</span>
              <span className="font-medium">{0}</span>
            </div>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="relative flex-col space-y-2 pt-3">
          {status === "active" && (
            <>
              {/* Bid Input & Button */}
              <div className="w-full flex gap-2">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Qty"
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-white/20 rounded-lg bg-glass backdrop-blur-sm text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  disabled={auctionMutation.isConnecting || auctionMutation.isBidding}
                  min="1"
                />
                <Button
                  variant="primary"
                  size="md"
                  className="px-4 min-w-[100px] shrink-0"
                  onClick={handlePlaceBid}
                  isLoading={auctionMutation.isConnecting || auctionMutation.isBidding}
                  disabled={!bidAmount || remaining === 0 || auctionMutation.isConnecting || auctionMutation.isBidding}
                >
                  {auctionMutation.isConnecting ? 'Connecting...' :
                   auctionMutation.isBidding ? 'Bidding...' :
                   auctionMutation.canWrite ? "Place Bid" : "Connect"}
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
          {status === "upcoming" && (
            <Button variant="outline" size="md" className="w-full" disabled>
              Not Started
            </Button>
          )}
          {status === "ended" && (
            <Button variant="ghost" size="md" className="w-full" disabled>
              Ended
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Dialog for notifications */}
      <Dialog
        open={dialogState.open}
        onClose={closeDialog}
        title={dialogState.title}
        description={dialogState.description}
        variant={dialogState.variant}
      />
    </>
  );
}
