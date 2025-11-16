'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuctionTimer } from "./auction-timer";
import { Button } from "@/components/ui/button";
import { Dialog, useDialog } from "@/components/ui/dialog";
import {
  getLineraClientManager,
  useLineraClient,
  useLineraApplication,
  useWalletConnection
} from 'linera-react-client';

interface AuctionConfig {
  startTimestamp: number | null;
  decrementRate: number | null;
  decrementInterval: number | null;
  startPrice: number | null;
  floorPrice: number | null;
  totalQuantity: number | null;
}

interface AuctionInfo extends AuctionConfig {
  // Data from smart contract, default to zero on initialization
  quantitySold: number | null;
  quantityRemaining: number | null;
  currentPrice: number | null;
  timeUntilNextDecrement: number | null;
  /** default is 'active' */
  status: 'active' | 'upcoming' | 'ended',
}

interface ChainInfo {
  creatorChainId: string,
  currentChainId: string,
  hasState: boolean,
}

interface AuctionData {
  chainInfo: ChainInfo,
  auctionInfo: AuctionInfo | null,
  quantityRemaining: number | null,
  currentPrice: number | null,
}

interface EventNotification {
  chain_id: string,
  reason: {
    BlockExecuted?: {
      height: string,
      hash: string,
    },
    NewBlock: {
      height: string,
      hash: string,
    }
  }
}

export interface AuctionCardProps {
  applicationId: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  config?: AuctionConfig;
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
  const { client, isInitialized } = useLineraClient();
  const { connect, isConnected } = useWalletConnection();
  const { query, mutate, isReady, canWrite, isLoading } = useLineraApplication(applicationId);
  const { dialogState, showDialog, closeDialog } = useDialog();

  const [auctionState, setAuctionState] = useState<AuctionData | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const getAuctionData = async (blockHash?: string) => {
    const chainInfoResult = await query<string>(
      '{ "query": "query { chainInfo { currentChainId creatorChainId hasState  } quantityRemaining currentPrice }" }',
      blockHash
    );
    console.log('chainInfoResult', chainInfoResult);
    return JSON.parse(chainInfoResult) as AuctionData
  }

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
        console.log('balance', bal)
        setBalance(bal);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
  }, [client]);

  // Query auction state with polling
  useEffect(() => {
    if (!isReady) return;
    const queryAuctionState = async () => {
      try {
        const data = await getAuctionData();
        setAuctionState(data);

      } catch (err) {
        console.error('Failed to query auction state:', err);
      }
    };

    // Initial query
    queryAuctionState();

  }, [isReady]);

  // Place a bid
  const handlePlaceBid = async () => {
    if (!bidAmount) return;

    try {
      // Prompt wallet connection if not connected
      if (!canWrite) {
        setIsConnecting(true);
        try {
          await connect();

          // Wait for wallet connection and app reload
          // After connection, useApplication will reload the app with new permissions
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

                setBidAmount('');
                setIsConnecting(false);
                showDialog({
                  title: 'Bid Placed Successfully!',
                  description: `Your bid for ${bidAmount} item(s) has been placed successfully.`,
                  variant: 'success',
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
      const mutationResult = await mutate(
        `{ "query": "mutation { placeBid(quantity: ${Number(bidAmount)} ) }" }`
      );
      console.log('mutationResult', mutationResult);

      // Refresh balance
      if (client) {
        const bal = await client.balance();
        setBalance(bal);
      }

      setBidAmount('');
      showDialog({
        title: 'Bid Placed Successfully!',
        description: `Your bid for ${bidAmount} item(s) has been placed successfully.`,
        variant: 'success',
      });
      if (onBid) {
        onBid(applicationId);
      }
    } catch (err) {
      console.error('Failed to place bid:', err);
      showDialog({
        title: 'Bid Failed',
        description: err instanceof Error ? err.message : 'An unknown error occurred. Please try again.',
        variant: 'error',
      });
      setIsConnecting(false);
    }
  };

  // Loading states
  if (!isInitialized || isLoading) {
    return (
      <Card variant="cosmic" className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <p className="text-text-secondary">Loading Linera client...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isReady) {
    return (
      <Card variant="cosmic" className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <p className="text-text-secondary">Loading application...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate derived values from blockchain data with config fallback
  const currentPrice = auctionState?.currentPrice ?? config?.startPrice ?? 0;
  const floorPrice = auctionState?.auctionInfo?.floorPrice ?? config?.floorPrice ?? 0;
  const totalSupply = auctionState?.auctionInfo?.totalQuantity ?? config?.totalQuantity ?? 0;
  const soldQuantity = auctionState?.auctionInfo?.quantitySold ?? 0;
  const status = auctionState?.auctionInfo?.status ?? 'active';
  const percentageSold = totalSupply > 0 ? (soldQuantity / totalSupply) * 100 : 0;
  const remaining = totalSupply - soldQuantity;
  const startTimestamp = auctionState?.auctionInfo?.startTimestamp ?? config?.startTimestamp;
  const timeUntilNextDecrement = auctionState?.auctionInfo?.timeUntilNextDecrement;

  const statusConfig = {
    active: { label: "Live", variant: "success" as const, glow: true },
    upcoming: { label: "Upcoming", variant: "info" as const, glow: false },
    ended: { label: "Ended", variant: "default" as const, glow: false },
  };

  return (
    <>
    <Card variant="cosmic" hover className="overflow-hidden group w-full h-full flex flex-col min-w-[280px]">
      {/* Animated background particles - smaller and subtler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-4 right-4 w-20 h-20 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Compact Header */}
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
          </div>
          <Badge variant={isConnected ? "success" : "warning"} className="text-xs shrink-0">
            {isConnected ? "✓" : "○"}
          </Badge>
        </div>

        <CardTitle className="group-hover:text-primary transition-colors text-lg leading-tight">
          {title || 'Fairdrop Auction'}
        </CardTitle>

        {description && (
          <p className="text-xs text-text-secondary leading-snug line-clamp-2">{description}</p>
        )}
      </CardHeader>

      {/* Compact Content */}
      <CardContent className="relative space-y-3 pt-0 flex-1">
        {/* Image Preview - smaller */}
        {imageUrl && (
          <div className="relative h-32 sm:h-36 rounded-lg overflow-hidden bg-glass border border-white/10">
            {/* eslint-disable-next-line */}
            <img
              src={imageUrl}
              alt={title || 'Auction item'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Compact Price & Supply Grid */}
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
            <p className="text-lg font-bold text-text-primary">{remaining}/{totalSupply}</p>
            <p className="text-xs text-text-secondary">{percentageSold.toFixed(0)}% sold</p>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <Progress value={soldQuantity} max={totalSupply} variant="gradient" className="h-1.5" />

        {/* Compact Timer */}
        {status === "active" && timeUntilNextDecrement && (
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-glass border border-white/10">
            <span className="text-xs text-text-secondary">Next drop</span>
            <span className="text-sm font-semibold text-primary">
              {Math.floor(timeUntilNextDecrement / 1000)}s
            </span>
          </div>
        )}

        {status === "upcoming" && startTimestamp && (
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-glass border border-white/10">
            <span className="text-xs text-text-secondary">Starts in</span>
            <AuctionTimer endTime={startTimestamp} />
          </div>
        )}

        {/* Compact Wallet Info - only show when connected */}
        {isConnected && balance && (
          <div className="text-xs text-text-secondary flex items-center justify-between py-1 px-2 rounded bg-glass/50">
            <span>Balance:</span>
            <span className="font-medium">{balance}</span>
          </div>
        )}
      </CardContent>

      {/* Compact Footer */}
      <CardFooter className="relative flex-col space-y-2 pt-3">
        {status === "active" && (
          <>
            {/* Compact Bid Input & Button Combined */}
            <div className="w-full flex gap-2">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Qty"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-white/20 rounded-lg bg-glass backdrop-blur-sm text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                disabled={isConnecting}
                min="1"
              />
              <Button
                variant="primary"
                size="md"
                className="px-4 min-w-[100px] shrink-0"
                onClick={handlePlaceBid}
                isLoading={isConnecting}
                disabled={!bidAmount || remaining === 0 || isConnecting}
              >
                {isConnecting ? 'Wait...' : canWrite ? "Place Bid" : "Connect"}
              </Button>
            </div>

            {/* Compact Helper text */}
            {!canWrite && !isConnecting && (
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

    {/* Dialog for notifications - rendered via portal */}
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
