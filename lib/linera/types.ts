/**
 * Linera Client Types
 *
 * Core type definitions for Linera client management
 */

import type { Client, Wallet, Signer, Application } from '@linera/client';

/**
 * Client operational modes
 */
export enum ClientMode {
  /** Not yet initialized */
  UNINITIALIZED = 'uninitialized',

  /** Read-only mode with temporary wallet (guest) */
  READ_ONLY = 'read_only',

  /** Full mode with MetaMask wallet (authenticated) */
  FULL = 'full',
}

/**
 * Current state of the Linera client
 */
export interface ClientState {
  /** Current operational mode */
  mode: ClientMode;

  /** Whether client is initialized */
  isInitialized: boolean;

  /** Whether a real wallet (MetaMask) is connected */
  hasWallet: boolean;

  /** Connected wallet address (if any) */
  walletAddress?: string;

  /** Claimed chain ID for current wallet */
  chainId?: string;

  /** Faucet URL being used */
  faucetUrl?: string;

  /** Any error that occurred */
  error?: Error;
}

/**
 * Configuration for client initialization
 */
export interface ClientConfig {
  /** Linera faucet endpoint URL */
  faucetUrl: string;

  /** Network environment */
  network?: 'mainnet' | 'testnet' | 'local';

  /** Whether to automatically connect MetaMask on init */
  autoConnect?: boolean;

  /** Skip processing inbox on client creation */
  skipProcessInbox?: boolean;
}

/**
 * Application query/mutation wrapper interface
 */
export interface ApplicationClient {
  /** Application ID */
  readonly appId: string;

  /** Underlying Linera application instance */
  readonly application: Application;

  /** Execute a GraphQL query */
  query<T = unknown>(gql: string): Promise<T>;

  /** Execute a GraphQL mutation (requires full client) */
  mutate<T = unknown>(gql: string): Promise<T>;
}

/**
 * State change callback
 */
export type StateChangeCallback = (state: ClientState) => void;

/**
 * Linera client manager interface
 */
export interface ILineraClientManager {
  /** Get current client state */
  getState(): ClientState;

  /** Get raw Linera client instance */
  getClient(): Client | Promise<Client> | null;

  /** Get current wallet instance */
  getWallet(): Wallet | null;

  /** Initialize in read-only mode */
  initializeReadOnly(): Promise<void>;

  /** Connect MetaMask wallet */
  connectWallet(signer: Signer): Promise<void>;

  /** Disconnect wallet (revert to read-only) */
  disconnectWallet(): Promise<void>;

  /** Switch to different wallet */
  switchWallet(newSigner: Signer): Promise<void>;

  /** Get application interface */
  getApplication(appId: string): Promise<ApplicationClient | null>;

  /** Check if client can perform write operations */
  canWrite(): boolean;

  /** Subscribe to state changes */
  onStateChange(callback: StateChangeCallback): () => void;

  /** Clean up and destroy client */
  destroy(): Promise<void>;
}

/**
 * Re-export Linera types for convenience
 */
export type { Client, Wallet, Signer, Application };
