'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-glass border border-primary/30 text-sm font-medium text-primary">
            <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            Descending-Price Auction Protocol
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
              Fair Price Discovery
            </span>
            <br />
            <span className="text-text-primary">For Everyone</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
            Fairdrop uses descending-price auctions with uniform clearing to ensure
            every participant pays the same fair market price. Transparent, equal, and efficient.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/auctions">
              <Button variant="primary" size="lg" className="min-w-[200px]">
                Browse Auctions
              </Button>
            </Link>
            <Link href="/create">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Create Auction
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-primary">$2.4M</div>
              <div className="text-sm text-text-secondary">Total Volume</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-secondary">1,247</div>
              <div className="text-sm text-text-secondary">Auctions</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-bold text-success">8,934</div>
              <div className="text-sm text-text-secondary">Participants</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
