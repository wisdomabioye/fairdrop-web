/**
 * useAuctionData Hook
 *
 * Fetches auction data using linera-react-client's query system.
 * Works on both creator and subscriber chains.
 *
 * Key Features:
 * - Auto-detects creator vs subscriber chain using chainInfo
 * - Uses auctionInfo on creator chain (hasState: true)
 * - Uses cachedAuctionState on subscriber chains (hasState: false)
 * - Provides unified auction state interface
 * - Integrates with Linera notification system for real-time updates
 *
 * IMPORTANT: On subscriber chains, you must call subscribeToAuction() first
 * to populate the cachedAuctionState. Otherwise, you'll get null data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLineraApplication } from 'linera-react-client';
import type { UnifiedAuctionState, AuctionStatus } from '@/lib/graphql/types';

// GraphQL query strings
const CHAIN_INFO_QUERY = {
  query: 'query { chainInfo { currentChainId creatorChainId hasState } }'
};

const CREATOR_CHAIN_QUERY = {
  query: `query {
    chainInfo { currentChainId creatorChainId hasState }
    auctionInfo {
      owner
      startTimestamp
      startPrice
      floorPrice
      decrementRate
      decrementInterval
      totalQuantity
      quantitySold
      quantityRemaining
      currentPrice
      status
      currentTime
      timeUntilNextDecrement
    }
  }`
};

const SUBSCRIBER_CHAIN_QUERY = {
  query: `query {
    chainInfo { currentChainId creatorChainId hasState }
    cachedAuctionState {
      owner
      startTimestamp
      startPrice
      floorPrice
      decrementRate
      decrementInterval
      totalQuantity
      currentQuantitySold
      currentStatus
      currentPrice
      timestamp
    }
  }`
};

const QUICK_UPDATE_QUERY = {
  query: 'query { currentPrice quantityRemaining quantitySold }'
};

// Response types
interface ChainInfo {
  currentChainId: string;
  creatorChainId: string;
  hasState: boolean;
}

interface AuctionInfo {
  owner: string;
  startTimestamp: string;
  startPrice: string;
  floorPrice: string;
  decrementRate: string;
  decrementInterval: string;
  totalQuantity: string;
  quantitySold: string;
  quantityRemaining: string;
  currentPrice: string;
  status: AuctionStatus;
  currentTime: string;
  timeUntilNextDecrement: string | null;
}

interface CachedAuctionState {
  owner: string;
  startTimestamp: string;
  startPrice: string;
  floorPrice: string;
  decrementRate: string;
  decrementInterval: string;
  totalQuantity: string;
  currentQuantitySold: string;
  currentStatus: AuctionStatus;
  currentPrice: string;
  timestamp: string;
}

interface CreatorChainResponse {
  chainInfo: ChainInfo;
  auctionInfo: AuctionInfo | null;
}

interface SubscriberChainResponse {
  chainInfo: ChainInfo;
  cachedAuctionState: CachedAuctionState | null;
}

interface QuickUpdateResponse {
  currentPrice: string | null;
  quantityRemaining: string | null;
  quantitySold: string;
}

export interface UseAuctionDataOptions {
  /** Application ID for the auction */
  applicationId: string;
  /** Whether to skip fetching (useful for conditional rendering) */
  skip?: boolean;
  /** Polling interval in milliseconds (default: 5000ms = 5s) */
  pollInterval?: number;
}

export interface UseAuctionDataResult {
  /** Unified auction state */
  auction: UnifiedAuctionState | null;
  /** Whether we're on the creator chain */
  isCreatorChain: boolean;
  /** Whether we're on a subscriber chain */
  isSubscriberChain: boolean;
  /** Creator chain ID */
  creatorChainId: string | null;
  /** Current chain ID */
  currentChainId: string | null;
  /** Is loading initial data? */
  loading: boolean;
  /** Any errors */
  error: Error | null;
  /** Whether data has loaded at least once */
  hasLoadedOnce: boolean;
  /** Manually refetch auction data */
  refetch: () => Promise<void>;
  /** Get quick price and quantity update (lightweight, for polling) */
  refreshQuick: () => Promise<void>;
}

export function useAuctionData(options: UseAuctionDataOptions): UseAuctionDataResult {
  const { applicationId, skip = false, pollInterval = 5000 } = options;

  const { query, isReady } = useLineraApplication(applicationId);

  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [auction, setAuction] = useState<UnifiedAuctionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const isCreatorChain = chainInfo?.hasState ?? false;
  const isSubscriberChain = chainInfo !== null && !isCreatorChain;

  /**
   * Fetch complete auction data
   * Automatically detects creator vs subscriber chain and uses the right query
   */
  const fetchAuctionData = useCallback(async () => {
    if (skip || !isReady) return;

    setLoading(true);
    setError(null);

    try {
      // First, determine which chain we're on
      const chainInfoResult = await query<string>(JSON.stringify(CHAIN_INFO_QUERY));
      const { chainInfo: info } = JSON.parse(chainInfoResult) as { chainInfo: ChainInfo };
      setChainInfo(info);

      // Based on chain type, query the appropriate data
      let auctionData: UnifiedAuctionState | null = null;

      if (info.hasState) {
        // CREATOR CHAIN: Query auctionInfo directly
        console.log('[useAuctionData] On creator chain, fetching auctionInfo...');
        const result = await query<string>(JSON.stringify(CREATOR_CHAIN_QUERY));
        const parsed = JSON.parse(result) as CreatorChainResponse;

        if (parsed.auctionInfo) {
          const auction = parsed.auctionInfo;
          auctionData = {
            owner: auction.owner,
            startTimestamp: auction.startTimestamp,
            startPrice: auction.startPrice,
            floorPrice: auction.floorPrice,
            decrementRate: auction.decrementRate,
            decrementInterval: auction.decrementInterval,
            totalQuantity: auction.totalQuantity,
            quantitySold: auction.quantitySold,
            quantityRemaining: auction.quantityRemaining,
            currentPrice: auction.currentPrice,
            status: auction.status,
            currentTime: auction.currentTime,
            timeUntilNextDecrement: auction.timeUntilNextDecrement,
            lastUpdated: auction.currentTime,
            chainContext: {
              isCreatorChain: true,
              currentChainId: info.currentChainId,
              creatorChainId: info.creatorChainId,
            },
          };
        }
      } else {
        // SUBSCRIBER CHAIN: Query cachedAuctionState
        console.log('[useAuctionData] On subscriber chain, fetching cachedAuctionState...');
        const result = await query<string>(JSON.stringify(SUBSCRIBER_CHAIN_QUERY));
        const parsed = JSON.parse(result) as SubscriberChainResponse;

        if (parsed.cachedAuctionState) {
          const cached = parsed.cachedAuctionState;
          const quantityRemaining = String(
            Number(cached.totalQuantity) - Number(cached.currentQuantitySold)
          );

          auctionData = {
            owner: cached.owner,
            startTimestamp: cached.startTimestamp,
            startPrice: cached.startPrice,
            floorPrice: cached.floorPrice,
            decrementRate: cached.decrementRate,
            decrementInterval: cached.decrementInterval,
            totalQuantity: cached.totalQuantity,
            quantitySold: cached.currentQuantitySold,
            quantityRemaining,
            currentPrice: cached.currentPrice,
            status: cached.currentStatus,
            currentTime: cached.timestamp,
            timeUntilNextDecrement: null, // Not available on subscriber chains
            lastUpdated: cached.timestamp,
            chainContext: {
              isCreatorChain: false,
              currentChainId: info.currentChainId,
              creatorChainId: info.creatorChainId,
            },
          };
        } else {
          console.warn(
            '[useAuctionData] No cached state found. ' +
            'Make sure to call subscribeToAuction() first on subscriber chains.'
          );
        }
      }

      setAuction(auctionData);
      setHasLoadedOnce(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch auction data');
      setError(error);
      console.error('[useAuctionData]', error);
    } finally {
      setLoading(false);
    }
  }, [skip, isReady, query]);

  /**
   * Lightweight refresh for price and quantity only
   * Use this for frequent polling to reduce query size
   */
  const refreshQuick = useCallback(async () => {
    if (!auction || !isReady) return;

    try {
      const result = await query<string>(JSON.stringify(QUICK_UPDATE_QUERY));
      const parsed = JSON.parse(result) as QuickUpdateResponse;

      if (parsed.currentPrice !== null && parsed.quantityRemaining !== null) {
        setAuction(prev =>
          prev
            ? {
                ...prev,
                currentPrice: parsed.currentPrice!,
                quantityRemaining: parsed.quantityRemaining!,
                quantitySold: parsed.quantitySold,
              }
            : null
        );
      }
    } catch (err) {
      console.error('[useAuctionData] Failed to refresh price/quantity:', err);
    }
  }, [auction, isReady, query]);

  // Initial fetch
  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  // Polling for quick updates
  useEffect(() => {
    if (skip || !isReady || !auction || pollInterval <= 0) return;

    const interval = setInterval(() => {
      refreshQuick();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [skip, isReady, auction, pollInterval, refreshQuick]);

  return {
    auction,
    isCreatorChain,
    isSubscriberChain,
    creatorChainId: chainInfo?.creatorChainId ?? null,
    currentChainId: chainInfo?.currentChainId ?? null,
    loading,
    error,
    hasLoadedOnce,
    refetch: fetchAuctionData,
    refreshQuick,
  };
}
