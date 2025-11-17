'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriceIndicator } from "@/components/auction/price-indicator";
import { CountdownTimer } from "@/components/auction/countdown-timer";
import { ProgressBar } from "@/components/auction/progress-bar";
import { StatusBadge } from "@/components/auction/status-badge";
import { calculateAuctionState, AuctionConfig } from "@/utils/auction";
import { cn } from "@/lib/utils";
import {
  getLineraClientManager,
  useLineraClient,
  useLineraApplication,
  useWalletConnection
} from 'linera-react-client';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuctionInfo extends AuctionConfig {
  // Data from smart contract, default to zero on initialization
  quantitySold: number | null;
  quantityRemaining: number | null;
  currentPrice: number | null;
  timeUntilNextDecrement: number | null;
  /** default is 'active' */
  status: 'active' | 'upcoming' | 'ended';
}

interface ChainInfo {
  creatorChainId: string;
  currentChainId: string;
  hasState: boolean;
}

interface AuctionData {
  chainInfo: ChainInfo;
  auctionInfo: AuctionInfo | null;
  quantityRemaining: number | null;
  currentPrice: number | null;
}

interface EventNotification {
  chain_id: string;
  reason: {
    BlockExecuted?: {
      height: string;
      hash: string;
    };
    NewBlock: {
      height: string;
      hash: string;
    };
  };
}

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
  const { client, isInitialized } = useLineraClient();
  const { connect, isConnected } = useWalletConnection();
  const { query, mutate, isReady, canWrite, isLoading } = useLineraApplication(applicationId);

  const [blockchainState, setBlockchainState] = useState<AuctionData | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('1');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const getAuctionData = async (blockHash?: string) => {
    const chainInfoResult = await query<string>(
      '{ "query": "query { chainInfo { currentChainId creatorChainId hasState  } quantityRemaining currentPrice }" }',
      blockHash
    );
    console.log('chainInfoResult', chainInfoResult);
    return JSON.parse(chainInfoResult) as AuctionData;
  };

  // Set up notification listener
  useEffect(() => {
    if (!client) return;

    // Subscribe to notifications from the Linera client
    client.onNotification((notification: EventNotification) => {
      console.log('Linera notification received:', notification);
      if (notification.reason) {
        getAuctionData(notification.reason.BlockExecuted?.hash || notification.reason.NewBlock.hash);
      } else {
        console.log(notification.reason);
      }
    });
  }, [client]);

  // Fetch balance when client is ready
  useEffect(() => {
    if (!client) return;

    const fetchBalance = async () => {
      try {
        const bal = await client.balance();
        console.log('balance', bal);
        setBalance(bal);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
  }, [client]);

  // Query auction state
  useEffect(() => {
    if (!isReady) return;

    const queryAuctionState = async () => {
      try {
        const data = await getAuctionData();
        setBlockchainState(data);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error('Failed to query auction state:', err);
      }
    };

    // Initial query
    queryAuctionState();
  }, [isReady]);

  // Update auction state every second for calculated values
  const [auctionState, setAuctionState] = useState(() => calculateAuctionState(config));
  useEffect(() => {
    const interval = setInterval(() => {
      setAuctionState(calculateAuctionState(config));
    }, 1000);

    return () => clearInterval(interval);
  }, [config]);

  // Calculate derived values from blockchain data with config fallback
  const currentPrice = blockchainState?.currentPrice ?? auctionState.currentPrice;
  const floorPrice = blockchainState?.auctionInfo?.floorPrice ?? config.floorPrice ?? 0;
  const totalQuantity = blockchainState?.auctionInfo?.totalQuantity ?? config.totalQuantity ?? 0;
  const soldQuantity = blockchainState?.auctionInfo?.quantitySold ?? 0;
  const status = blockchainState?.auctionInfo?.status ?? auctionState.status;
  const remaining = totalQuantity - soldQuantity;
  const startTimestamp = blockchainState?.auctionInfo?.startTimestamp ?? config.startTimestamp;
  const timeUntilNextDecrement = blockchainState?.auctionInfo?.timeUntilNextDecrement;

  // Use calculated state for price decrease info
  const {
    timeToFloorPrice,
    percentageDecreased,
    isAtFloorPrice,
    nextPriceDropIn,
  } = auctionState;

  // Place a bid
  const handlePlaceBid = async () => {
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error('Invalid Amount', {
        description: 'Please enter a valid bid quantity.',
      });
      return;
    }

    try {
      // Prompt wallet connection if not connected
      if (!canWrite) {
        setIsConnecting(true);
        try {
          await connect();

          // Wait for wallet connection and app reload
          let attempts = 0;
          const maxAttempts = 30; // 3 seconds max

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get fresh app instance to check if it has write permissions
            const clientManager = getLineraClientManager();

            if (clientManager?.canWrite()) {
              // Client manager is ready, get a fresh app instance
              const freshApp = await clientManager.getApplication(applicationId);
              if (freshApp) {
                // Try to mutate with the fresh app instance
                console.log('Wallet connected, proceeding with bid...');

                const mutationResult = await freshApp.mutate(
                  `{ "query": "mutation { placeBid(quantity: ${Number(bidAmount)} ) }" }`
                );
                console.log('mutationResult', mutationResult);

                // Refresh balance
                if (client) {
                  const bal = await client.balance();
                  setBalance(bal);
                }

                setBidAmount('1');
                setIsConnecting(false);
                toast.success('Bid Placed Successfully!', {
                  description: `Your bid for ${bidAmount} item(s) has been placed successfully.`,
                });
                if (onBid) {
                  onBid(applicationId);
                }
                return;
              }
            }

            attempts++;
          }

          throw new Error('Wallet connection timeout - please try again');
        } catch (err) {
          setIsConnecting(false);
          throw err;
        }
      }

      // If already connected, use the regular mutate
      setIsBidding(true);
      const mutationResult = await mutate(
        `{ "query": "mutation { placeBid(quantity: ${Number(bidAmount)} ) }" }`
      );
      console.log('mutationResult', mutationResult);

      // Refresh balance
      if (client) {
        const bal = await client.balance();
        setBalance(bal);
      }

      setBidAmount('1');
      setIsBidding(false);
      toast.success('Bid Placed Successfully!', {
        description: `Your bid for ${bidAmount} item(s) has been placed successfully.`,
      });
      if (onBid) {
        onBid(applicationId);
      }
    } catch (err) {
      console.error('Failed to place bid:', err);
      toast.error('Bid Failed', {
        description: err instanceof Error ? err.message : 'An unknown error occurred. Please try again.',
      });
      setIsConnecting(false);
      setIsBidding(false);
    }
  };

  // Loading states - only show on initial load, not when wallet disconnects
  if ((!isInitialized || isLoading) && !hasLoadedOnce) {
    return (
      <Card variant="cosmic" className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 text-center">
          <p className="text-text-secondary text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isReady && !hasLoadedOnce) {
    return (
      <Card variant="cosmic" className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 text-center">
          <p className="text-text-secondary text-sm">Loading application...</p>
        </CardContent>
      </Card>
    );
  }

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

          {status === 'upcoming' && startTimestamp && (
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
        {isConnected && balance && (
          <div className="text-xs text-text-secondary flex items-center justify-between py-1 px-2 rounded bg-glass/50">
            <span>Balance:</span>
            <span className="font-medium">{balance}</span>
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
                disabled={isConnecting || isBidding}
                min="1"
              />
              <Button
                variant="primary"
                size="sm"
                className="px-3 shrink-0"
                onClick={handlePlaceBid}
                disabled={!bidAmount || remaining === 0 || isConnecting || isBidding}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : isBidding ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Bidding...
                  </>
                ) : canWrite ? "Bid" : "Connect"}
              </Button>
            </div>

            {/* Helper text */}
            {!canWrite && !isConnecting && !isBidding && (
              <p className="text-xs text-text-secondary text-center leading-tight">
                Will connect wallet
              </p>
            )}
          </>
        )}
        {status === 'upcoming' && (
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
