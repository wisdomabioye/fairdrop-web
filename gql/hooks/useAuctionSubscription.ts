/**
 * useAuctionSubscription Hook
 *
 * Real-time WebSocket subscription for auction events.
 * Listens for bid placements, status changes, and price updates.
 *
 * Features:
 * - Real-time event streaming via WebSocket
 * - Automatic event parsing and type safety
 * - Event history tracking
 * - Connection status monitoring
 * - Auto-reconnection (handled by Apollo)
 */

import { useSubscription } from '@apollo/client/react';
import { useState, useEffect, useCallback } from 'react';
import { SUBSCRIBE_AUCTION_NOTIFICATIONS } from '@/gql/queries';
import type {
  AuctionNotification,
  ParsedAuctionEvent,
  AuctionInitializedEvent,
  BidPlacedEvent,
  StatusChangedEvent,
} from '@/gql/types';

export interface UseAuctionSubscriptionOptions {
  /** Chain ID to monitor for events (required) */
  chainId: string;
  /** Maximum number of events to keep in history (default: 100) */
  maxHistorySize?: number;
  /** Skip subscription (useful for conditional subscription) */
  skip?: boolean;
  /** Callback when new event is received */
  onEvent?: (event: ParsedAuctionEvent) => void;
  /** Callback when auction is initialized */
  onAuctionInitialized?: (data: AuctionInitializedEvent) => void;
  /** Callback when bid is placed */
  onBidPlaced?: (data: BidPlacedEvent) => void;
  /** Callback when status changes */
  onStatusChanged?: (data: StatusChangedEvent) => void;
}

export interface UseAuctionSubscriptionResult {
  /** Most recent event */
  latestEvent: ParsedAuctionEvent | null;
  /** All events in chronological order (oldest first) */
  eventHistory: ParsedAuctionEvent[];
  /** Is subscription active and connected? */
  connected: boolean;
  /** Is subscription loading? */
  loading: boolean;
  /** Any subscription errors */
  error: Error | undefined;
  /** Clear event history */
  clearHistory: () => void;
}

/**
 * Parse raw event JSON string into typed event
 * Handles both StoredStreamEvent wrappers and direct events
 */
function parseAuctionEvent(eventJson: string): ParsedAuctionEvent | null {
  try {
    const parsed = JSON.parse(eventJson);

    // Check if this is a heartbeat message (ignore it)
    if (parsed.type === 'heartbeat') {
      return null;
    }

    // Check if this is a StoredStreamEvent wrapper
    let eventData = parsed;
    if ('event_type' in parsed && 'event_data' in parsed) {
      // Unwrap the StoredStreamEvent to get the actual event
      try {
        eventData = JSON.parse(parsed.event_data);
      } catch (err) {
        console.error('[useAuctionSubscription] Failed to parse event_data:', err);
        return null;
      }
    }

    // Detect event type from structure
    if ('owner' in eventData && 'startTimestamp' in eventData && 'currentQuantitySold' in eventData) {
      return {
        type: 'AuctionInitialized',
        data: eventData as AuctionInitializedEvent,
      };
    }

    if ('bidder' in eventData && 'quantity' in eventData && 'newTotalSold' in eventData) {
      return {
        type: 'BidPlaced',
        data: eventData as BidPlacedEvent,
      };
    }

    if ('newStatus' in eventData) {
      return {
        type: 'StatusChanged',
        data: eventData as StatusChangedEvent,
      };
    }

    console.warn('[useAuctionSubscription] Unknown event format:', eventData);
    return null;
  } catch (error) {
    console.error('[useAuctionSubscription] Failed to parse event:', error);
    return null;
  }
}

export function useAuctionSubscription(
  options: UseAuctionSubscriptionOptions
): UseAuctionSubscriptionResult {
  const {
    chainId,
    maxHistorySize = 100,
    skip = false,
    onEvent,
    onAuctionInitialized,
    onBidPlaced,
    onStatusChanged,
  } = options;

  // Event history state
  const [eventHistory, setEventHistory] = useState<ParsedAuctionEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<ParsedAuctionEvent | null>(null);

  // Subscribe to auction notifications
  const { data, loading, error } = useSubscription<AuctionNotification>(
    SUBSCRIBE_AUCTION_NOTIFICATIONS,
    {
      variables: { chainId },
      skip: skip || !chainId,
      onError: (err) => {
        console.error('[useAuctionSubscription] Subscription error:', err);
      },
    }
  );

  // Connection status (connected if we have data and no errors)
  const connected = !loading && !error && data !== undefined;

  // Process new events
  useEffect(() => {
    if (!data?.auctionNotifications) return;

    const eventJson = data.auctionNotifications;
    const parsed = parseAuctionEvent(eventJson);

    if (!parsed) return;

    // Update latest event
    setLatestEvent(parsed);

    // Add to history (limit size)
    setEventHistory((prev) => {
      const updated = [...prev, parsed];
      if (updated.length > maxHistorySize) {
        return updated.slice(-maxHistorySize);
      }
      return updated;
    });

    // Call general event callback
    onEvent?.(parsed);

    // Call specific event callbacks
    switch (parsed.type) {
      case 'AuctionInitialized':
        onAuctionInitialized?.(parsed.data);
        break;
      case 'BidPlaced':
        onBidPlaced?.(parsed.data);
        break;
      case 'StatusChanged':
        onStatusChanged?.(parsed.data);
        break;
    }
  }, [data, maxHistorySize, onEvent, onAuctionInitialized, onBidPlaced, onStatusChanged]);

  // Clear history handler
  const clearHistory = useCallback(() => {
    setEventHistory([]);
    setLatestEvent(null);
  }, []);

  return {
    latestEvent,
    eventHistory,
    connected,
    loading,
    error,
    clearHistory,
  };
}
