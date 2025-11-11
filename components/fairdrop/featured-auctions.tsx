'use client';

import { AuctionCard } from "./auction-card";

// Mock data - replace with real data from Linera blockchain
const mockAuctions = [
  {
    id: "1",
    title: "Genesis NFT Collection",
    description: "Limited edition NFT collection from top artists",
    currentPrice: 0.12,
    startPrice: 0.18,
    floorPrice: 0.08,
    totalSupply: 1000,
    soldQuantity: 627,
    endTime: Date.now() + 3600000 * 24, // 24 hours from now
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "FAIR Token Launch",
    description: "Governance token for Fairdrop protocol",
    currentPrice: 0.45,
    startPrice: 1.0,
    floorPrice: 0.25,
    totalSupply: 10000000,
    soldQuantity: 4523000,
    endTime: Date.now() + 3600000 * 12, // 12 hours from now
    status: "active" as const,
  },
  {
    id: "3",
    title: "Digital Art Masterpiece",
    description: "One-of-a-kind digital artwork",
    currentPrice: 2.5,
    startPrice: 5.0,
    floorPrice: 1.5,
    totalSupply: 1,
    soldQuantity: 0,
    endTime: Date.now() + 3600000 * 48, // 48 hours from now
    status: "active" as const,
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
  },
];

export function FeaturedAuctions() {
  const handleBid = (auctionId: string) => {
    console.log("Bidding on auction:", auctionId);
    // Implement bid logic here
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Live Auctions
            </h2>
            <p className="text-text-secondary">
              Participate in active auctions and secure fair prices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-success font-medium">
              {mockAuctions.filter(a => a.status === "active").length} Active
            </span>
          </div>
        </div>

        {/* Auction Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAuctions.map((auction) => (
            <AuctionCard key={auction.id} {...auction} onBid={handleBid} />
          ))}
        </div>
      </div>
    </section>
  );
}
