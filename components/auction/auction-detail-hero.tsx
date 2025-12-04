'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountdownTimer } from '@/components/auction/countdown-timer';
import { ProgressBar } from '@/components/auction/progress-bar';
import { StatusBadge } from '@/components/auction/status-badge';
import { useCachedAuction, useAuctionMutations } from '@/hooks';
import { calculateAuctionState, AuctionConfig } from '@/utils/auction';
import { Clock, TrendingDown, Package, Users } from 'lucide-react';
import { useWalletConnection } from 'linera-react-client';
import { AuctionStatus } from '@/stores/auction-store';

export interface AuctionDetailHeroProps {
  applicationId: string;
  title: string;
  description: string;
  imageUrl: string;
  config: AuctionConfig;
}

export function AuctionDetailHero({
  applicationId,
  title,
  description,
  imageUrl,
  config,
}: AuctionDetailHeroProps) {
  const { connect, isConnected, isConnecting } = useWalletConnection();
  const [bidAmount, setBidAmount] = useState('1');

  // Use cached auction data
  const {
    cachedAuctionState,
    // loading: auctionFetchLoading,
    // isSubscriberChain,
    refetch: refreshCacheAuctionData,
  } = useCachedAuction({
    applicationId,
    pollInterval: 5000,
  });

  // Auction mutations
  const auctionMutation = useAuctionMutations({
    applicationId,
    onBidSuccess(quantity) {
      setBidAmount('1');
      toast.success('Bid Placed Successfully!', {
        description: `Your bid for ${quantity} item(s) has been placed successfully.`,
      });
      refreshCacheAuctionData();
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
  });

  // Extract data
  const currentPrice = Number(
    cachedAuctionState?.currentPrice ?? 0
  );
  const floorPrice = Number(cachedAuctionState?.floorPrice ?? config.floorPrice ?? 0);
  const totalQuantity = Number(
    cachedAuctionState?.totalQuantity ?? config.totalQuantity ?? 0
  );
  const soldQuantity = Number(cachedAuctionState?.quantitySold ?? 0);
  const status = cachedAuctionState?.status || AuctionStatus.Scheduled;
  const remaining = totalQuantity - soldQuantity;
  const startTimestamp = Number(
    cachedAuctionState?.startTimestamp ?? config.startTimestamp ?? 0
  );
  const percentageSold = Math.round((soldQuantity / totalQuantity) * 100);

  // Calculate dynamic auction state - this needs to be recalculated with current time
  // to get accurate countdowns
  const staticAuctionState = calculateAuctionState(config);

  const {
    timeToFloorPrice,
    percentageDecreased,
    isAtFloorPrice,
    nextPriceDropIn,
  } = staticAuctionState;

  const handlePlaceBid = async () => {
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid bid quantity.',
      });
      return;
    }
    await auctionMutation.placeBid(Number(bidAmount));
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 py-12 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Image & Info */}
          <div className="space-y-6">
            {/* Image */}
            <Card variant="cosmic" className="overflow-hidden group">
              <div className="relative aspect-video">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <StatusBadge status={status} size="md" />
                  {remaining <= 10 && remaining > 0 && (
                    <Badge variant="warning" glow className="text-sm">
                      Only {remaining} left!
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Title & Description */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
                {title}
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed">
                {description}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card variant="cosmic" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Total Supply</p>
                    <p className="text-lg font-bold text-text-primary">{totalQuantity}</p>
                  </div>
                </div>
              </Card>

              <Card variant="cosmic" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Sold</p>
                    <p className="text-lg font-bold text-text-primary">
                      {soldQuantity} ({percentageSold}%)
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right: Bidding Interface */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <Card variant="cosmic" className="p-6 space-y-6">
              {/* Price Display */}
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-text-secondary">Current Price</span>
                  {!isAtFloorPrice && (
                    <span className="text-xs text-warning flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Decreasing
                    </span>
                  )}
                </div>
                <div className="text-5xl font-bold text-primary">
                  {currentPrice}
                  <span className="text-xl text-text-secondary ml-2">PTOKEN</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Floor Price:</span>
                  <span className="font-semibold text-text-primary">{floorPrice} PTOKEN</span>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  value={percentageDecreased}
                  variant="gradient"
                  size="md"
                  showLabel={true}
                  label={`${percentageDecreased.toFixed(0)}% to floor`}
                />
              </div>

              {/* Timers */}
              <div className="space-y-3 p-4 rounded-lg bg-glass border border-white/10">
                {status === AuctionStatus.Active && !isAtFloorPrice && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <CountdownTimer
                        label="Next price drop "
                        targetTime={Date.now() + nextPriceDropIn}
                        compact={false}
                        variant="primary"
                        size="md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-secondary" />
                      <CountdownTimer
                        label="Floor price in "
                        targetTime={Date.now() + timeToFloorPrice}
                        compact={false}
                        variant="secondary"
                        size="md"
                      />
                    </div>
                  </>
                )}

                {status === AuctionStatus.Active && isAtFloorPrice && (
                  <div className="text-center py-2">
                    <Badge variant="success" glow className="text-sm">
                      At Floor Price - Best Deal!
                    </Badge>
                  </div>
                )}

                {status === AuctionStatus.Scheduled && startTimestamp && (
                  <CountdownTimer
                    label="Auction starts in"
                    targetTime={startTimestamp}
                    compact={false}
                    variant="warning"
                    size="md"
                  />
                )}
              </div>

              {/* Bidding Interface */}
              {status === AuctionStatus.Active && (
                <div className="space-y-4">
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
                      disabled={auctionMutation.isBidding}
                      min="1"
                      max={remaining}
                    />
                    <p className="text-xs text-text-secondary">
                      {remaining} remaining • Total: {currentPrice * Number(bidAmount || 0)} PTOKEN
                    </p>
                  </div>
                  
                  {
                    isConnected ?
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full text-lg py-6"
                      onClick={handlePlaceBid}
                      disabled={!bidAmount || remaining === 0 || auctionMutation.isBidding}
                      isLoading={auctionMutation.isBidding}
                    >
                      {auctionMutation.isBidding ? 'Placing Bid...' : 'Place Bid'}
                    </Button>
                    :
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full text-lg py-6"
                      onClick={() => connect()}
                      disabled={isConnecting}
                      isLoading={isConnecting}
                    >
                      {isConnecting ? 'Connecting Wallet...' : 'Connect Wallet'}
                    </Button>
                  }
                </div>
              )}

              {status === AuctionStatus.Scheduled && (
                <Button variant="outline" size="lg" className="w-full" disabled>
                  Auction Not Started
                </Button>
              )}

              {status === AuctionStatus.Ended && (
                <Button variant="ghost" size="lg" className="w-full" disabled>
                  Auction Ended
                </Button>
              )}
            </Card>

            {/* Additional Info Card */}
            <Card variant="cosmic" className="p-4">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>Live auction • Updates every 5 seconds</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
