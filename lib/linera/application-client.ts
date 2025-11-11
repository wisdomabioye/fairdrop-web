/**
 * Application Client Wrapper
 *
 * Provides a clean interface for interacting with Linera applications,
 * handling queries and mutations with proper error handling.
 */

import type { Application } from '@linera/client';
import type { ApplicationClient } from './types';

/**
 * Wrapper around Linera Application for cleaner API
 */
export class ApplicationClientImpl implements ApplicationClient {
  readonly appId: string;
  readonly application: Application;
  private canWrite: boolean;

  constructor(appId: string, application: Application, canWrite: boolean) {
    this.appId = appId;
    this.application = application;
    this.canWrite = canWrite;
  }

  /**
   * Execute a GraphQL query
   * Works in both read-only and full mode
   */
  async query<T = unknown>(gql: string): Promise<T> {
    try {
      console.log(`[ApplicationClient] Querying ${this.appId}:`, gql);
      const result = await this.application.query(gql);
      return result as T;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[ApplicationClient] Query failed:`, err);
      throw new Error(`Application query failed: ${err.message}`);
    }
  }

  /**
   * Execute a GraphQL mutation
   * Requires full mode (MetaMask connected)
   */
  async mutate<T = unknown>(gql: string): Promise<T> {
    if (!this.canWrite) {
      throw new Error(
        'Mutations require wallet connection. Please connect MetaMask to perform write operations.'
      );
    }

    try {
      console.log(`[ApplicationClient] Mutating ${this.appId}:`, gql);
      const result = await this.application.query(gql); // Note: Linera uses query() for mutations too
      return result as T;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[ApplicationClient] Mutation failed:`, err);
      throw new Error(`Application mutation failed: ${err.message}`);
    }
  }
}
