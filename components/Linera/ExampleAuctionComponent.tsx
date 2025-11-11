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
          '{ "query": "query { quantitySold status }" }'
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

    // Prompt wallet connection if not connected
    if (!canWrite) {
      try {
        await connect();
        return;
      } catch (err) {
        console.error('Failed to connect wallet:', err);
        alert('Please connect your wallet to place a bid');
        return;
      }
    }

    try {
      // Use GraphQL mutation to place bid
      await mutate(
        `{ "query": "mutation { placeBid(amount: \\"${bidAmount}\\") { success } }" }`
      );

      // Refresh auction state after bid
      const result = await query<AuctionState>(
        '{ "query": "query { auctionState { currentPrice startPrice floorPrice quantity sold } }" }'
      );
      setAuctionState(result);

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
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="p-4 border rounded">
        <p>Loading Linera client...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500 rounded bg-red-50">
        <p className="text-red-700">Error: {error.message}</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="p-4 border rounded">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h2 className="text-2xl font-bold">Fairdrop Auction</h2>

      {/* Connection Status */}
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Connection Info</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Status:</span>{' '}
            {isConnected ? (
              <span className="text-green-600">✓ Wallet Connected</span>
            ) : (
              <span className="text-yellow-600">Read-Only Mode</span>
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
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Auction State</h3>
          <div className="space-y-1 text-sm">
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
          <span className="font-medium">Bid Amount:</span>
          <input
            type="text"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter amount"
            className="mt-1 block w-full px-3 py-2 border rounded"
          />
        </label>
        <button
          onClick={handlePlaceBid}
          disabled={!bidAmount}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {canWrite ? 'Place Bid' : 'Connect Wallet to Bid'}
        </button>
        {!canWrite && (
          <p className="text-xs text-gray-600">
            You need to connect your wallet to place bids
          </p>
        )}
      </div>

      {/* Application ID */}
      <div className="text-xs text-gray-500">
        <p>Application ID: {applicationId}</p>
      </div>
    </div>
  );
}
