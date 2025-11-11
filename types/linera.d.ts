/**
 * Type declarations for Linera client loaded from public directory
 */

// Allow dynamic imports with full URLs (for the loader)
declare module '*/linera/linera_web.js' {
  export * from '@linera/client';
  export { default } from '@linera/client';
}
