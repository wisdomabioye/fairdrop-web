/**
 * useAuctionMutations Hook
 *
 * Provides mutation functions for auction interactions using linera-react-client.
 * Handles wallet connection, bid placement, and subscription management.
 *
 * Key Features:
 * - Place bids with automatic wallet connection
 * - Subscribe/unsubscribe to auction events
 * - Proper error handling and loading states
 * - Works with useAuctionData for seamless updates
 */

import { useState, useCallback } from 'react';
import {
  useLineraApplication,
  useWalletConnection,
  useLineraClient,
  getLineraClientManager,
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

  // Wallet state
  /** Can the user write (wallet connected)? */
  canWrite: boolean;
  /** Is wallet connected? */
  isConnected: boolean;
  /** Connect wallet */
  connectWallet: () => Promise<void>;

  // Utility
  /** Current wallet balance */
  balance: string | null;
  /** Refresh balance */
  refreshBalance: () => Promise<void>;
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

  const { mutate, canWrite } = useLineraApplication(applicationId);
  const { connect, isConnected } = useWalletConnection();
  const { client } = useLineraClient();

  const [isBidding, setIsBidding] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  /**
   * Refresh wallet balance
   */
  const refreshBalance = useCallback(async () => {
    if (!client) return;

    try {
      const bal = await client.balance();
      setBalance(bal);
    } catch (err) {
      console.error('[useAuctionMutations] Failed to refresh balance:', err);
    }
  }, [client]);

  /**
   * Connect wallet (wrapper around linera-react-client's connect)
   */
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connect();
      await refreshBalance();
    } catch (err) {
      console.error('[useAuctionMutations] Wallet connection failed:', err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [connect, refreshBalance]);

  /**
   * Place a bid
   * Automatically connects wallet if not already connected
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
        if (!canWrite) {
          setIsConnecting(true);
          try {
            await connect();

            // Wait for wallet connection and app to reload with write permissions
            let attempts = 0;
            const maxAttempts = 30; // 3 seconds max

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100));

              const clientManager = getLineraClientManager();
              if (clientManager?.canWrite()) {
                // Get fresh app instance with write permissions
                const freshApp = await clientManager.getApplication(applicationId);
                if (freshApp) {
                  console.log('[useAuctionMutations] Wallet connected, placing bid...');

                  // Execute mutation with fresh app
                  const result = await freshApp.mutate(
                    JSON.stringify({
                      query: `mutation { placeBid(quantity: ${quantity}) }`,
                    })
                  );
                  console.log('[useAuctionMutations] Bid result:', result);

                  // Refresh balance
                  await refreshBalance();

                  setIsConnecting(false);
                  onBidSuccess?.(quantity);
                  return true;
                }
              }
              attempts++;
            }

            throw new Error('Wallet connection timeout');
          } catch (err) {
            setIsConnecting(false);
            const error = err instanceof Error ? err : new Error('Wallet connection failed');
            onBidError?.(error);
            throw error;
          }
        }

        // Wallet already connected, use regular mutate
        setIsBidding(true);
        const result = await mutate(
          JSON.stringify({
            query: `mutation { placeBid(quantity: ${quantity}) }`,
          })
        );
        console.log('[useAuctionMutations] Bid result:', result);

        // Refresh balance
        await refreshBalance();

        setIsBidding(false);
        onBidSuccess?.(quantity);
        return true;
      } catch (err) {
        setIsBidding(false);
        const error = err instanceof Error ? err : new Error('Bid placement failed');
        console.error('[useAuctionMutations]', error);
        onBidError?.(error);
        return false;
      }
    },
    [canWrite, connect, mutate, applicationId, refreshBalance, onBidSuccess, onBidError]
  );

  /**
   * Subscribe to auction updates from the creator chain
   * IMPORTANT: Call this on subscriber chains to start receiving cachedAuctionState
   */
  const subscribeToAuction = useCallback(async (): Promise<boolean> => {
    setIsSubscribing(true);
    try {
      const result = await mutate(
        JSON.stringify({
          query: 'mutation { subscribe }',
        })
      );
      console.log('[useAuctionMutations] Subscribe result:', result);

      setIsSubscribing(false);
      onSubscribeSuccess?.();
      return true;
    } catch (err) {
      setIsSubscribing(false);
      const error = err instanceof Error ? err : new Error('Subscription failed');
      console.error('[useAuctionMutations]', error);
      return false;
    }
  }, [mutate, onSubscribeSuccess]);

  /**
   * Unsubscribe from auction updates
   */
  const unsubscribeFromAuction = useCallback(async (): Promise<boolean> => {
    setIsSubscribing(true);
    try {
      const result = await mutate(
        JSON.stringify({
          query: 'mutation { unsubscribe }',
        })
      );
      console.log('[useAuctionMutations] Unsubscribe result:', result);

      setIsSubscribing(false);
      onUnsubscribeSuccess?.();
      return true;
    } catch (err) {
      setIsSubscribing(false);
      const error = err instanceof Error ? err : new Error('Unsubscription failed');
      console.error('[useAuctionMutations]', error);
      return false;
    }
  }, [mutate, onUnsubscribeSuccess]);

  return {
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
    refreshBalance,
  };
}
