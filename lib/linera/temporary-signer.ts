/**
 * Temporary Signer for Guest Mode
 *
 * Creates an ephemeral in-memory signer for read-only operations
 * when MetaMask is not connected. Keys are randomly generated and
 * NOT persisted.
 */

import { ethers } from 'ethers';
import { Signer as SignerInterface } from '@linera/client';

/**
 * A temporary, ephemeral signer for guest/anonymous mode
 *
 * WARNING: This signer generates random keys that are NOT saved.
 * Use only for read-only operations or testing. Any chains/assets
 * claimed with this signer will be lost when the page reloads.
 */
export class TemporarySigner implements SignerInterface {
  private wallet: ethers.Wallet;

  constructor() {
    // Generate a random wallet (ephemeral, not persisted)
    this.wallet = ethers.Wallet.createRandom() as unknown as ethers.Wallet;
    console.log('[TemporarySigner] Generated ephemeral wallet:', this.wallet.address);
  }

  /**
   * Sign a message with the temporary private key
   */
  async sign(owner: string, value: Uint8Array): Promise<string> {
    // Verify the owner matches our temporary address
    if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new Error(
        `Owner mismatch: expected ${this.wallet.address}, got ${owner}`
      );
    }

    // Convert Uint8Array to hex string
    const msgHex = `0x${uint8ArrayToHex(value)}`;

    try {
      // Sign using ethers personal sign (EIP-191)
      const signature = await this.wallet.signMessage(ethers.getBytes(msgHex));
      return signature;
    } catch (err) {
      throw new Error(
        `Temporary signer failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Check if this signer contains a specific key
   */
  async containsKey(owner: string): Promise<boolean> {
    return owner.toLowerCase() === this.wallet.address.toLowerCase();
  }

  /**
   * Get the temporary wallet address
   */
  async address(): Promise<string> {
    return this.wallet.address;
  }

  /**
   * Get the private key (for debugging only - NEVER expose in production)
   */
  getPrivateKey(): string {
    return this.wallet.privateKey;
  }
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}
