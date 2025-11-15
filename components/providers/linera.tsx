"use client"
import { LineraProvider, LogLevel } from "linera-react-client";

export function AppLineraProvider({ children }: {children: React.ReactNode}) {

  return (
    <LineraProvider 
      faucetUrl="https://faucet.testnet-conway.linera.net"
      readOnlyWallet={{ constantAddress: "d9aba42ee6d009c1192aecbd61da2229c5d631dfa402f0c35cdf071d2b63e312" }}
      logging={{
        enabled: true,
        level: LogLevel.DEBUG
      }}
    >
      {children}
    </LineraProvider>
  )
}