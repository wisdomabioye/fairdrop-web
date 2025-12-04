'use client';

import { use } from 'react';
import { AuctionDetailHero } from '@/components/auction/auction-detail-hero';
import { AllBidsHistory } from '@/components/auction/all-bids-history';
import { UserBidsTab } from '@/components/auction/user-bids-tab';
import { AUCTION_DROPS } from '@/constant/drops';
import { notFound } from 'next/navigation';
import { useWalletConnection } from 'linera-react-client';
import { useState } from 'react';

interface AuctionDetailPageProps {
  params: Promise<{ auctionId: string }>;
}

export default function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { auctionId } = use(params);
  const { address, isConnected } = useWalletConnection();
  const [activeTab, setActiveTab] = useState<'all-bids' | 'my-bids'>('all-bids');

  // Find auction data
  const auctionData = AUCTION_DROPS.find(
    (drop) => drop.applicationId === auctionId
  );

  if (!auctionData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Hero Section - Auction Details & Bidding */}
      <AuctionDetailHero
        applicationId={auctionData.applicationId}
        title={auctionData.title}
        description={auctionData.description}
        imageUrl={auctionData.imageUrl}
        config={auctionData.config}
      />

      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 border-b border-border">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('all-bids')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'all-bids'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Bids
              {activeTab === 'all-bids' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('my-bids')}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'my-bids'
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              My Bids
              {activeTab === 'my-bids' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
              {isConnected && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 text-primary rounded">
                  Connected
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'all-bids' && (
          <AllBidsHistory applicationId={auctionData.applicationId} />
        )}

        {activeTab === 'my-bids' && (
          <UserBidsTab
            applicationId={auctionData.applicationId}
            walletAddress={address || ''}
            isConnected={isConnected}
          />
        )}
      </div>
    </div>
  );
}
