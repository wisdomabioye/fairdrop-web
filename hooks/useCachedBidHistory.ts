/**
 * useCachedBidHistory Hook
 *
 * Optimized hook for accessing user bid history with intelligent caching.
 * Replaces userBidData with better performance and longer TTL.
 *
 * Features:
 * - Reads from centralized store (instant)
 * - Subscribes to store updates
 * - Longer TTL (30s) since bid history changes less frequently
 * - Automatic invalidation on bid placement
 * - Stale-while-revalidate strategy
 *
 * Usage:
 * const { bids, summary, loading, error, refetch } = useCachedBidHistory('app-id', 'wallet-address');
 */

import { useEffect, useCallback } from 'react';
import { useLineraApplication } from 'linera-react-client';
import { useAuctionStore } from '@/stores/auction-store';
import type { UserBid, UserBidSummary } from '@/stores/auction-store';

export interface UseCachedBidHistoryOptions {
  /** Application ID for the auction */
  applicationId: string;
  /** Wallet address to fetch bids for */
  walletAddress?: string;
  /** Skip fetching (useful when wallet not connected) */
  skip?: boolean;
}

export interface UseCachedBidHistoryResult {
  /** List of bids for this bidder */
  bidsForBidder: UserBid[] | null;
  /** Summary statistics for this bidder */
  bidderSummary: UserBidSummary | null;
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
  /** Manually refetch bid history */
  refetch: () => Promise<void>;
}

export function useCachedBidHistory(
  options: UseCachedBidHistoryOptions
): UseCachedBidHistoryResult {
  const { applicationId, walletAddress, skip = false } = options;

  const { app, isReady } = useLineraApplication(applicationId);

  // Subscribe to store
  const { userBidHistory, fetchUserBidHistory, isStale: checkIsStale } = useAuctionStore();

  // Get cached entry
  const entry = walletAddress ? userBidHistory.get(applicationId)?.get(walletAddress) : undefined;

  // Derived state
  const bidsForBidder = entry?.bids ?? null;
  const bidderSummary = entry?.summary ?? null;
  const loading = entry?.status === 'loading' && !bidsForBidder;
  const isFetching = entry?.status === 'loading';
  const error = entry?.error ?? null;
  const hasLoadedOnce = entry?.status === 'success' || bidsForBidder !== null;
  const isStale = walletAddress ? checkIsStale(applicationId, 'userBidHistory', walletAddress) : true;

  /**
   * Fetch bid history
   */
  const refetch = useCallback(async () => {
    if (!isReady || !app || skip || !walletAddress) return;

    try {
      await fetchUserBidHistory(applicationId, walletAddress, app);
    } catch (err) {
      console.error('[useCachedBidHistory] Refetch failed:', err);
    }
  }, [isReady, app, skip, applicationId, walletAddress, fetchUserBidHistory]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (skip || !isReady || !app || !walletAddress) return;

    // Fetch if no data or stale
    if (!entry || isStale) {
      refetch();
    }
  }, [applicationId, walletAddress, isReady, app, skip, isStale, refetch]);

  return {
    bidsForBidder,
    bidderSummary,
    loading,
    isFetching,
    error,
    hasLoadedOnce,
    isStale,
    refetch,
  };
}
