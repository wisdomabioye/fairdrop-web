"use client"
import { LineraProvider, LogLevel } from "linera-react-client";
import { CosmicLoading } from "@/components/fairdrop/cosmic-loading";

export function AppLineraProvider({ children }: {children: React.ReactNode}) {

  return (
    <LineraProvider
      faucetUrl="https://faucet.testnet-conway.linera.net"
      readOnlyWallet={{ constantAddress: "0x3000000000000000000000000000000000000003" }}
      fallback={<CosmicLoading />}
      logging={{
        enabled: true,
        level: LogLevel.DEBUG
      }}
    >
      {children}
    </LineraProvider>
  )
}