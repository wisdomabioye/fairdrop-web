'use client';

/**
 * Example Auction Component
 *
 * This demonstrates how to use the new Linera client architecture for a Fairdrop auction.
 * Updated to use useApplication and useLineraClient hooks.
 */

import { useState, useEffect } from 'react';
import { useLineraClient } from '@/hooks/useLineraClient';
import { useApplication } from '@/hooks/useLineraApplication';
import { useWalletConnection } from '@/hooks/useWalletConnection';

interface AuctionState {
  currentPrice: string;
  startPrice: string;
  floorPrice: string;
  quantity: number;
  sold: number;
}

export function ExampleAuctionComponent({ applicationId }: { applicationId: string }) {
  const { client, isInitialized, walletAddress, chainId } = useLineraClient();
  const { connect, isConnected } = useWalletConnection();
  const { query, mutate, isReady, canWrite, isLoading } = useApplication(applicationId);

  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch balance when client is ready
  useEffect(() => {
    console.log('client before:', client)
    if (!client) return;

    console.log('client after', client)
    const fetchBalance = async () => {
      try {
        const bal = await client.balance();
        console.log('balance', bal)
        setBalance(bal);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
  }, [client]);

  // Query auction state with polling
  useEffect(() => {
    if (!isReady) return;

    let mounted = true;

    const queryAuctionState = async () => {
      try {
        // GraphQL query format for Linera
        const result = await query<AuctionState>(
          '{ "query": "query { quantitySold status parameters { startTimestamp startPrice floorPrice  } }" }'
        );

        console.log('result', result)

        if (mounted) {
          setAuctionState(result);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to query auction state:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Query failed'));
        }
      }
    };

    // Initial query
    queryAuctionState();

    // Poll for updates every 5 seconds
    const interval = setInterval(queryAuctionState, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isReady, query]);

  // Place a bid
  const handlePlaceBid = async () => {
    if (!bidAmount) return;

    try {
      // Prompt wallet connection if not connected
      if (!canWrite) {
        setIsConnecting(true);
        try {
          await connect();

          // Wait for wallet connection and app reload
          // After connection, useApplication will reload the app with new permissions
          let attempts = 0;
          const maxAttempts = 30; // 3 seconds max

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get fresh app instance to check if it has write permissions
            const { getLineraClientManager } = await import('@/lib/linera/client-manager');
            const clientManager = getLineraClientManager();

            if (clientManager?.canWrite()) {
              // Client manager is ready, get a fresh app instance
              const freshApp = await clientManager.getApplication(applicationId);
              if (freshApp) {
                // Try to mutate with the fresh app instance
                console.log('Wallet connected, proceeding with bid...');

                const mutationResult = await freshApp.mutate(
                  `{ "query": "mutation { placeBid(quantity: ${Number(bidAmount)} ) }" }`
                );
                console.log('mutationResult', mutationResult);

                // Refresh balance
                if (client) {
                  const bal = await client.balance();
                  setBalance(bal);
                }

                setBidAmount('');
                setIsConnecting(false);
                alert('Bid placed successfully!');
                return;
              }
            }

            attempts++;
          }

          throw new Error('Wallet connection timeout - please try again');
        } catch (err) {
          setIsConnecting(false);
          throw err;
        }
      }

      // If already connected, use the regular mutate
      const mutationResult = await mutate(
        `{ "query": "mutation { placeBid(quantity: ${Number(bidAmount)} ) }" }`
      );
      console.log('mutationResult', mutationResult);

      // Refresh balance
      if (client) {
        const bal = await client.balance();
        setBalance(bal);
      }

      setBidAmount('');
      alert('Bid placed successfully!');
    } catch (err) {
      console.error('Failed to place bid:', err);
      alert(`Bid failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="p-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900">
        <p className="text-gray-900 dark:text-gray-100">Loading Linera client...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500 dark:border-red-700 rounded bg-red-50 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">Error: {error.message}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900">
        <p className="text-gray-900 dark:text-gray-100">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg space-y-4 bg-white dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fairdrop Auction</h2>

      {/* Connection Status */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Connection Info</h3>
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p>
            <span className="font-medium">Status:</span>{' '}
            {isConnected ? (
              <span className="text-green-600 dark:text-green-400">✓ Wallet Connected</span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400">Read-Only Mode</span>
            )}
          </p>
          {walletAddress && (
            <p>
              <span className="font-medium">Address:</span> {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
            </p>
          )}
          {chainId && (
            <p>
              <span className="font-medium">Chain ID:</span> {chainId.slice(0, 10)}...
            </p>
          )}
          <p>
            <span className="font-medium">Balance:</span> {balance || 'Loading...'}
          </p>
        </div>
      </div>

      {/* Auction State */}
      {auctionState && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Auction State</h3>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-medium">Current Price:</span> {auctionState.currentPrice}
            </p>
            <p>
              <span className="font-medium">Start Price:</span> {auctionState.startPrice}
            </p>
            <p>
              <span className="font-medium">Floor Price:</span> {auctionState.floorPrice}
            </p>
            <p>
              <span className="font-medium">Available:</span> {auctionState.quantity - auctionState.sold} /{' '}
              {auctionState.quantity}
            </p>
          </div>
        </div>
      )}

      {/* Bidding Interface */}
      <div className="space-y-2">
        <label className="block">
          <span className="font-medium text-gray-900 dark:text-gray-100">Bid Amount:</span>
          <input
            type="text"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter amount"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            disabled={isConnecting}
          />
        </label>
        <button
          onClick={handlePlaceBid}
          disabled={!bidAmount || isConnecting}
          className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting Wallet...' : canWrite ? 'Place Bid' : 'Connect Wallet to Bid'}
        </button>
        {!canWrite && !isConnecting && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Clicking Place Bid will connect your wallet and place the bid
          </p>
        )}
        {isConnecting && (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Connecting wallet and placing bid...
          </p>
        )}
      </div>

      {/* Application ID */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>Application ID: {applicationId}</p>
      </div>
    </div>
  );
}
