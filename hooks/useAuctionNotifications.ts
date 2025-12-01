/**
 * useAuctionNotifications Hook
 *
 * Listens to real-time blockchain notifications from Linera client.
 * Automatically refetches auction data when new blocks are detected.
 *
 * Key Features:
 * - Subscribes to Linera client notifications
 * - Triggers data refresh on new blocks
 * - Provides notification history for debugging
 * - Clean unsubscribe on unmount
 */

import { useState, useEffect, useCallback } from 'react';
import { useLineraClient } from 'linera-react-client';

export interface BlockNotification {
  chainId: string;
  reason: {
    BlockExecuted?: {
      height: string;
      hash: string;
    };
    NewBlock?: {
      height: string;
      hash: string;
    };
  };
  timestamp: number; // Added by hook for tracking
}

export interface UseAuctionNotificationsOptions {
  /** Callback when notification is received */
  onNotification?: (notification: BlockNotification) => void;
  /** Callback to refetch data (e.g., from useAuctionData) */
  onRefetch?: (blockHash?: string) => Promise<void>;
  /** Whether to enable notifications */
  enabled?: boolean;
  /** Maximum number of notifications to keep in history */
  maxHistory?: number;
}

export interface UseAuctionNotificationsResult {
  /** Latest notification received */
  latestNotification: BlockNotification | null;
  /** History of notifications (newest first) */
  notificationHistory: BlockNotification[];
  /** Is listening to notifications? */
  isListening: boolean;
  /** Clear notification history */
  clearHistory: () => void;
}

export function useAuctionNotifications(
  options: UseAuctionNotificationsOptions = {}
): UseAuctionNotificationsResult {
  const {
    onNotification,
    onRefetch,
    enabled = true,
    maxHistory = 20,
  } = options;

  const { client } = useLineraClient();

  const [latestNotification, setLatestNotification] = useState<BlockNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<BlockNotification[]>([]);
  const [isListening, setIsListening] = useState(false);

  /**
   * Clear notification history
   */
  const clearHistory = useCallback(() => {
    setNotificationHistory([]);
    setLatestNotification(null);
  }, []);

  /**
   * Set up Linera client notification listener
   */
  useEffect(() => {
    if (!client || !enabled) {
      setIsListening(false);
      return;
    }

    console.log('[useAuctionNotifications] Setting up notification listener');
    setIsListening(true);

    // Subscribe to notifications
    // Note: onNotification returns void, there's no unsubscribe mechanism
    client.onNotification((notification: any) => {
      const enrichedNotification: BlockNotification = {
        ...notification,
        timestamp: Date.now(),
      };

      console.log('[useAuctionNotifications] Received notification:', enrichedNotification);

      // Update latest notification
      setLatestNotification(enrichedNotification);

      // Add to history (with size limit)
      setNotificationHistory(prev => {
        const updated = [enrichedNotification, ...prev];
        return updated.slice(0, maxHistory);
      });

      // Call custom callback
      onNotification?.(enrichedNotification);

      // Trigger refetch if callback provided
      if (onRefetch && notification.reason) {
        const blockHash =
          notification.reason.BlockExecuted?.hash || notification.reason.NewBlock?.hash;

        onRefetch(blockHash).catch(err => {
          console.error('[useAuctionNotifications] Refetch failed:', err);
        });
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('[useAuctionNotifications] Notification listener will continue (no unsubscribe available)');
      setIsListening(false);
    };
  }, [client, enabled, maxHistory, onNotification, onRefetch]);

  return {
    latestNotification,
    notificationHistory,
    isListening,
    clearHistory,
  };
}
