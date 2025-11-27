# Fairdrop GraphQL Setup

This directory contains the complete GraphQL setup for the Fairdrop auction application, custom-built for Linera's dual-chain architecture.

## 🏗️ Architecture Overview

### Dual-Chain Design

Fairdrop auctions operate across multiple chains in the Linera ecosystem:

1. **Creator Chain**: The authoritative source of auction state
   - Hosts the actual auction contract
   - Processes all bids
   - Calculates real-time pricing
   - Emits events to subscriber chains

2. **Subscriber Chains**: Receive real-time updates via event streaming
   - Subscribe to auction events from creator chain
   - Maintain cached auction state
   - Can place bids (forwarded to creator chain)
   - Ideal for multi-chain marketplaces

## 📁 File Structure

```
lib/graphql/
├── queries.ts       # All GraphQL queries, mutations, subscriptions
├── types.ts         # TypeScript types matching the auction schema
├── index.ts         # Central exports
└── README.md        # This file

hooks/
├── useAuction.ts              # Main auction interaction hook
├── useAuctionSubscription.ts  # Real-time event subscription hook
└── index.ts                   # Central exports

components/providers/
└── apollo.tsx       # Enhanced Apollo provider for dual-chain support
```

## 🚀 Quick Start

### 1. Wrap your app with GraphQLProvider

```tsx
import { GraphQLProvider } from '@/components/providers/apollo';

export default function AuctionApp() {
  return (
    <GraphQLProvider
      chainId="your-chain-id-64-hex-chars"
      applicationId="your-app-id-64-hex-chars"
      port="8080"
    >
      <YourAuctionComponent />
    </GraphQLProvider>
  );
}
```

### 2. Use the auction hook in your components

```tsx
import { useAuction } from '@/hooks';

export function AuctionCard() {
  const {
    auction,
    isCreatorChain,
    loading,
    placeBid,
    canPlaceBid,
  } = useAuction();

  if (loading) return <div>Loading auction...</div>;
  if (!auction) return <div>No auction found</div>;

  return (
    <div>
      <h2>Current Price: {auction.currentPrice}</h2>
      <p>Quantity Remaining: {auction.quantityRemaining}</p>
      <p>Status: {auction.status}</p>

      {canPlaceBid && (
        <button onClick={() => placeBid(1)}>
          Place Bid
        </button>
      )}

      {isCreatorChain ? (
        <span>Creator Chain</span>
      ) : (
        <span>Subscriber Chain</span>
      )}
    </div>
  );
}
```

### 3. Subscribe to real-time updates

```tsx
import { useAuctionSubscription } from '@/hooks';

export function LiveAuctionFeed() {
  const {
    latestEvent,
    eventHistory,
    connected,
  } = useAuctionSubscription({
    chainId: 'creator-chain-id',
    onBidPlaced: (data) => {
      console.log('New bid!', data);
      // Show notification, update UI, etc.
    },
  });

  return (
    <div>
      <div>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</div>

      {latestEvent && (
        <div>
          Latest: {latestEvent.type}
        </div>
      )}

      <ul>
        {eventHistory.map((event, i) => (
          <li key={i}>{event.type}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 📚 Available Queries

### Basic Auction Queries

- `GET_CURRENT_PRICE`: Current descending price
- `GET_QUANTITY_INFO`: Remaining and sold quantities
- `GET_AUCTION_INFO`: Complete auction state (creator chain only)
- `HAS_AUCTION_STATE`: Check if auction exists on this chain

### Multi-Chain Queries

- `GET_CHAIN_INFO`: Identify creator vs current chain
- `GET_CACHED_AUCTION_STATE`: Auction state on subscriber chains
- `GET_STREAM_EVENTS`: Historical events received via subscription

### Composite Queries (Optimized)

- `GET_AUCTION_FULL_STATE`: Everything for creator chain (single query)
- `GET_SUBSCRIBER_CHAIN_STATE`: Everything for subscriber chain (single query)

## 🔄 Mutations

- `PLACE_BID`: Place a bid for specified quantity
- `SUBSCRIBE_AUCTION`: Subscribe to creator chain events
- `UNSUBSCRIBE_AUCTION`: Stop receiving events

## 📡 Subscriptions

- `SUBSCRIBE_AUCTION_NOTIFICATIONS`: Real-time WebSocket event stream

## 🎯 Key Features

### 1. **Real-Time Price Updates**
- No-cache fetch policy ensures price is always current
- Descending price mechanism recalculated every `decrement_interval`

### 2. **Automatic Chain Detection**
- `useAuction` hook automatically detects creator vs subscriber chain
- Fetches appropriate data (real state vs cached state)

### 3. **Type Safety**
- Full TypeScript support with generated types from Rust schema
- Prevents runtime errors with compile-time checks

### 4. **Robust WebSocket Handling**
- Automatic reconnection with exponential backoff
- Connection lifecycle logging
- 5-second keepalive pings

### 5. **Production-Ready**
- Supports both development (localhost) and production (relative URLs)
- Proper error handling and fallback clients
- ChainId validation prevents invalid connections

## 🛠️ Advanced Usage

### Custom Polling Interval

```tsx
const { auction } = useAuction({
  pollInterval: 2000, // Poll every 2 seconds (default: 5s)
});
```

### Conditional Subscription

```tsx
const { latestEvent } = useAuctionSubscription({
  chainId: creatorChainId,
  skip: !isSubscribed, // Only subscribe when needed
});
```

### Event History Management

```tsx
const { eventHistory, clearHistory } = useAuctionSubscription({
  chainId: creatorChainId,
  maxHistorySize: 50, // Keep last 50 events (default: 100)
});

// Clear on unmount or when switching auctions
useEffect(() => {
  return () => clearHistory();
}, []);
```

## 🔍 Differences from Gmic Reference

This implementation is **not** a copy of the Gmic GraphQL setup. Key custom enhancements:

### 1. **Auction-Specific Cache Policies**
- Gmic: Generic `merge: false` for common queries
- Fairdrop: Tailored policies for `currentPrice`, `auctionInfo`, `cachedAuctionState`
- Why: Auction prices change every interval, stale cache is dangerous

### 2. **Dual-Chain Architecture Support**
- Gmic: Single-chain messaging app
- Fairdrop: Creator chain + subscriber chains with event streaming
- Why: Auction needs authoritative state on creator, cached on subscribers

### 3. **Unified State Abstraction**
- Gmic: Different queries for different use cases
- Fairdrop: `UnifiedAuctionState` works on both creator and subscriber chains
- Why: Simplifies frontend logic, same component works anywhere

### 4. **Real-Time Subscription Parsing**
- Gmic: Raw event JSON strings
- Fairdrop: Typed `ParsedAuctionEvent` with discriminated unions
- Why: Type safety for bid events, status changes, initialization

### 5. **Production-Optimized Defaults**
- Gmic: Development-focused logging
- Fairdrop: Namespaced logging (`[Fairdrop Apollo]`), proper error boundaries
- Why: Better debugging in multi-app environments

## 🐛 Troubleshooting

### "Invalid chainId format" Warning
- Ensure chainId is exactly 64 hexadecimal characters
- Check that you're passing the correct chain ID from Linera

### Subscription Not Receiving Events
1. Verify you're subscribed: Call `subscribeToAuction()` mutation first
2. Check WebSocket connection in browser DevTools (Network tab)
3. Ensure `chainId` parameter matches the creator chain

### Stale Price Data
- Should never happen with `fetchPolicy: 'no-cache'`
- If it does, check browser cache or service workers

### "No auction found" on Subscriber Chain
- Run `subscribeToAuction()` mutation to start receiving events
- Wait for `AuctionInitialized` event to populate cached state
- Use `GET_CHAIN_INFO` to verify you're on the right chain

## 📖 Further Reading

- [Linera GraphQL Documentation](https://docs.linera.io)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Fairdrop Smart Contract Source](../../fairdrop-smart-contract/basic-auction/)
