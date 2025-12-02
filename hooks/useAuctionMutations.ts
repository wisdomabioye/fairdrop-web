/**
 * useAuctionMutations Hook
 *
 * Provides mutation functions for auction interactions using linera-react-client.
 * Handles wallet connection, bid placement, and subscription management.
 *
 * Key Features:
 * - Place bids
 * - Subscribe/unsubscribe to auction events
 * - Proper error handling and loading states
 * - Works with useAuctionData for seamless updates
 */

import { useState, useCallback } from 'react';
import {
  useLineraApplication,
  useWalletConnection,
} from 'linera-react-client';

export interface UseAuctionMutationsOptions {
  /** Application ID for the auction */
  applicationId: string;
  /** Callback after successful bid */
  onBidSuccess?: (quantity: number) => void;
  /** Callback after failed bid */
  onBidError?: (error: Error) => void;
  /** Callback after successful subscription */
  onSubscribeSuccess?: () => void;
  /** Callback after successful unsubscription */
  onUnsubscribeSuccess?: () => void;
}

export interface UseAuctionMutationsResult {
  /** Place a bid for the specified quantity */
  placeBid: (quantity: number) => Promise<boolean>;
  /** Subscribe to auction updates from creator chain */
  subscribeToAuction: () => Promise<boolean>;
  /** Unsubscribe from auction updates */
  unsubscribeFromAuction: () => Promise<boolean>;

  // Loading states
  /** Is bid placement in progress? */
  isBidding: boolean;
  /** Is wallet connection in progress? */
  isConnecting: boolean;
  /** Is subscription operation in progress? */
  isSubscribing: boolean;
  /** Is currently subscribed to auction updates? */
  isSubscribed: boolean;

  // Wallet state
  /** Can the user write (wallet connected)? */
  canWrite: boolean;
  /** Is wallet connected? */
  isConnected: boolean;
  /** Connect wallet */
  connectWallet: () => Promise<void>;
}

export function useAuctionMutations(
  options: UseAuctionMutationsOptions
): UseAuctionMutationsResult {
  const {
    applicationId,
    onBidSuccess,
    onBidError,
    onSubscribeSuccess,
    onUnsubscribeSuccess,
  } = options;

  const { app } = useLineraApplication(applicationId);
  const { connect, isConnected } = useWalletConnection();

  const [isBidding, setIsBidding] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check if wallet is connected and can write
  const canWrite = !!app?.walletClient;

  /**
   * Connect wallet (wrapper around linera-react-client's connect)
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error('[useAuctionMutations] Wallet connection failed:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  /**
   * Place a bid
   */
  const placeBid = useCallback(
    async (quantity: number): Promise<boolean> => {
      if (quantity <= 0) {
        const error = new Error('Quantity must be greater than 0');
        onBidError?.(error);
        return false;
      }

      try {
        // If wallet not connected, connect first
        // if (!app?.walletClient) {
        //   const error = new Error('Wallet not connected');
        //   onBidError?.(error);
        //   throw error;
        // }

        // if (app?.walletClient) {
        //   // Wallet is connected, place the bid using walletClient
        //   setIsBidding(true);
        //   const result = await app.walletClient.mutate(
        //     JSON.stringify({
        //       query: `mutation { placeBid(quantity: ${quantity}) }`,
        //     })
        //   );
        //   console.log('[useAuctionMutations] Bid result:', result);
          
        //   setIsBidding(false);
        //   onBidSuccess?.(quantity);
        //   return true;
        // }

        if (app?.publicClient) {
          // Intentionally mutation from pubicClient for now 
          setIsBidding(true);
          const result = await app.publicClient.systemMutate(
            JSON.stringify({
              query: `mutation { placeBid(quantity: ${quantity}) }`,
            })
          );
          console.log('[useAuctionMutations publicClient.systemMutate] Bid result:', result);
          
          setIsBidding(false);
          onBidSuccess?.(quantity);
          return true;
        }
        
      } catch (err) {
        setIsBidding(false);
        const error = err instanceof Error ? err : new Error('Bid placement failed');
        console.error('[useAuctionMutations]', error);
        onBidError?.(error);
        return false;
      } finally {
          setIsBidding(false);
      }
      return false
    },
    [app]
  );

  /**
   * Subscribe to auction updates from the creator chain
   * IMPORTANT: We call this on subscriber chains to start receiving cachedAuctionState
   * This uses systemMutate so it doesn't require wallet connection
   *
   * Returns true if subscription succeeded or was already subscribed
   */
  const subscribeToAuction = useCallback(async (): Promise<boolean> => {
    if (!app) return false;

    // If already subscribed, don't subscribe again
    if (isSubscribed) {
      console.log('[useAuctionMutations] Already subscribed, skipping...');
      return true;
    }

    setIsSubscribing(true);
    try {
      // We use publicClient.systemMutate for subscriptions (no wallet needed!)
      const result = await app.publicClient.systemMutate(
        JSON.stringify({
          query: 'mutation { subscribe }',
        })
      );
      console.log('[useAuctionMutations] Subscribe result:', result);

      setIsSubscribing(false);
      setIsSubscribed(true); // Mark as subscribed
      onSubscribeSuccess?.();
      return true;
    } catch (err) {
      setIsSubscribing(false);
      const error = err instanceof Error ? err : new Error('Subscription failed');
      console.error('[useAuctionMutations]', error);
      return false;
    }
  }, [app, isSubscribed, onSubscribeSuccess]);

  /**
   * Unsubscribe from auction updates
   * This uses systemMutate so it doesn't require wallet connection
   */
  const unsubscribeFromAuction = useCallback(async (): Promise<boolean> => {
    if (!app) return false;

    setIsSubscribing(true);
    try {
      // Use publicClient.systemMutate for unsubscriptions (no wallet needed!)
      const result = await app.publicClient.systemMutate(
        JSON.stringify({
          query: 'mutation { unsubscribe }',
        })
      );
      console.log('[useAuctionMutations] Unsubscribe result:', result);

      setIsSubscribing(false);
      setIsSubscribed(false); // Mark as unsubscribed
      onUnsubscribeSuccess?.();
      return true;
    } catch (err) {
      setIsSubscribing(false);
      const error = err instanceof Error ? err : new Error('Unsubscription failed');
      console.error('[useAuctionMutations]', error);
      return false;
    }
  }, [app, onUnsubscribeSuccess]);

  return {
    placeBid,
    subscribeToAuction,
    unsubscribeFromAuction,
    isBidding,
    isConnecting,
    isSubscribing,
    isSubscribed,
    canWrite,
    isConnected,
    connectWallet,
  };
}
