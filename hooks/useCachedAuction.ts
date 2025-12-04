/**
 * useCachedAuction Hook
 *
 * Optimized hook for accessing auction data with intelligent caching.
 * Replaces useAuctionData with better performance and resource usage.
 *
 * Features:
 * - Reads from centralized store (instant)
 * - Subscribes to store updates for this applicationId
 * - Triggers fetch if data is stale or missing
 * - Returns cached data immediately (no loading state after first fetch)
 * - Automatically manages polling subscription
 * - Stale-while-revalidate: shows cached data while fetching fresh data
 *
 * Usage:
 * const { auction, loading, error, refetch, isStale } = useCachedAuction('app-id');
 */

import { useEffect, useState, useCallback } from 'react';
import { useLineraApplication } from 'linera-react-client';
import { useAuctionStore } from '@/stores/auction-store';
import type { CachedAuctionStateFlat, ChainInfoFlat } from '@/stores/auction-store';

export interface UseCachedAuctionOptions {
  /** Application ID for the auction */
  applicationId: string;
  /** Polling interval in milliseconds (default: 5000ms) */
  pollInterval?: number;
  /** Skip fetching (useful when conditionally loading) */
  skip?: boolean;
}

export interface UseCachedAuctionResult {
  /** Cached auction state */
  cachedAuctionState: CachedAuctionStateFlat | null;
  /** Chain information */
  chainInfo: ChainInfoFlat | null;
  /** Is creator chain? */
  isCreatorChain: boolean;
  /** Is subscriber chain? */
  isSubscriberChain: boolean;
  /** Is initial loading? (only true on very first fetch) */
  loading: boolean;
  /** Is currently fetching? (may be true while showing cached data) */
  isFetching: boolean;
  /** Any errors */
  error: Error | null;
  /** Has loaded at least once? */
  hasLoadedOnce: boolean;
  /** Is cached data stale? */
  isStale: boolean;
  /** Manually refetch auction data */
  refetch: () => Promise<void>;
}

export function useCachedAuction(options: UseCachedAuctionOptions): UseCachedAuctionResult {
  const { applicationId, pollInterval = 5000, skip = false } = options;

  const { app, isReady } = useLineraApplication(applicationId);

  // Subscribe to store
  const {
    auctions,
    fetchAuction,
    // invalidateAuction,
    startPollingAuction,
    isStale: checkIsStale,
  } = useAuctionStore();

  // Get cached entry
  const entry = auctions.get(applicationId);

  // Local state for managing subscriptions
  const [_pollingUnsubscribe, setPollingUnsubscribe] = useState<(() => void) | null>(null);

  // Derived state
  const cachedAuctionState = entry?.data ?? null;
  const chainInfo = entry?.chainInfo ?? null;
  const isCreatorChain = chainInfo?.hasState ?? false;
  const isSubscriberChain = chainInfo !== null && !isCreatorChain;
  const loading = entry?.status === 'loading' && !cachedAuctionState;
  const isFetching = entry?.status === 'loading';
  const error = entry?.error ?? null;
  const hasLoadedOnce = entry?.status === 'success' || cachedAuctionState !== null;
  const isStale = checkIsStale(applicationId, 'auction');

  /**
   * Fetch auction data
   */
  const refetch = useCallback(async () => {
    if (!isReady || !app || skip) return;

    try {
      await fetchAuction(applicationId, app);
    } catch (err) {
      console.error('[useCachedAuction] Refetch failed:', err);
    }
  }, [isReady, app, skip, applicationId, fetchAuction]);

  /**
   * Initial fetch and setup polling
   */
  useEffect(() => {
    if (skip || !isReady || !app) return;

    // Fetch if no data or stale
    if (!entry || isStale) {
      refetch();
    }

    // Start polling
    const unsubscribe = startPollingAuction(applicationId, app, pollInterval);
    setPollingUnsubscribe(() => unsubscribe);

    // Cleanup
    return () => {
      unsubscribe();
      setPollingUnsubscribe(null);
    };
  }, [applicationId, isReady, app, skip, pollInterval]);

  // Note: We intentionally don't include refetch/isStale in dependencies
  // to avoid re-creating polling subscriptions unnecessarily

  return {
    cachedAuctionState,
    chainInfo,
    isCreatorChain,
    isSubscriberChain,
    loading,
    isFetching,
    error,
    hasLoadedOnce,
    isStale,
    refetch,
  };
}
