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
 * - Automatic error recovery for critical WASM binding failures
 * - Configurable polling with zero resource usage when disabled
 *
 * Error Recovery:
 * - Detects critical WASM binding errors that cause all requests to fail
 * - Tracks consecutive errors and automatically reloads the page after threshold
 * - Prevents infinite reload loops with 30-second cooldown
 * - We can be disabled via autoReloadOnCriticalError option
 *
 * IMPORTANT: On subscriber chains, we must call subscribeToAuction() first
 * to populate the cachedAuctionState. Otherwise, you'll get null data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLineraApplication } from 'linera-react-client';
// import { handleWasmFailureRecovery } from '@/utils/auction';
import { withTimeout } from '@/utils/time';
import { usePolling } from './usePolling';

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

const SUBSCRIBER_CHAIN_QUERY = () => ({
  query: `query {
    cachedAuctionState {
      owner
      startTimestamp
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
    streamEventsJson
  }`
});

/**
 * Wallet Client Query
 * @returns 
 */
const BIDDER_CHAIN_QUERY = () => ({
  query: `query {
    myBids {
      quantity
      timestamp
      status
      bidPrice
      clearingPrice
    }
    myRefund
    myBidsCount
  }`
});

// const GET_STREAM_EVENTS = (chainId: string) => ({
//   query: `query {
//       streamEvents(chainId: ${chainId}) {
//         eventType
//         chainId
//         timestamp
//         eventData
//       }
//     }
//   `
// });

// const GET_STREAM_EVENTS_JSON = (chainId: string) => ({
//   query: `query {
//     streamEventsJson(chainId: ${chainId})
//   }`
// });


// Response types

/**
 * Auction status enum matching AuctionStatus
 */
enum AuctionStatus {
  /** Auction is scheduled for the future */
  Scheduled = 'SCHEDULED',
  /** Auction is currently active and accepting bids */
  Active = 'ACTIVE',
  /** Auction has ended */
  Ended = 'ENDED',
}

enum BidStatus {
    Pending = 'Pending',
    Accepted = 'Accepted',
    Rejected = 'Rejected',
}

enum EventType {
  AuctionInitialized = 'AuctionInitialized',
  BidAccepted = 'BidAccepted',
  BidRejected = 'BidRejected',
  StatusChanged = 'StatusChanged'
}

interface ChainInfoFlat {
  currentChainId: string;
  creatorChainId: string;
  hasState: boolean;
}

interface AuctionInfoFlat {
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

interface CachedAuctionStateFlat {
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

interface UserBid {
  quantity: string;
  bidPrice: string;
  timestamp: string;
  status: BidStatus;
  clearingPrice: string;
}

interface AuctionInitializedEvent extends Omit<
CachedAuctionStateFlat, 
'quantitySold' | 'status' | 'lastUpdated'
> {
  currentQuantitySold: string;
  currentStatus: AuctionStatus;
  timestamp: string
}

interface BidAcceptedEvent {
  bidder: string;
  quantity: string;
  bidPrice: string;
  newTotalSold: string;
  timestamp: string;
}

interface BidRejectedEvent {
  bidder: string;
  quantity: string;
  reason: string;
  timestamp: string;
}

interface AuctionStatusChangedEvent {
  newStatus: AuctionStatus;
  timestamp: string;
}

type EventTypeToData = {
  [EventType.AuctionInitialized]: AuctionInitializedEvent;
  [EventType.BidAccepted]: BidAcceptedEvent;
  [EventType.BidRejected]: BidRejectedEvent;
  [EventType.StatusChanged]: AuctionStatusChangedEvent;
}

type StoredStreamEvent = {
  [K in EventType]: {
    eventType: K;
    eventData: EventTypeToData[K];
    chainId: string;
    timestamp: string;
  }
}[EventType];

type CreatorChainResponse = {
  chainInfo: ChainInfoFlat;
  auctionInfo: AuctionInfoFlat
}

type SubscriberChainResponse = {
  chainInfo: ChainInfoFlat | null;
  cachedAuctionState: CachedAuctionStateFlat | null;
  streamEventsJson: string[] | null;
  streamEvents: StoredStreamEvent[] | null;
};

type BidderChainResponse = {
  myBids: UserBid[] | null;
  myRefund: string | null;
  myBidsCount: string | null;
}

export interface UseAuctionDataOptions {
  /** Application ID for the auction */
  applicationId: string;
  /** Polling interval in milliseconds (default: 5000ms = 5s) */
  pollInterval?: number;
  /** Whether to auto-reload on critical WASM errors (default: true) */
  autoReloadOnCriticalError?: boolean;
}

export interface UseAuctionDataResult extends SubscriberChainResponse {
  /** Whether we're on the creator chain */
  isCreatorChain: boolean;
  /** Whether we're on a subscriber chain */
  isSubscriberChain: boolean;
  /** Is loading initial data? */
  loading: boolean;
  /** Any errors */
  error: Error | null;
  /** Whether data has loaded at least once */
  hasLoadedOnce: boolean;
  /** Manually refetch auction data */
  refetch: () => Promise<void>;
}

export interface UseBidDataResult extends BidderChainResponse {
  /** Is loading initial data? */
  loading: boolean;
  /** Any errors */
  error: Error | null;
  /** Manually refetch bid data */
  refetch: () => Promise<void>;
}


const WASM_QUERY_ERROR = 'Wasm query timed out';

export function useAuctionData(options: UseAuctionDataOptions): UseAuctionDataResult {
  const {
    applicationId,
    pollInterval = 10000,
    autoReloadOnCriticalError = true
  } = options;

  const { app, isReady } = useLineraApplication(applicationId);
  const [chainInfo, setChainInfo] = useState<ChainInfoFlat | null>(null);
  const [streamEvents, setStreamEvents] = useState<StoredStreamEvent[] | null>(null);
  const [cachedAuctionState, setCachedAuctionState] = useState<CachedAuctionStateFlat | null>(null);
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
    if (!isReady || !app) return;

    setLoading(true);
    setError(null);

    try {
      // First, determine which chain we're on
      if (!chainInfo) {
        const chainInfoResult = await app.publicClient.query<string>(JSON.stringify(CHAIN_INFO_QUERY));
        const { data: { chainInfo: onchainChainInfo } } = JSON.parse(chainInfoResult) as { data: {chainInfo: ChainInfoFlat} };
        setChainInfo(onchainChainInfo);
      }

      
      // Based on chain type, query the appropriate data
      let cachedAuctionState: CachedAuctionStateFlat | null = null;

      if (chainInfo?.hasState) {
        // CREATOR CHAIN: Query auctionInfo directly
        console.log('[useAuctionData] On creator chain, fetching auctionInfo...');
        const result = await app.publicClient.query<string>(JSON.stringify(CREATOR_CHAIN_QUERY));
        const { data: { auctionInfo } } = JSON.parse(result) as { data: CreatorChainResponse };

        if (auctionInfo) {
          cachedAuctionState = {
            owner: auctionInfo.owner,
            startTimestamp: auctionInfo.startTimestamp,
            endTimestamp: auctionInfo.endTimestamp,
            startPrice: auctionInfo.startPrice,
            floorPrice: auctionInfo.floorPrice,
            decrementRate: auctionInfo.decrementRate,
            decrementInterval: auctionInfo.decrementInterval,
            totalQuantity: auctionInfo.totalQuantity,
            quantitySold: auctionInfo.quantitySold,
            currentPrice: auctionInfo.currentPrice,
            status: auctionInfo.status,
            lastUpdated: auctionInfo.currentTime,
          };
        }
      } else {
        // SUBSCRIBER CHAIN: Query cachedAuctionState
        console.log('[useAuctionData] On subscriber chain, fetching cachedAuctionState...');
        const result = await withTimeout(
          app.publicClient.query<string>(JSON.stringify(SUBSCRIBER_CHAIN_QUERY())),
          {ms: 5000, errorMessage: WASM_QUERY_ERROR}
        );

        console.log("onchainCachedAuctionState", JSON.parse(result))
        
        const { data: { 
          cachedAuctionState: onchainCachedAuctionState,
          streamEventsJson,
        } } = JSON.parse(result) as { data: SubscriberChainResponse };

        if (streamEventsJson) {
          setStreamEvents(streamEventsJson.map(e => JSON.parse(e)))
        }

        if (onchainCachedAuctionState) {
          cachedAuctionState = {
            owner: onchainCachedAuctionState.owner,
            startTimestamp: onchainCachedAuctionState.startTimestamp,
            endTimestamp: onchainCachedAuctionState.endTimestamp,
            startPrice: onchainCachedAuctionState.startPrice,
            floorPrice: onchainCachedAuctionState.floorPrice,
            decrementRate: onchainCachedAuctionState.decrementRate,
            decrementInterval: onchainCachedAuctionState.decrementInterval,
            totalQuantity: onchainCachedAuctionState.totalQuantity,
            quantitySold: onchainCachedAuctionState.quantitySold,
            currentPrice: onchainCachedAuctionState.currentPrice,
            status: onchainCachedAuctionState.status,
            lastUpdated: onchainCachedAuctionState.lastUpdated,
          };
        } else {
          console.warn(
            '[useAuctionData] No cached state found. ' +
            'Make sure to call subscribeToAuction() first on subscriber chains.'
          );
        }
      }

      setCachedAuctionState(cachedAuctionState);
      setHasLoadedOnce(true);

    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes(WASM_QUERY_ERROR)) {
          // await handleWasmFailureRecovery()
        }
      }
      setError(error);
      console.error('[useAuctionData]', error);

    } finally {
      setLoading(false);
    }
  }, [isReady, app, autoReloadOnCriticalError]);

  // Initial fetch and polling setup
  usePolling(fetchAuctionData, pollInterval, { immediate: true });

  return {
    streamEvents,
    streamEventsJson: null,
    cachedAuctionState,
    chainInfo,
    isCreatorChain,
    isSubscriberChain,
    loading,
    error,
    hasLoadedOnce,
    refetch: fetchAuctionData,
  };
}

export function userBidData(options: Pick<UseAuctionDataOptions, 'applicationId'>): UseBidDataResult {
  const {
    applicationId,
  } = options;

  const { app, isReady } = useLineraApplication(applicationId);
  const [userBidData, setUserBidData] = useState<BidderChainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Fetch User Related Bid
   */
  const fetchUserBidData = useCallback(async () => {
    if (!isReady || !app) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // If wallet not connected, connect first
      if (!app?.walletClient) {
        const error = new Error('Wallet not connected');
        throw error;
      }

      const userBidResult = await app.walletClient.query<string>(JSON.stringify(BIDDER_CHAIN_QUERY()))
      const { data: userBidData } = JSON.parse(userBidResult) as { data: BidderChainResponse };
      console.log("onchainUserBidData", userBidData);
      setUserBidData(userBidData);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user bid data');
      setError(error);
      console.error('[userBidData]', error);
    } finally {
      setLoading(false);
    }
  
  }, [app])


  // Initial fetch
  useEffect(() => {
    // Fetch immediately on mount
    fetchUserBidData();
  }, [fetchUserBidData]);

  return {
    loading,
    error,
    myBids: userBidData?.myBids || null,
    myBidsCount: userBidData?.myBidsCount || null,
    myRefund: userBidData?.myRefund || null,
    refetch: fetchUserBidData
  }
}