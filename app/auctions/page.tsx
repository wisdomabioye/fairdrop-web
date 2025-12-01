'use client';

import { useState, useMemo } from 'react';
import { AuctionCard } from "@/components/auction/auction-card";
import { AUCTION_DROPS } from "@/constant/drops";
import { Badge } from "@/components/ui/badge";

type FilterStatus = 'all' | 'active' | 'upcoming' | 'ended';

export default function AuctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: AUCTION_DROPS.length,
      active: AUCTION_DROPS.length, // In production, this would check actual status
      totalItems: AUCTION_DROPS.reduce((sum, drop) => sum + (drop.config?.totalQuantity || 0), 0),
    };
  }, []);

  // Filter auctions
  const filteredAuctions = useMemo(() => {
    return AUCTION_DROPS.filter(auction => {
      const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           auction.description.toLowerCase().includes(searchQuery.toLowerCase());
      // In production, you would filter by actual status from blockchain
      const matchesFilter = filterStatus === 'all' || filterStatus === 'active';
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus]);

  return (
    <>
      {/* Hero Section with Animated Background */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated cosmic particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Page Header */}
          <div className="text-center mb-12 space-y-6">
            <div className="inline-block">
              <Badge variant="info" className="text-sm px-4 py-2 mb-4">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Auctions
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient">Exclusive</span> Drops
            </h1>

            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Fair, transparent, and decentralized Dutch auctions on Linera blockchain.
              Watch prices drop in real-time and secure your items at the perfect moment.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-bold text-primary mb-2">{stats.total}</div>
                <div className="text-sm text-text-secondary uppercase tracking-wide">Total Auctions</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-accent rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-bold text-secondary mb-2">{stats.active}</div>
                <div className="text-sm text-text-secondary uppercase tracking-wide">Active Now</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-4xl font-bold text-accent mb-2">{stats.totalItems.toLocaleString()}</div>
                <div className="text-sm text-text-secondary uppercase tracking-wide">Items Available</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              {/* Search Bar */}
              <div className="relative mb-6">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search auctions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-glass border border-white/20 rounded-xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    filterStatus === 'all'
                      ? 'bg-primary text-white shadow-lg shadow-primary/50'
                      : 'bg-glass border border-white/10 text-text-secondary hover:border-primary/50'
                  }`}
                >
                  All Auctions
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    filterStatus === 'active'
                      ? 'bg-secondary text-white shadow-lg shadow-secondary/50'
                      : 'bg-glass border border-white/10 text-text-secondary hover:border-secondary/50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('upcoming')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    filterStatus === 'upcoming'
                      ? 'bg-accent text-white shadow-lg shadow-accent/50'
                      : 'bg-glass border border-white/10 text-text-secondary hover:border-accent/50'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilterStatus('ended')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                    filterStatus === 'ended'
                      ? 'bg-text-secondary text-white shadow-lg'
                      : 'bg-glass border border-white/10 text-text-secondary hover:border-text-secondary/50'
                  }`}
                >
                  Ended
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auctions Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {filteredAuctions.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-text-secondary">
                  Showing <span className="font-semibold text-primary">{filteredAuctions.length}</span> auction{filteredAuctions.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredAuctions.map((auctionData, index) => (
                  <div
                    key={auctionData.applicationId + index}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <AuctionCard {...auctionData} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-glass border border-white/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-3">No auctions found</h3>
                <p className="text-text-secondary mb-6">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
