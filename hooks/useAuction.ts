/**
 * useAuction Hook
 *
 * Unified hook for interacting with Fairdrop auction on both creator and subscriber chains.
 * Automatically detects which chain you're on and fetches the appropriate data.
 *
 * Features:
 * - Auto-detects creator vs subscriber chain
 * - Fetches real auction state on creator chain
 * - Fetches cached state on subscriber chains
 * - Provides mutations for bidding and subscription management
 * - Type-safe with full TypeScript support
 */

import { useQuery as useApolloQuery, useMutation as useApolloMutation } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import {
  GET_AUCTION_FULL_STATE,
  GET_SUBSCRIBER_CHAIN_STATE,
  GET_CHAIN_INFO,
  PLACE_BID,
  SUBSCRIBE_AUCTION,
  UNSUBSCRIBE_AUCTION,
} from '@/lib/graphql/queries';
import {
  AuctionStatus,
  type GetAuctionFullStateResponse,
  type GetSubscriberChainStateResponse,
  type GetChainInfoResponse,
  type PlaceBidResponse,
  type SubscribeAuctionResponse,
  type UnsubscribeAuctionResponse,
  type UnifiedAuctionState,
  type ChainContext,
} from '@/lib/graphql/types';

export interface UseAuctionOptions {
  /** Optional chain ID to monitor events from (for subscriber chains) */
  eventChainId?: string;
  /** Polling interval in milliseconds (default: 5000ms = 5s) */
  pollInterval?: number;
  /** Skip initial query (useful if you only need mutations) */
  skip?: boolean;
}

export interface UseAuctionResult {
  // State
  /** Unified auction state (works on both creator and subscriber chains) */
  auction: UnifiedAuctionState | null;
  /** Chain context information */
  chainContext: ChainContext | null;
  /** Whether we're on the creator chain */
  isCreatorChain: boolean;
  /** Whether we're on a subscriber chain */
  isSubscriberChain: boolean;

  // Loading states
  /** Is initial query loading? */
  loading: boolean;
  /** Is data being refetched? */
  refetching: boolean;
  /** Any query errors */
  error: Error | undefined;

  // Mutations
  /** Place a bid for specified quantity */
  placeBid: (quantity: number) => Promise<boolean>;
  /** Subscribe to auction updates (for non-creator chains) */
  subscribeToAuction: () => Promise<boolean>;
  /** Unsubscribe from auction updates */
  unsubscribeFromAuction: () => Promise<boolean>;

  // Mutation states
  /** Is bid being placed? */
  placingBid: boolean;
  /** Is subscription operation in progress? */
  subscribing: boolean;

  // Utilities
  /** Manually refetch auction data */
  refetch: () => Promise<void>;
  /** Check if auction is active and accepting bids */
  canPlaceBid: boolean;
}

export function useAuction(options: UseAuctionOptions = {}): UseAuctionResult {
  const { eventChainId, pollInterval = 5000, skip = false } = options;

  // First, determine which chain we're on
  const { data: chainInfoData, loading: chainInfoLoading } = useApolloQuery<GetChainInfoResponse>(
    GET_CHAIN_INFO,
    { skip }
  );

  const chainContext = useMemo<ChainContext | null>(() => {
    if (!chainInfoData?.chainInfo) return null;

    const { currentChainId, creatorChainId, hasState } = chainInfoData.chainInfo;
    return {
      isCreatorChain: hasState && currentChainId === creatorChainId,
      currentChainId,
      creatorChainId,
    };
  }, [chainInfoData]);

  const isCreatorChain = chainContext?.isCreatorChain ?? false;
  const isSubscriberChain = chainContext !== null && !isCreatorChain;

  // Query for creator chain (has authoritative state)
  const {
    data: creatorData,
    loading: creatorLoading,
    error: creatorError,
    refetch: creatorRefetch,
  } = useApolloQuery<GetAuctionFullStateResponse>(GET_AUCTION_FULL_STATE, {
    skip: skip || !isCreatorChain,
    pollInterval: isCreatorChain ? pollInterval : undefined,
  });

  // Query for subscriber chain (uses cached state from events)
  const {
    data: subscriberData,
    loading: subscriberLoading,
    error: subscriberError,
    refetch: subscriberRefetch,
  } = useApolloQuery<GetSubscriberChainStateResponse>(GET_SUBSCRIBER_CHAIN_STATE, {
    variables: { eventChainId },
    skip: skip || !isSubscriberChain,
    pollInterval: isSubscriberChain ? pollInterval : undefined,
  });

  // Determine which data to use
  const loading = chainInfoLoading || (isCreatorChain ? creatorLoading : subscriberLoading);
  const refetching = isCreatorChain ? creatorLoading : subscriberLoading;
  const error = creatorError || subscriberError;

  // Build unified auction state
  const auction = useMemo<UnifiedAuctionState | null>(() => {
    if (!chainContext) return null;

    if (isCreatorChain && creatorData?.auctionInfo) {
      const info = creatorData.auctionInfo;
      return {
        owner: info.owner,
        startTimestamp: info.startTimestamp,
        startPrice: info.startPrice,
        floorPrice: info.floorPrice,
        decrementRate: info.decrementRate,
        decrementInterval: info.decrementInterval,
        totalQuantity: info.totalQuantity,
        quantitySold: info.quantitySold,
        quantityRemaining: info.quantityRemaining,
        currentPrice: info.currentPrice,
        status: info.status,
        currentTime: info.currentTime,
        timeUntilNextDecrement: info.timeUntilNextDecrement,
        lastUpdated: info.currentTime,
        chainContext,
      };
    }

    if (isSubscriberChain && subscriberData?.cachedAuctionState) {
      const cached = subscriberData.cachedAuctionState;
      const quantityRemaining = String(
        Number(cached.totalQuantity) - Number(cached.currentQuantitySold)
      );
      return {
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
        chainContext,
      };
    }

    return null;
  }, [chainContext, isCreatorChain, isSubscriberChain, creatorData, subscriberData]);

  // Mutations
  const [placeBidMutation, { loading: placingBid }] = useApolloMutation<PlaceBidResponse>(PLACE_BID);
  const [subscribeMutation, { loading: subscribingToAuction }] =
    useApolloMutation<SubscribeAuctionResponse>(SUBSCRIBE_AUCTION);
  const [unsubscribeMutation, { loading: unsubscribingFromAuction }] =
    useApolloMutation<UnsubscribeAuctionResponse>(UNSUBSCRIBE_AUCTION);

  const subscribing = subscribingToAuction || unsubscribingFromAuction;

  // Place bid handler
  const placeBid = useCallback(
    async (quantity: number): Promise<boolean> => {
      try {
        const result = await placeBidMutation({
          variables: { quantity },
        });
        return result.data?.placeBid ?? false;
      } catch (error) {
        console.error('[useAuction] Failed to place bid:', error);
        return false;
      }
    },
    [placeBidMutation]
  );

  // Subscribe to auction handler
  const subscribeToAuction = useCallback(async (): Promise<boolean> => {
    try {
      const result = await subscribeMutation();
      return result.data?.subscribe ?? false;
    } catch (error) {
      console.error('[useAuction] Failed to subscribe to auction:', error);
      return false;
    }
  }, [subscribeMutation]);

  // Unsubscribe from auction handler
  const unsubscribeFromAuction = useCallback(async (): Promise<boolean> => {
    try {
      const result = await unsubscribeMutation();
      return result.data?.unsubscribe ?? false;
    } catch (error) {
      console.error('[useAuction] Failed to unsubscribe from auction:', error);
      return false;
    }
  }, [unsubscribeMutation]);

  // Refetch handler
  const refetch = useCallback(async () => {
    if (isCreatorChain) {
      await creatorRefetch();
    } else if (isSubscriberChain) {
      await subscriberRefetch();
    }
  }, [isCreatorChain, isSubscriberChain, creatorRefetch, subscriberRefetch]);

  // Can place bid if auction is active
  const canPlaceBid = useMemo(() => {
    if (!auction) return false;
    return auction.status === AuctionStatus.Active && Number(auction.quantityRemaining) > 0;
  }, [auction]);

  return {
    // State
    auction,
    chainContext,
    isCreatorChain,
    isSubscriberChain,

    // Loading
    loading,
    refetching,
    error,

    // Mutations
    placeBid,
    subscribeToAuction,
    unsubscribeFromAuction,

    // Mutation states
    placingBid,
    subscribing,

    // Utilities
    refetch,
    canPlaceBid,
  };
}
