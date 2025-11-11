'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const {
    isMetaMaskInstalled,
    isConnected,
    isConnecting,
    address,
    error: connectionError,
    connect,
    disconnect,
  } = useWalletConnection();

  // Call callbacks when connection state changes
  React.useEffect(() => {
    if (isConnected && address) {
      onConnect?.(address);
    }
  }, [isConnected, address, onConnect]);

  const handleConnect = async () => {
    // Check if MetaMask is installed
    if (!isMetaMaskInstalled) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      await connect();
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onDisconnect?.();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-glass border border-success/30 text-success text-sm font-medium">
          <span className="w-2 h-2 bg-success rounded-full inline-block mr-2 animate-pulse" />
          {formatAddress(address)}
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={handleConnect}
        isLoading={isConnecting}
        disabled={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      {connectionError && (
        <p className="text-xs text-error max-w-xs text-right">
          {connectionError.message}
        </p>
      )}
      {!isMetaMaskInstalled && !isConnecting && (
        <p className="text-xs text-text-secondary max-w-xs text-right">
          MetaMask not detected. Click to install.
        </p>
      )}
    </div>
  );
}
