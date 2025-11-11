'use client';

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { WalletConnect } from "./wallet-connect";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border backdrop-blur-xl bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 text-white"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fairdrop
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/auctions"
            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            Auctions
          </Link>
          <Link
            href="/create"
            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            Create
          </Link>
          <Link
            href="/my-bids"
            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            My Bids
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
