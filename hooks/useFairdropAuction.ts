/**
 * useFairdropAuction Hook
 *
 * All-in-one hook combining data fetching, mutations, and notifications.
 * This is the main hook you should use in your components.
 *
 * Example usage:
 * ```tsx
 * const auction = useFairdropAuction({
 *   applicationId: 'your-app-id',
 * });
 *
 * if (auction.loading) return <div>Loading...</div>;
 *
 * return (
 *   <div>
 *     <h2>Price: {auction.data?.currentPrice}</h2>
 *     <button onClick={() => auction.placeBid(1)}>
 *       Place Bid
 *     </button>
 *     {auction.isSubscriberChain && !auction.data && (
 *       <button onClick={auction.subscribeToAuction}>
 *         Subscribe to get data
 *       </button>
 *     )}
 *   </div>
 * );
 * ```
 */

import { useCallback } from 'react';
import { useAuctionData, type UseAuctionDataOptions } from './useAuctionData';
import { useAuctionMutations, type UseAuctionMutationsOptions } from './useAuctionMutations';
import { useAuctionNotifications } from './useAuctionNotifications';
import type { UnifiedAuctionState } from '@/lib/graphql/types';

export interface UseFairdropAuctionOptions {
  /** Application ID for the auction (required) */
  applicationId: string;
  /** Whether to skip fetching */
  skip?: boolean;
  /** Polling interval in milliseconds (default: 5000ms) */
  pollInterval?: number;
  /** Enable real-time notifications (default: true) */
  enableNotifications?: boolean;

  // Callbacks
  /** Called after successful bid placement */
  onBidSuccess?: (quantity: number) => void;
  /** Called after bid placement fails */
  onBidError?: (error: Error) => void;
  /** Called after successful subscription */
  onSubscribeSuccess?: () => void;
  /** Called when new block notification is received */
  onBlockNotification?: () => void;
}

export interface UseFairdropAuctionResult {
  // Data
  /** Unified auction state */
  data: UnifiedAuctionState | null;
  /** Creator chain ID */
  creatorChainId: string | null;
  /** Current chain ID */
  currentChainId: string | null;

  // Chain context
  /** Are we on the creator chain? */
  isCreatorChain: boolean;
  /** Are we on a subscriber chain? */
  isSubscriberChain: boolean;

  // Loading states
  /** Is initial data loading? */
  loading: boolean;
  /** Has data loaded at least once? */
  hasLoadedOnce: boolean;
  /** Is bid placement in progress? */
  isBidding: boolean;
  /** Is wallet connection in progress? */
  isConnecting: boolean;
  /** Is subscription operation in progress? */
  isSubscribing: boolean;

  // Wallet
  /** Can user write (wallet connected)? */
  canWrite: boolean;
  /** Is wallet connected? */
  isConnected: boolean;
  /** Wallet balance */
  balance: string | null;
  /** Connect wallet */
  connectWallet: () => Promise<void>;

  // Actions
  /** Place a bid for specified quantity */
  placeBid: (quantity: number) => Promise<boolean>;
  /** Subscribe to creator chain updates (for subscriber chains) */
  subscribeToAuction: () => Promise<boolean>;
  /** Unsubscribe from creator chain updates */
  unsubscribeFromAuction: () => Promise<boolean>;
  /** Manually refetch all data */
  refetch: () => Promise<void>;
  /** Quick refresh for price/quantity */
  refreshQuick: () => Promise<void>;

  // Error handling
  /** Any errors that occurred */
  error: Error | null;

  // Notifications
  /** Is listening to blockchain notifications? */
  isListeningToNotifications: boolean;
}

export function useFairdropAuction(
  options: UseFairdropAuctionOptions
): UseFairdropAuctionResult {
  const {
    applicationId,
    skip = false,
    pollInterval = 5000,
    enableNotifications = true,
    onBidSuccess,
    onBidError,
    onSubscribeSuccess,
    onBlockNotification,
  } = options;

  // Fetch auction data
  const {
    auction: data,
    isCreatorChain,
    isSubscriberChain,
    creatorChainId,
    currentChainId,
    loading,
    error,
    hasLoadedOnce,
    refetch,
    refreshQuick,
  } = useAuctionData({
    applicationId,
    skip,
    pollInterval,
  });

  // Mutation functions
  const {
    placeBid,
    subscribeToAuction,
    unsubscribeFromAuction,
    isBidding,
    isConnecting,
    isSubscribing,
    canWrite,
    isConnected,
    connectWallet,
    balance,
  } = useAuctionMutations({
    applicationId,
    onBidSuccess,
    onBidError,
    onSubscribeSuccess,
  });

  // Real-time notifications
  const handleRefetchFromNotification = useCallback(
    async (blockHash?: string) => {
      console.log('[useFairdropAuction] Block notification, refetching data...');
      await refetch();
      onBlockNotification?.();
    },
    [refetch, onBlockNotification]
  );

  const { isListening: isListeningToNotifications } = useAuctionNotifications({
    enabled: enableNotifications,
    onRefetch: handleRefetchFromNotification,
  });

  return {
    // Data
    data,
    creatorChainId,
    currentChainId,

    // Chain context
    isCreatorChain,
    isSubscriberChain,

    // Loading states
    loading,
    hasLoadedOnce,
    isBidding,
    isConnecting,
    isSubscribing,

    // Wallet
    canWrite,
    isConnected,
    balance,
    connectWallet,

    // Actions
    placeBid,
    subscribeToAuction,
    unsubscribeFromAuction,
    refetch,
    refreshQuick,

    // Error
    error,

    // Notifications
    isListeningToNotifications,
  };
}
