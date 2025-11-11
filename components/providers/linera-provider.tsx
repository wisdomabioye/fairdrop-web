/**
 * Linera Provider
 *
 * Initializes the Linera client at app startup
 */

'use client';

import { useEffect, useState } from 'react';
import { createLineraClient } from '@/lib/linera';

interface LineraProviderProps {
  children: React.ReactNode;
  faucetUrl: string;
  autoConnect?: boolean;
}

/**
 * Provider that initializes Linera client on mount
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <LineraProvider faucetUrl="http://localhost:8080">
 *           {children}
 *         </LineraProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function LineraProvider({
  children,
  faucetUrl,
  autoConnect = false,
}: LineraProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initClient = async () => {
      try {
        console.log('[LineraProvider] Initializing client...');

        // Create client manager
        const clientManager = createLineraClient({
          faucetUrl,
          autoConnect,
          network: 'testnet', // Adjust based on your needs
        });

        // Initialize in read-only mode
        await clientManager.initializeReadOnly();

        setIsInitialized(true);
        console.log('[LineraProvider] Client initialized successfully');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[LineraProvider] Initialization failed:', error);
        setError(error);
      }
    };

    initClient();
  }, [faucetUrl, autoConnect]);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Linera Initialization Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Initializing Linera client...</p>
      </div>
    );
  }

  return <>{children}</>;
}
