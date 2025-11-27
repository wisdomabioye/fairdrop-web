/**
 * Fairdrop Auction GraphQL Queries
 *
 * Organized by functionality:
 * - Basic auction queries (price, quantity)
 * - Chain management (creator vs subscriber chains)
 * - Event streaming (real-time updates)
 * - Mutations (bid placement, subscriptions)
 */

import { gql } from '@apollo/client';

// ============================================
// BASIC AUCTION QUERIES
// ============================================

/**
 * Get current auction price based on elapsed time
 * Returns the descending price calculated from start_price, decrement_rate, and time elapsed
 */
export const GET_CURRENT_PRICE = gql`
  query GetCurrentPrice {
    currentPrice
  }
`;

/**
 * Get quantity information (remaining and sold)
 */
export const GET_QUANTITY_INFO = gql`
  query GetQuantityInfo {
    quantityRemaining
    quantitySold
  }
`;

/**
 * Get complete auction information
 * This is the main query for displaying auction state on the creator chain
 *
 * NOTE: This only works on the creator chain. For subscriber chains, we use GET_CACHED_AUCTION_STATE
 */
export const GET_AUCTION_INFO = gql`
  query GetAuctionInfo {
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
  }
`;

/**
 * Quick check if auction state exists on this chain
 */
export const HAS_AUCTION_STATE = gql`
  query HasAuctionState {
    hasAuctionState
  }
`;

// ============================================
// MULTI-CHAIN QUERIES
// ============================================

/**
 * Get information about which chain has the auction state
 * Essential for routing queries to the correct chain in a multi-chain setup
 */
export const GET_CHAIN_INFO = gql`
  query GetChainInfo {
    chainInfo {
      currentChainId
      creatorChainId
      hasState
    }
  }
`;

/**
 * Get cached auction state from subscribed updates
 * This is available on NON-CREATOR chains that have subscribed to auction events
 *
 * We use this instead of GET_AUCTION_INFO when querying from a subscriber chain
 */
export const GET_CACHED_AUCTION_STATE = gql`
  query GetCachedAuctionState {
    cachedAuctionState {
      owner
      startTimestamp
      startPrice
      floorPrice
      decrementRate
      decrementInterval
      totalQuantity
      currentQuantitySold
      currentStatus
      currentPrice
      timestamp
    }
  }
`;

// ============================================
// EVENT STREAMING QUERIES
// ============================================

/**
 * Get stream events received from subscriptions
 * Returns structured event objects with metadata
 *
 * @param chainId - Optional filter by source chain ID
 */
export const GET_STREAM_EVENTS = gql`
  query GetStreamEvents($chainId: ChainId) {
    streamEvents(chainId: $chainId) {
      eventType
      chainId
      timestamp
      eventData
    }
  }
`;

/**
 * Get stream events as raw JSON strings
 * Useful for debugging or custom parsing on the frontend
 *
 * @param chainId - Optional filter by source chain ID
 */
export const GET_STREAM_EVENTS_JSON = gql`
  query GetStreamEventsJson($chainId: ChainId) {
    streamEventsJson(chainId: $chainId)
  }
`;

// ============================================
// MUTATIONS
// ============================================

/**
 * Place a bid for a specified quantity at the current price
 *
 * In Stage 1: This tracks the bid but doesn't process payment
 * In future stages: This will integrate with token transfers
 *
 * @param quantity - Number of units to purchase
 */
export const PLACE_BID = gql`
  mutation PlaceBid($quantity: Int!) {
    placeBid(quantity: $quantity)
  }
`;

/**
 * Subscribe to auction updates from the creator chain
 * This allows a non-creator chain to receive real-time auction events
 *
 * After subscribing, we can use GET_CACHED_AUCTION_STATE to access the replicated state
 */
export const SUBSCRIBE_AUCTION = gql`
  mutation SubscribeAuction {
    subscribe
  }
`;

/**
 * Unsubscribe from auction updates
 * Stops receiving events from the creator chain
 */
export const UNSUBSCRIBE_AUCTION = gql`
  mutation UnsubscribeAuction {
    unsubscribe
  }
`;

// ============================================
// SUBSCRIPTIONS (Real-time WebSocket)
// ============================================

/**
 * Subscribe to real-time auction events via WebSocket
 * Returns a stream of event JSON strings as they occur
 *
 * Events include:
 * - AuctionInitialized: Initial state when subscribing
 * - BidPlaced: When a bid is successfully placed
 * - StatusChanged: When auction status changes (Scheduled -> Active -> Ended)
 *
 * @param chainId - Chain ID to monitor for events
 */
export const SUBSCRIBE_AUCTION_NOTIFICATIONS = gql`
  subscription SubscribeAuctionNotifications($chainId: ChainId!) {
    auctionNotifications(chainId: $chainId)
  }
`;

// ============================================
// COMPOSITE QUERIES (for efficiency)
// ============================================

/**
 * Get all essential auction data in one query
 * Optimized for initial page load on creator chain
 */
export const GET_AUCTION_FULL_STATE = gql`
  query GetAuctionFullState {
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
    chainInfo {
      currentChainId
      creatorChainId
      hasState
    }
  }
`;

/**
 * Get all essential data for subscriber chain
 * Combines cached state with chain info
 */
export const GET_SUBSCRIBER_CHAIN_STATE = gql`
  query GetSubscriberChainState($eventChainId: ChainId) {
    cachedAuctionState {
      owner
      startTimestamp
      startPrice
      floorPrice
      decrementRate
      decrementInterval
      totalQuantity
      currentQuantitySold
      currentStatus
      currentPrice
      timestamp
    }
    chainInfo {
      currentChainId
      creatorChainId
      hasState
    }
    streamEvents(chainId: $eventChainId) {
      eventType
      chainId
      timestamp
      eventData
    }
  }
`;
