'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceIndicator } from "@/components/auction/price-indicator";
import { CountdownTimer } from "@/components/auction/countdown-timer";
import { ProgressBar } from "@/components/auction/progress-bar";
import { StatusBadge } from "@/components/auction/status-badge";
import { calculateAuctionState, AuctionConfig } from "@/utils/auction";
import { useCachedAuction, useAuctionMutations, /* useAuctionNotifications */ } from '@/hooks';
import { ExternalLink, Zap } from 'lucide-react';
import { useWalletConnection } from 'linera-react-client';
import { AuctionStatus } from '@/stores/auction-store';

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
  const { connect, isConnected } = useWalletConnection();
  const [showQuickBidModal, setShowQuickBidModal] = useState(false);
  const [quickBidAmount, setQuickBidAmount] = useState('1');

  // Use client-side calculated state for UI responsiveness
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
    pollInterval: 15000,
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

  const handleQuickBid = () => {
    setQuickBidAmount('1');
    setShowQuickBidModal(true);
  };

  const handleQuickBidSubmit = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!quickBidAmount || Number(quickBidAmount) <= 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid bid quantity.',
      });
      return;
    }

    setShowQuickBidModal(false);
    await auctionMutation.placeBid(Number(quickBidAmount));
  };


  // Calculate derived values from blockchain data with config fallback
  const currentPrice = Number(cachedAuctionState?.currentPrice ?? staticAuctionState.currentPrice ?? 0);
  const floorPrice = Number(cachedAuctionState?.floorPrice ?? config.floorPrice ?? 0);
  const totalQuantity = Number(cachedAuctionState?.totalQuantity ?? config.totalQuantity ?? 0);
  const soldQuantity = Number(cachedAuctionState?.quantitySold ?? 0);
  const status = cachedAuctionState?.status || staticAuctionState.status;
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
              status={AuctionStatus.Active}
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
          {status === AuctionStatus.Active && !isAtFloorPrice && (
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

          {status === AuctionStatus.Active && isAtFloorPrice && (
            <div className="text-center py-1">
              <span className="text-xs text-success font-semibold">
                At Floor Price
              </span>
            </div>
          )}

          {status === AuctionStatus.Scheduled && startTimestamp && (
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
        {status === AuctionStatus.Active && (
          <>
            {/* Action Buttons */}
            <div className="w-full flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleQuickBid}
                disabled={remaining === 0 || auctionMutation.isBidding}
              >
                <Zap className="w-3.5 h-3.5" />
                Quick Bid
              </Button>
              <Link href={`/auctions/${applicationId}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
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
        {status === AuctionStatus.Scheduled && (
          <>
            <Link href={`/auctions/${applicationId}`} className="w-full">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                View Details
              </Button>
            </Link>
          </>
        )}
        {status === AuctionStatus.Ended && (
          <>
            <Link href={`/auctions/${applicationId}`} className="w-full">
              <Button variant="ghost" size="sm" className="w-full gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                View Results
              </Button>
            </Link>
          </>
        )}
      </CardFooter>

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
    </Card>
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
      {/* Custom Modal (not using Dialog component for more control) */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md transform animate-in zoom-in-95 duration-200">
            {/* Cosmic background */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-4 left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-float" />
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />
            </div>

            {/* Modal content */}
            <div className="relative bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary">
                      Quick Bid
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Current Price Display */}
                <div className="p-4 rounded-lg bg-glass border border-white/10">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm text-text-secondary">Current Price</span>
                    <span className="text-xs text-text-secondary">{remaining} remaining</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {currentPrice} <span className="text-sm text-text-secondary">ALGO</span>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-primary">
                    Quantity
                  </label>
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

                {/* Info Box */}
                <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                  <p className="text-xs text-info leading-relaxed">
                    Your wallet will be connected automatically if not already connected.
                  </p>
                </div>
              </div>

              {/* Footer */}
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
