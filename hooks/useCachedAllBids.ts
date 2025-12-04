/**
 * useCachedAllBids Hook
 *
 * Optimized hook for accessing all bids for an auction with intelligent caching.
 * Fetches paginated bid history for the entire auction (not user-specific).
 *
 * Features:
 * - Reads from centralized store (instant)
 * - Supports pagination with offset/limit
 * - Medium TTL (10s) for general bid history
 * - Stale-while-revalidate strategy
 *
 * Usage:
 * const { bids, totalCount, hasMore, loading, refetch } = useCachedAllBids({
 *   applicationId: 'app-id',
 *   status: 'ACCEPTED',
 *   offset: 0,
 *   limit: 50
 * });
 */

import { useEffect, useCallback } from 'react';
import { useLineraApplication } from 'linera-react-client';
import { useAuctionStore } from '@/stores/auction-store';
import type { BidWithOwner } from '@/stores/auction-store';

export interface UseCachedAllBidsOptions {
  /** Application ID for the auction */
  applicationId: string;
  /** Filter by bid status (default: 'ACCEPTED') */
  status?: string;
  /** Minimum bid price filter */
  minPrice?: number;
  /** Pagination offset (default: 0) */
  offset?: number;
  /** Number of bids to fetch (default: 50) */
  limit?: number;
  /** Skip fetching */
  skip?: boolean;
}

export interface UseCachedAllBidsResult {
  /** Array of all bids */
  bids: BidWithOwner[];
  /** Total count of bids matching filters */
  totalCount: number;
  /** Whether there are more bids to load */
  hasMore: boolean;
  /** Is initial loading? */
  loading: boolean;
  /** Is currently fetching? */
  isFetching: boolean;
  /** Any errors */
  error: Error | null;
  /** Has loaded at least once? */
  hasLoadedOnce: boolean;
  /** Is cached data stale? */
  isStale: boolean;
  /** Manually refetch all bids */
  refetch: () => Promise<void>;
}

export function useCachedAllBids(options: UseCachedAllBidsOptions): UseCachedAllBidsResult {
  const {
    applicationId,
    status = 'ACCEPTED',
    minPrice = 0,
    offset = 0,
    limit = 50,
    skip = false,
  } = options;

  const { app, isReady } = useLineraApplication(applicationId);

  // Subscribe to store
  const { allBidsHistory, fetchAllBids, isStale: checkIsStale } = useAuctionStore();

  // Get cached entry
  const entry = allBidsHistory.get(applicationId);

  // Derived state
  const bids = entry?.bids ?? [];
  const totalCount = entry?.totalCount ?? 0;
  const hasMore = entry?.hasMore ?? false;
  const loading = entry?.status === 'loading' && bids.length === 0;
  const isFetching = entry?.status === 'loading';
  const error = entry?.error ?? null;
  const hasLoadedOnce = entry?.status === 'success' || bids.length > 0;
  const isStale = checkIsStale(applicationId, 'allBids');

  /**
   * Fetch all bids
   */
  const refetch = useCallback(async () => {
    if (!isReady || !app || skip) return;

    try {
      await fetchAllBids(applicationId, app, {
        status,
        minPrice,
        offset,
        limit,
      });
    } catch (err) {
      console.error('[useCachedAllBids] Refetch failed:', err);
    }
  }, [isReady, app, skip, applicationId, status, minPrice, offset, limit, fetchAllBids]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (skip || !isReady || !app) return;

    // Fetch if no data or stale
    if (!entry || isStale) {
      refetch();
    }
  }, [applicationId, isReady, app, skip, status, offset, isStale, refetch]);

  return {
    bids,
    totalCount,
    hasMore,
    loading,
    isFetching,
    error,
    hasLoadedOnce,
    isStale,
    refetch,
  };
}
