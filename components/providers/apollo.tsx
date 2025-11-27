"use client"

import { createClient } from "graphql-ws";
import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { ApolloProvider } from "@apollo/client/react";

/**
 * Fairdrop GraphQL Provider
 *
 * Custom Apollo provider optimized for Fairdrop auction's dual-chain architecture:
 * - Creator chain: Has the authoritative auction state
 * - Subscriber chains: Receive real-time updates via event streaming
 *
 * Key Features:
 * - ChainId validation for Linera protocol
 * - Robust WebSocket retry with exponential backoff
 * - No-cache policy for real-time auction data (price changes every interval)
 * - Proper type policies to prevent Apollo cache merge issues
 * - Development/production URL flexibility
 */

export interface GraphQLProviderProps {
  /** Linera chain ID (64-character hex string) */
  chainId: string;
  /** Application ID for this auction instance */
  applicationId: string;
  /** Port for local development (defaults to localhost) */
  port: string;
  /** Host (defaults to localhost for dev, use relative URLs for prod) */
  host?: string;
  /** Child components */
  children: React.ReactNode;
}

export function GraphQLProvider({
  chainId,
  applicationId,
  port,
  host = 'localhost',
  children
}: GraphQLProviderProps) {
  const client = createAuctionApolloClient(chainId, applicationId, port, host);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

/**
 * Validate Linera chainId format
 * Must be exactly 64 hexadecimal characters
 */
function isValidChainId(chainId: string): boolean {
  if (!chainId) return false;
  return /^[0-9a-fA-F]{64}$/.test(chainId);
}

/**
 * Create Apollo Client optimized for Fairdrop auction
 */
function createAuctionApolloClient(
  chainId: string,
  applicationId: string,
  port: string,
  host: string = 'localhost'
): ApolloClient {
  // Handle invalid chainId gracefully
  if (!isValidChainId(chainId)) {
    console.warn(
      '[Fairdrop Apollo] Invalid chainId format. Expected 64-character hex string, got:',
      chainId
    );
    return createFallbackClient();
  }

  // Determine URLs based on environment
  const isDevelopment = host === 'localhost';
  const wsUrl = isDevelopment ? `ws://${host}:${port}/ws` : `${host}/ws`;
  const httpUrl = isDevelopment
    ? `http://${host}:${port}/chains/${chainId}/applications/${applicationId}`
    : `${host}/chains/${chainId}/applications/${applicationId}`;

  console.log('[Fairdrop Apollo] Initializing with:', {
    chainId: chainId.substring(0, 16) + '...',
    applicationId: applicationId.substring(0, 16) + '...',
    wsUrl,
    httpUrl,
  });

  // Create WebSocket link with robust retry logic
  const wsLink = new GraphQLWsLink(
    createClient({
      url: wsUrl,
      connectionParams: () => ({
        chainId: chainId,
        applicationId: applicationId,
      }),
      shouldRetry: () => true,
      retryAttempts: 10,
      retryWait: async (retries) => {
        // Exponential backoff: 500ms * 1.2^retries, capped at 3 seconds
        const delay = Math.min(500 * Math.pow(1.2, retries), 3000);
        console.log(`[Fairdrop Apollo] WS retry attempt ${retries}, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      },
      keepAlive: 5000, // Send ping every 5 seconds
      on: {
        connecting: () => {
          console.log('[Fairdrop Apollo] WS Connecting...');
        },
        connected: () => {
          console.log('[Fairdrop Apollo] WS Connected successfully');
        },
        error: (error) => {
          console.error('[Fairdrop Apollo] WS Error:', error);
        },
        closed: (event: any) => {
          console.log('[Fairdrop Apollo] WS Closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
        },
        ping: () => {
          console.debug('[Fairdrop Apollo] WS Ping sent');
        },
        pong: () => {
          console.debug('[Fairdrop Apollo] WS Pong received');
        },
      },
    })
  );

  // Create HTTP link for queries and mutations
  const httpLink = new HttpLink({
    uri: httpUrl,
  });

  // Split traffic: WebSocket for subscriptions, HTTP for queries/mutations
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    httpLink
  );

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // AUCTION PRICE QUERIES - Never cache, always fetch fresh
            // Price changes every decrement_interval, so stale cache is dangerous
            currentPrice: {
              merge: false,
            },

            // AUCTION STATE QUERIES - No cache merge
            // We want the latest state, not merged with previous state
            auctionInfo: {
              merge: false,
            },
            quantityRemaining: {
              merge: false,
            },
            quantitySold: {
              merge: false,
            },

            // SUBSCRIBER CHAIN QUERIES - No cache merge
            // Cached state comes from events, should always replace
            cachedAuctionState: {
              merge: false,
            },

            // EVENT STREAM QUERIES - No cache merge
            // Events should not be merged, always replaced
            streamEvents: {
              merge: false,
            },
            streamEventsJson: {
              merge: false,
            },

            // CHAIN INFO - No cache merge
            chainInfo: {
              merge: false,
            },

            // STATE CHECK - No cache merge
            hasAuctionState: {
              merge: false,
            },
          },
        },
        Mutation: {
          fields: {
            // MUTATIONS - Don't cache mutation results
            placeBid: {
              read: () => undefined,
              merge: () => undefined,
            },
            subscribe: {
              read: () => undefined,
              merge: () => undefined,
            },
            unsubscribe: {
              read: () => undefined,
              merge: () => undefined,
            },
          },
        },
      },
    }),
    defaultOptions: {
      // WATCH QUERIES (for useQuery hook)
      watchQuery: {
        errorPolicy: 'all', // Return both data and errors
        notifyOnNetworkStatusChange: true, // Notify on loading state changes
        fetchPolicy: 'no-cache', // CRITICAL: Always fetch fresh data for real-time auctions
      },
      // ONE-TIME QUERIES
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'no-cache', // Never use cache for auction data
      },
      // MUTATIONS
      mutate: {
        errorPolicy: 'ignore', // Don't fail on mutation errors (let caller handle)
      },
    },
  });
}

/**
 * Create a minimal fallback client when chainId is invalid
 * Prevents app crashes while allowing user to see error state
 */
function createFallbackClient(): ApolloClient {
  return new ApolloClient({
    link: new HttpLink({ uri: '/invalid-chain' }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        fetchPolicy: 'no-cache',
      },
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'no-cache',
      },
      mutate: {
        errorPolicy: 'ignore',
      },
    },
  });
}
