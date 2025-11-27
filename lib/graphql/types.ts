/**
 * Fairdrop Auction GraphQL Response Types
 *
 * TypeScript interfaces matching the GraphQL schema from service.rs
 */

// ============================================
// SCALAR TYPES
// ============================================

/** Linera Amount type (u128 represented as string) */
export type Amount = string;

/** Linera Timestamp type (microseconds since UNIX epoch) */
export type Timestamp = string;

/** Linera ChainId (64-character hex string) */
export type ChainId = string;

/** Linera AccountOwner (hex string) */
export type AccountOwner = string;

// ============================================
// ENUMS
// ============================================

/**
 * Auction status enum matching AuctionStatus in lib.rs
 */
export enum AuctionStatus {
  /** Auction is scheduled for the future */
  Scheduled = 'SCHEDULED',
  /** Auction is currently active and accepting bids */
  Active = 'ACTIVE',
  /** Auction has ended */
  Ended = 'ENDED',
}

/**
 * Auction event types for stream events
 */
export enum AuctionEventType {
  /** Initial auction parameters sent when subscribing */
  AuctionInitialized = 'AuctionInitialized',
  /** A bid was successfully placed */
  BidPlaced = 'BidPlaced',
  /** Auction status changed */
  StatusChanged = 'StatusChanged',
}

// ============================================
// CORE AUCTION TYPES
// ============================================

/**
 * Complete auction information
 * Returned by auctionInfo query (creator chain only)
 */
export interface AuctionInfo {
  /** Owner of the auction (receives proceeds) */
  owner: AccountOwner;
  /** When the auction starts */
  startTimestamp: Timestamp;
  /** Starting price per unit */
  startPrice: Amount;
  /** Minimum floor price */
  floorPrice: Amount;
  /** Amount to decrease price per interval */
  decrementRate: Amount;
  /** Time interval between price decrements (in seconds) */
  decrementInterval: string;
  /** Total quantity available for auction */
  totalQuantity: string;
  /** Quantity already sold */
  quantitySold: string;
  /** Quantity remaining for sale */
  quantityRemaining: string;
  /** Current price (calculated based on elapsed time) */
  currentPrice: Amount;
  /** Current auction status */
  status: AuctionStatus;
  /** Current blockchain time */
  currentTime: Timestamp;
  /** Seconds until next price decrement (null if auction hasn't started) */
  timeUntilNextDecrement: string | null;
}

/**
 * Cached auction state for subscriber chains
 * Returned by cachedAuctionState query
 */
export interface CachedAuctionState {
  /** Owner of the auction */
  owner: AccountOwner;
  /** When the auction starts */
  startTimestamp: Timestamp;
  /** Starting price per unit */
  startPrice: Amount;
  /** Minimum floor price */
  floorPrice: Amount;
  /** Amount to decrease price per interval */
  decrementRate: Amount;
  /** Time interval between price decrements (in seconds) */
  decrementInterval: string;
  /** Total quantity available for auction */
  totalQuantity: string;
  /** Current quantity sold (from last update) */
  currentQuantitySold: string;
  /** Current auction status (from last update) */
  currentStatus: AuctionStatus;
  /** Current price (from last update) */
  currentPrice: Amount;
  /** Timestamp of last update */
  timestamp: Timestamp;
}

/**
 * Chain information for routing queries
 * Returned by chainInfo query
 */
export interface ChainInfo {
  /** The current chain ID being queried */
  currentChainId: ChainId;
  /** The chain ID where the auction was created */
  creatorChainId: ChainId;
  /** Whether this chain has the auction state */
  hasState: boolean;
}

// ============================================
// EVENT TYPES
// ============================================

/**
 * Stored stream event wrapper
 * Returned by streamEvents query
 */
export interface StoredStreamEvent {
  /** Type of event */
  eventType: string;
  /** Chain ID where event originated */
  chainId: ChainId;
  /** Timestamp when event occurred */
  timestamp: Timestamp;
  /** Event data as JSON string */
  eventData: string;
}

/**
 * Auction initialized event data
 * Sent when a chain first subscribes to auction updates
 */
export interface AuctionInitializedEvent {
  owner: AccountOwner;
  startTimestamp: Timestamp;
  startPrice: Amount;
  floorPrice: Amount;
  decrementRate: Amount;
  decrementInterval: string;
  totalQuantity: string;
  currentQuantitySold: string;
  currentStatus: AuctionStatus;
  currentPrice: Amount;
  timestamp: Timestamp;
}

/**
 * Bid placed event data
 * Sent when a bid is successfully placed
 */
export interface BidPlacedEvent {
  /** Account that placed the bid */
  bidder: AccountOwner;
  /** Quantity purchased */
  quantity: string;
  /** New total quantity sold */
  newTotalSold: string;
  /** Price at time of bid */
  currentPrice: Amount;
  /** Timestamp of bid */
  timestamp: Timestamp;
}

/**
 * Status changed event data
 * Sent when auction status changes
 */
export interface StatusChangedEvent {
  /** New auction status */
  newStatus: AuctionStatus;
  /** Timestamp of status change */
  timestamp: Timestamp;
}

// ============================================
// QUERY RESPONSE TYPES
// ============================================

/**
 * Response for GET_CURRENT_PRICE query
 */
export interface GetCurrentPriceResponse {
  currentPrice: Amount | null;
}

/**
 * Response for GET_QUANTITY_INFO query
 */
export interface GetQuantityInfoResponse {
  quantityRemaining: string | null;
  quantitySold: string;
}

/**
 * Response for GET_AUCTION_INFO query
 */
export interface GetAuctionInfoResponse {
  auctionInfo: AuctionInfo | null;
}

/**
 * Response for HAS_AUCTION_STATE query
 */
export interface HasAuctionStateResponse {
  hasAuctionState: boolean;
}

/**
 * Response for GET_CHAIN_INFO query
 */
export interface GetChainInfoResponse {
  chainInfo: ChainInfo;
}

/**
 * Response for GET_CACHED_AUCTION_STATE query
 */
export interface GetCachedAuctionStateResponse {
  cachedAuctionState: CachedAuctionState | null;
}

/**
 * Response for GET_STREAM_EVENTS query
 */
export interface GetStreamEventsResponse {
  streamEvents: StoredStreamEvent[];
}

/**
 * Response for GET_STREAM_EVENTS_JSON query
 */
export interface GetStreamEventsJsonResponse {
  streamEventsJson: string[];
}

/**
 * Response for GET_AUCTION_FULL_STATE composite query
 */
export interface GetAuctionFullStateResponse {
  auctionInfo: AuctionInfo | null;
  chainInfo: ChainInfo;
}

/**
 * Response for GET_SUBSCRIBER_CHAIN_STATE composite query
 */
export interface GetSubscriberChainStateResponse {
  cachedAuctionState: CachedAuctionState | null;
  chainInfo: ChainInfo;
  streamEvents: StoredStreamEvent[];
}

// ============================================
// MUTATION RESPONSE TYPES
// ============================================

/**
 * Response for PLACE_BID mutation
 */
export interface PlaceBidResponse {
  placeBid: boolean;
}

/**
 * Response for SUBSCRIBE_AUCTION mutation
 */
export interface SubscribeAuctionResponse {
  subscribe: boolean;
}

/**
 * Response for UNSUBSCRIBE_AUCTION mutation
 */
export interface UnsubscribeAuctionResponse {
  unsubscribe: boolean;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

/**
 * Subscription notification wrapper
 */
export interface AuctionNotification {
  auctionNotifications: string; // JSON string of event
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Parsed auction event from subscription
 * Union type of all possible event data structures
 */
export type ParsedAuctionEvent =
  | { type: 'AuctionInitialized'; data: AuctionInitializedEvent }
  | { type: 'BidPlaced'; data: BidPlacedEvent }
  | { type: 'StatusChanged'; data: StatusChangedEvent };

/**
 * Helper to determine if we're on the creator chain
 */
export interface ChainContext {
  /** Are we on the creator chain? */
  isCreatorChain: boolean;
  /** Current chain ID */
  currentChainId: ChainId;
  /** Creator chain ID */
  creatorChainId: ChainId;
}

/**
 * Unified auction state (works on both creator and subscriber chains)
 */
export interface UnifiedAuctionState {
  /** Auction parameters */
  owner: AccountOwner;
  startTimestamp: Timestamp;
  startPrice: Amount;
  floorPrice: Amount;
  decrementRate: Amount;
  decrementInterval: string;
  totalQuantity: string;

  /** Current state */
  quantitySold: string;
  quantityRemaining: string;
  currentPrice: Amount;
  status: AuctionStatus;

  /** Metadata */
  currentTime: Timestamp;
  timeUntilNextDecrement: string | null;
  lastUpdated: Timestamp;

  /** Chain context */
  chainContext: ChainContext;
}
