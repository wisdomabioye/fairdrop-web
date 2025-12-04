'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuctionTimer } from "./auction-timer";
import { Button } from "@/components/ui/button";
import { useCachedAuction, useAuctionMutations } from '@/hooks';
import { calculateAuctionState, AuctionConfig } from "@/utils/auction";
import { toast } from "sonner";
import { ExternalLink, Zap } from 'lucide-react';

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
  const [showQuickBidModal, setShowQuickBidModal] = useState(false);
  const [quickBidAmount, setQuickBidAmount] = useState('1');
  const staticAuctionState = calculateAuctionState(config);

  // Auction data - using cached hook for better performance
  const {
    cachedAuctionState,
    // error: auctionFetchError,
    loading: auctionFetchLoading,
    // isCreatorChain,
    isSubscriberChain,
    refetch: refreshCacheAuctionData
  } = useCachedAuction({
    applicationId,
    pollInterval: 5000,
  });


    // Auction mutation
  const auctionMutation = useAuctionMutations({
    applicationId,
    onBidSuccess(quantity) {
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


  const handleQuickBid = () => {
    setQuickBidAmount('1');
    setShowQuickBidModal(true);
  };

  const handleQuickBidSubmit = async () => {
    if (!quickBidAmount || Number(quickBidAmount) <= 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid bid quantity.',
      });
      return;
    }

    setShowQuickBidModal(false);
    await auctionMutation.placeBid(Number(quickBidAmount));
  };



  // Extract auction data with config fallback
  // Calculate derived values from blockchain data with config fallback
  const currentPrice = Number(cachedAuctionState?.currentPrice ?? staticAuctionState.currentPrice ?? 0);
  const floorPrice = Number(cachedAuctionState?.floorPrice ?? config.floorPrice ?? 0);
  const totalQuantity = Number(cachedAuctionState?.totalQuantity ?? config.totalQuantity ?? 0);
  const soldQuantity = Number(cachedAuctionState?.quantitySold ?? 0);
  const status = cachedAuctionState?.status.toLowerCase() as 'active' | 'scheduled' | 'ended' || staticAuctionState?.status;
  const remaining = totalQuantity - soldQuantity;
  const startTimestamp = Number(cachedAuctionState?.startTimestamp ?? config.startTimestamp ?? 0);
  const percentageSold = Math.round((soldQuantity / totalQuantity) * 100) 

  const statusConfig = {
    active: { label: "Live", variant: "success" as const, glow: true },
    scheduled: { label: "scheduled", variant: "info" as const, glow: false },
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

          {status === "scheduled" && startTimestamp && (
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
              {/* Action Buttons */}
              <div className="w-full flex gap-2">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 gap-2"
                  onClick={handleQuickBid}
                  disabled={remaining === 0 || auctionMutation.isBidding}
                >
                  <Zap className="w-4 h-4" />
                  Quick Bid
                </Button>
                <Link href={`/auctions/${applicationId}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Details
                  </Button>
                </Link>
              </div>

              {/* Helper text */}
              {!auctionMutation.canWrite && (
                <p className="text-xs text-text-secondary text-center leading-tight">
                  Wallet will connect automatically
                </p>
              )}
            </>
          )}
          {status === "scheduled" && (
            <Link href={`/auctions/${applicationId}`} className="w-full">
              <Button variant="outline" size="md" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                View Details
              </Button>
            </Link>
          )}
          {status === "ended" && (
            <Link href={`/auctions/${applicationId}`} className="w-full">
              <Button variant="ghost" size="md" className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                View Results
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>

      {/* Quick Bid Modal */}
      {showQuickBidModal && (
        <QuickBidModal
          open={showQuickBidModal}
          onClose={() => setShowQuickBidModal(false)}
          onSubmit={handleQuickBidSubmit}
          currentPrice={currentPrice}
          remaining={remaining}
          bidAmount={quickBidAmount}
          setBidAmount={setQuickBidAmount}
          isSubmitting={auctionMutation.isBidding}
          title={title || 'Fairdrop Auction'}
        />
      )}
    </>
  );
}

// Quick Bid Modal Component
interface QuickBidModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  currentPrice: number;
  remaining: number;
  bidAmount: string;
  setBidAmount: (amount: string) => void;
  isSubmitting: boolean;
  title: string;
}

function QuickBidModal({
  open,
  onClose,
  onSubmit,
  currentPrice,
  remaining,
  bidAmount,
  setBidAmount,
  isSubmitting,
  title,
}: QuickBidModalProps) {
  const totalCost = currentPrice * Number(bidAmount || 0);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />

          <div className="relative w-full max-w-md transform animate-in zoom-in-95 duration-200">
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-4 left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-float" />
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />
            </div>

            <div className="relative bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary">Quick Bid</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{title}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 rounded-lg bg-glass border border-white/10">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-text-secondary">Current Price</span>
                    <span className="text-xs text-text-secondary">{remaining} remaining</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {currentPrice} <span className="text-sm text-text-secondary">ALGO</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">Quantity</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-3 text-lg border border-white/20 rounded-lg bg-glass backdrop-blur-sm text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isSubmitting}
                    min="1"
                    max={remaining}
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Max: {remaining}</span>
                    <span>Total: <span className="font-semibold text-primary">{totalCost.toFixed(2)} ALGO</span></span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                  <p className="text-xs text-info leading-relaxed">
                    Your wallet will be connected automatically if not already connected.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={onSubmit}
                  disabled={!bidAmount || Number(bidAmount) <= 0 || remaining === 0 || isSubmitting}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
