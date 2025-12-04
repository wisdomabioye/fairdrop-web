/**
 * Centralized Auction Store
 *
 * Global state management for auction data using Zustand.
 * Provides normalized caching, request deduplication, and intelligent polling.
 *
 * Features:
 * - Normalized state: one entry per applicationId
 * - Request deduplication: prevents duplicate in-flight requests
 * - Intelligent polling: one interval per applicationId
 * - Stale-while-revalidate: show cached data, fetch in background
 * - Automatic cache invalidation on mutations
 */

import { create } from 'zustand';
import { queryDeduplicator } from '@/lib/query-deduplicator';
import { pollingManager } from '@/lib/polling-manager';
import { ApplicationClient } from 'linera-react-client';

// TTL constants (in milliseconds)
const AUCTION_DATA_TTL = 5000; // 5 seconds
const USER_BID_HISTORY_TTL = 30000; // 30 seconds (user-specific bids)
const ALL_BIDS_HISTORY_TTL = 10000; // 10 seconds (all bids for auction)

export enum BidStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

// Response types
export interface ChainInfoFlat {
  currentChainId: string;
  creatorChainId: string;
  hasState: boolean;
}

/**
 * Auction status enum matching AuctionStatus
 */
export enum AuctionStatus {
  /** Auction is scheduled for the future */
  Scheduled = 'SCHEDULED',
  /** Auction is currently active and accepting bids */
  Active = 'ACTIVE',
  /** Auction has ended */
  Ended = 'ENDED',
}


export interface AuctionInfoFlat {
  owner: string;
  startTimestamp: string;
  endTimestamp: string;
  startPrice: string;
  floorPrice: string;
  decrementRate: string;
  decrementInterval: string;
  totalQuantity: string;
  quantitySold: string;
  quantityRemaining?: string;
  currentPrice: string;
  status: AuctionStatus;
  currentTime?: string;
  timeUntilNextDecrement?: string | null;
}


export interface CachedAuctionStateFlat {
  owner: string;
  startTimestamp: string;
  endTimestamp: string;
  startPrice: string;
  floorPrice: string;
  decrementRate: string;
  decrementInterval: string;
  totalQuantity: string;
  quantitySold: string;
  status: AuctionStatus;
  currentPrice: string;
  lastUpdated?: string;
}

export interface UserBid {
  quantity: string;
  bidPrice: string;
  timestamp: string;
  status: BidStatus;
  clearingPrice: string;
}

export interface UserBidSummary {
  totalQuantity: string;
  totalCost: string;
  totalRefund: string;
  netCost: string;
  acceptedBids: string;
  rejectedBids: string;
}

export interface BidWithOwner extends UserBid {
  bidder: string;
}

export interface AllBidsResponse {
  bids: BidWithOwner[];
  totalCount: number;
  hasMore: boolean;
}

// Store types
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuctionCacheEntry {
  data: CachedAuctionStateFlat | null;
  chainInfo: ChainInfoFlat | null;
  timestamp: number;
  status: FetchStatus;
  error: Error | null;
}

export interface UserBidHistoryCacheEntry {
  bids: UserBid[] | null;
  summary: UserBidSummary | null;
  timestamp: number;
  status: FetchStatus;
  error: Error | null;
}

export interface AllBidsCacheEntry {
  bids: BidWithOwner[];
  totalCount: number;
  hasMore: boolean;
  timestamp: number;
  status: FetchStatus;
  error: Error | null;
}

export interface AuctionStore {
  // Normalized caches
  auctions: Map<string, AuctionCacheEntry>;
  userBidHistory: Map<string, Map<string, UserBidHistoryCacheEntry>>; // applicationId -> walletAddress -> data
  allBidsHistory: Map<string, AllBidsCacheEntry>; // applicationId -> all bids data

  // Actions
  fetchAuction: (applicationId: string, app: ApplicationClient) => Promise<void>;
  fetchUserBidHistory: (applicationId: string, walletAddress: string, app: ApplicationClient) => Promise<void>;
  fetchAllBids: (applicationId: string, app: ApplicationClient, options?: { status?: string; minPrice?: number; offset?: number; limit?: number }) => Promise<void>;
  invalidateAuction: (applicationId: string) => void;
  invalidateUserBidHistory: (applicationId: string, walletAddress?: string) => void;
  invalidateAllBids: (applicationId: string) => void;
  invalidateAll: () => void;

  // Polling management
  startPollingAuction: (applicationId: string, app: ApplicationClient, interval?: number) => () => void;
  stopPollingAuction: (applicationId: string) => void;

  // Utilities
  isStale: (applicationId: string, type: 'auction' | 'userBidHistory' | 'allBids', walletAddress?: string) => boolean;
  getAuction: (applicationId: string) => AuctionCacheEntry | undefined;
  getUserBidHistory: (applicationId: string, walletAddress: string) => UserBidHistoryCacheEntry | undefined;
  getAllBids: (applicationId: string) => AllBidsCacheEntry | undefined;
}

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
      endTimestamp
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
    cachedAuctionState {
      owner
      startTimestamp
      endTimestamp
      startPrice
      floorPrice
      decrementRate
      decrementInterval
      totalQuantity
      quantitySold
      status
      currentPrice
      lastUpdated
    }
  }`
};

const BIDDER_CHAIN_QUERY = (bidderAddress: string) => ({
  query: `query {
    bidsForBidder(bidder: "${bidderAddress}") {
      quantity
      bidPrice
      timestamp
      status
      clearingPrice
    }
    bidderSummary(bidder: "${bidderAddress}") {
      totalQuantity
      totalCost
      totalRefund
      netCost
      acceptedBids
      rejectedBids
    }
  }`
});

const ALL_BIDS_QUERY = (options: {
  status?: string;
  minPrice?: number;
  offset?: number;
  limit?: number;
}) => ({
  query: `
    query {
      getBids(
        status: "${options.status || 'ACCEPTED'}",
        minPrice: "${options.minPrice || 0}",
        offset: ${options.offset || 0},
        limit: ${options.limit || 50}
      ) {
        bids { bidder, quantity, bidPrice, timestamp, status, clearingPrice }
        totalCount
        hasMore
      }
    }
  `
});

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  auctions: new Map(),
  userBidHistory: new Map(),
  allBidsHistory: new Map(),

  // Fetch auction data with deduplication
  fetchAuction: async (applicationId: string, app: ApplicationClient) => {
    const key = `auction-${applicationId}`;

    // Use deduplicator to prevent duplicate requests
    await queryDeduplicator.deduplicate(key, async () => {
      // Update status to loading
      set((state) => {
        const newAuctions = new Map(state.auctions);
        const existing = newAuctions.get(applicationId);
        newAuctions.set(applicationId, {
          ...existing,
          data: existing?.data ?? null,
          chainInfo: existing?.chainInfo ?? null,
          timestamp: existing?.timestamp ?? Date.now(),
          status: 'loading',
          error: null,
        } as AuctionCacheEntry);
        return { auctions: newAuctions };
      });

      try {
        if (!app?.publicClient) {
          throw new Error('Application not ready');
        }

        // Get chain info if not cached
        let chainInfo = get().auctions.get(applicationId)?.chainInfo;

        if (!chainInfo) {
          const chainInfoResult = await app.publicClient.query<string>(
            JSON.stringify(CHAIN_INFO_QUERY)
          );
          const parsed = JSON.parse(chainInfoResult) as { data: { chainInfo: ChainInfoFlat } };
          chainInfo = parsed.data.chainInfo;
        }

        // Fetch auction data based on chain type
        let cachedAuctionState: CachedAuctionStateFlat | null = null;

        if (chainInfo?.hasState) {
          // Creator chain
          const result = await app.publicClient.query<string>(
            JSON.stringify(CREATOR_CHAIN_QUERY)
          );
          const parsed = JSON.parse(result) as {
            data: { auctionInfo: AuctionInfoFlat };
          };

          if (parsed.data.auctionInfo) {
            const info = parsed.data.auctionInfo;
            cachedAuctionState = {
              owner: info.owner,
              startTimestamp: (Number(info.startTimestamp) / 1000).toString(), // Microseconds to milliseconds
              endTimestamp: (Number(info.endTimestamp) / 1000).toString(), // Microseconds to milliseconds
              startPrice: info.startPrice,
              floorPrice: info.floorPrice,
              decrementRate: info.decrementRate,
              decrementInterval: info.decrementInterval,
              totalQuantity: info.totalQuantity,
              quantitySold: info.quantitySold,
              currentPrice: info.currentPrice,
              status: info.status,
              lastUpdated: info.currentTime,
            };
          }
        } else {
          // Subscriber chain
          const result = await app.publicClient.query<string>(
            JSON.stringify(SUBSCRIBER_CHAIN_QUERY)
          );
          console.log('[AuctionData]', JSON.parse(result))

          const parsed = JSON.parse(result) as {
            data: { cachedAuctionState: CachedAuctionStateFlat | null };
          };

          if (parsed.data.cachedAuctionState) {
            cachedAuctionState = {
              ...parsed.data.cachedAuctionState,
              startTimestamp: (Number(parsed.data.cachedAuctionState.startTimestamp) / 1000).toFixed(), // Microseconds to milliseconds
              endTimestamp: (Number(parsed.data.cachedAuctionState.endTimestamp) / 1000).toFixed() // Microseconds to milliseconds
            };  
          }
          
        }

        // Update cache with success
        set((state) => {
          const newAuctions = new Map(state.auctions);
          newAuctions.set(applicationId, {
            data: cachedAuctionState,
            chainInfo,
            timestamp: Date.now(),
            status: 'success',
            error: null,
          });
          return { auctions: newAuctions };
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch auction');

        // Update cache with error
        set((state) => {
          const newAuctions = new Map(state.auctions);
          const existing = newAuctions.get(applicationId);
          newAuctions.set(applicationId, {
            data: existing?.data ?? null,
            chainInfo: existing?.chainInfo ?? null,
            timestamp: existing?.timestamp ?? Date.now(),
            status: 'error',
            error: err,
          });
          return { auctions: newAuctions };
        });

        throw err;
      }
    });
  },

  // Fetch user bid history with deduplication
  fetchUserBidHistory: async (applicationId: string, walletAddress: string, app: ApplicationClient) => {
    const key = `user-bid-${applicationId}-${walletAddress}`;

    await queryDeduplicator.deduplicate(key, async () => {
      // Update status to loading
      set((state) => {
        const newUserBidHistory = new Map(state.userBidHistory);
        const appBids = newUserBidHistory.get(applicationId) ?? new Map();
        const existing = appBids.get(walletAddress);

        appBids.set(walletAddress, {
          bids: existing?.bids ?? null,
          summary: existing?.summary ?? null,
          timestamp: existing?.timestamp ?? Date.now(),
          status: 'loading',
          error: null,
        });

        newUserBidHistory.set(applicationId, appBids);
        return { userBidHistory: newUserBidHistory };
      });

      try {
        if (!app?.publicClient) {
          throw new Error('Application not ready');
        }

        const result = await app.publicClient.query<string>(
          JSON.stringify(BIDDER_CHAIN_QUERY(walletAddress))
        );
        console.log('[UserBidHistory]', JSON.parse(result))

        const parsed = JSON.parse(result) as {
          data: {
            bidsForBidder: UserBid[] | null;
            bidderSummary: UserBidSummary | null;
          };
        };

        // Update cache with success
        set((state) => {
          const newUserBidHistory = new Map(state.userBidHistory);
          const appBids = newUserBidHistory.get(applicationId) ?? new Map();

          appBids.set(walletAddress, {
            bids: parsed.data.bidsForBidder,
            summary: parsed.data.bidderSummary,
            timestamp: Date.now(),
            status: 'success',
            error: null,
          });

          newUserBidHistory.set(applicationId, appBids);
          return { userBidHistory: newUserBidHistory };
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch user bid history');

        // Update cache with error
        set((state) => {
          const newUserBidHistory = new Map(state.userBidHistory);
          const appBids = newUserBidHistory.get(applicationId) ?? new Map();
          const existing = appBids.get(walletAddress);

          appBids.set(walletAddress, {
            bids: existing?.bids ?? null,
            summary: existing?.summary ?? null,
            timestamp: existing?.timestamp ?? Date.now(),
            status: 'error',
            error: err,
          });

          newUserBidHistory.set(applicationId, appBids);
          return { userBidHistory: newUserBidHistory };
        });

        throw err;
      }
    });
  },

  // Fetch all bids for auction with deduplication
  fetchAllBids: async (
    applicationId: string,
    app: ApplicationClient,
    options: { status?: string; minPrice?: number; offset?: number; limit?: number } = {}
  ) => {
    const key = `all-bids-${applicationId}-${options.status}-${options.offset}`;

    await queryDeduplicator.deduplicate(key, async () => {
      // Update status to loading
      set((state) => {
        const newAllBidsHistory = new Map(state.allBidsHistory);
        const existing = newAllBidsHistory.get(applicationId);

        newAllBidsHistory.set(applicationId, {
          bids: existing?.bids ?? [],
          totalCount: existing?.totalCount ?? 0,
          hasMore: existing?.hasMore ?? false,
          timestamp: existing?.timestamp ?? Date.now(),
          status: 'loading',
          error: null,
        });

        return { allBidsHistory: newAllBidsHistory };
      });

      try {
        if (!app?.publicClient) {
          throw new Error('Application not ready');
        }

        const result = await app.publicClient.query<string>(
          JSON.stringify(ALL_BIDS_QUERY(options))
        );
        
        console.log('[AllBidHistory]', JSON.parse(result));

        const parsed = JSON.parse(result) as {
          data: {
            getBids: AllBidsResponse;
          };
        };

        // Update cache with success
        set((state) => {
          const newAllBidsHistory = new Map(state.allBidsHistory);

          newAllBidsHistory.set(applicationId, {
            bids: parsed.data.getBids.bids,
            totalCount: parsed.data.getBids.totalCount,
            hasMore: parsed.data.getBids.hasMore,
            timestamp: Date.now(),
            status: 'success',
            error: null,
          });

          return { allBidsHistory: newAllBidsHistory };
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to fetch all bids');

        // Update cache with error
        set((state) => {
          const newAllBidsHistory = new Map(state.allBidsHistory);
          const existing = newAllBidsHistory.get(applicationId);

          newAllBidsHistory.set(applicationId, {
            bids: existing?.bids ?? [],
            totalCount: existing?.totalCount ?? 0,
            hasMore: existing?.hasMore ?? false,
            timestamp: existing?.timestamp ?? Date.now(),
            status: 'error',
            error: err,
          });

          return { allBidsHistory: newAllBidsHistory };
        });

        throw err;
      }
    });
  },

  // Invalidate auction cache
  invalidateAuction: (applicationId: string) => {
    set((state) => {
      const newAuctions = new Map(state.auctions);
      const existing = newAuctions.get(applicationId);
      if (existing) {
        newAuctions.set(applicationId, {
          ...existing,
          timestamp: 0, // Mark as stale
        });
      }
      return { auctions: newAuctions };
    });
  },

  // Invalidate user bid history cache
  invalidateUserBidHistory: (applicationId: string, walletAddress?: string) => {
    set((state) => {
      const newUserBidHistory = new Map(state.userBidHistory);
      const appBids = newUserBidHistory.get(applicationId);

      if (appBids) {
        if (walletAddress) {
          // Invalidate specific wallet
          const existing = appBids.get(walletAddress);
          if (existing) {
            appBids.set(walletAddress, {
              ...existing,
              timestamp: 0,
            });
          }
        } else {
          // Invalidate all wallets for this application
          appBids.forEach((value, key) => {
            appBids.set(key, {
              ...value,
              timestamp: 0,
            });
          });
        }

        newUserBidHistory.set(applicationId, appBids);
      }

      return { userBidHistory: newUserBidHistory };
    });
  },

  // Invalidate all bids cache
  invalidateAllBids: (applicationId: string) => {
    set((state) => {
      const newAllBidsHistory = new Map(state.allBidsHistory);
      const existing = newAllBidsHistory.get(applicationId);
      if (existing) {
        newAllBidsHistory.set(applicationId, {
          ...existing,
          timestamp: 0, // Mark as stale
        });
      }
      return { allBidsHistory: newAllBidsHistory };
    });
  },

  // Invalidate all caches
  invalidateAll: () => {
    set({ auctions: new Map(), userBidHistory: new Map(), allBidsHistory: new Map() });
  },

  // Start polling for an auction
  startPollingAuction: (applicationId: string, app: any, interval: number = 5000) => {
    const key = `auction-${applicationId}`;

    return pollingManager.subscribe(
      key,
      () => get().fetchAuction(applicationId, app),
      interval
    );
  },

  // Stop polling for an auction
  stopPollingAuction: (applicationId: string) => {
    // Polling manager handles this automatically via unsubscribe
  },

  // Check if data is stale
  isStale: (applicationId: string, type: 'auction' | 'userBidHistory' | 'allBids', walletAddress?: string) => {
    const now = Date.now();

    if (type === 'auction') {
      const entry = get().auctions.get(applicationId);
      if (!entry || entry.status === 'idle') return true;
      return now - entry.timestamp > AUCTION_DATA_TTL;
    } else if (type === 'userBidHistory') {
      const appBids = get().userBidHistory.get(applicationId);
      if (!appBids || !walletAddress) return true;

      const entry = appBids.get(walletAddress);
      if (!entry || entry.status === 'idle') return true;
      return now - entry.timestamp > USER_BID_HISTORY_TTL;
    } else {
      const entry = get().allBidsHistory.get(applicationId);
      if (!entry || entry.status === 'idle') return true;
      return now - entry.timestamp > ALL_BIDS_HISTORY_TTL;
    }
  },

  // Get auction from cache
  getAuction: (applicationId: string) => {
    return get().auctions.get(applicationId);
  },

  // Get user bid history from cache
  getUserBidHistory: (applicationId: string, walletAddress: string) => {
    return get().userBidHistory.get(applicationId)?.get(walletAddress);
  },

  // Get all bids from cache
  getAllBids: (applicationId: string) => {
    return get().allBidsHistory.get(applicationId);
  },
}));
