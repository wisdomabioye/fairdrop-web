import { HeroSection } from "@/components/fairdrop/hero-section";
import { ProblemSolution } from "@/components/fairdrop/problem-solution";
import { Features } from "@/components/fairdrop/features";
import { Roadmap } from "@/components/fairdrop/roadmap";
import { Vision } from "@/components/fairdrop/vision";
import { HowItWorks } from "@/components/fairdrop/how-it-works";
import { AuctionCardCompact } from "@/components/auction/auction-card-compact";
import { AUCTION_DROPS } from "@/constant/drops";

export default function Home() {
  return (
    <>
        <HeroSection />

        {/* Live Auctions */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Live Auctions
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Discover exclusive items in real-time Dutch auctions. Prices drop automatically until sold out.
              </p>
            </div>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {
                AUCTION_DROPS.map((auctionData, index) => (
                  <AuctionCardCompact
                    key={auctionData.applicationId + index}
                    {...auctionData}
                  />
                ))
              }
            </div>
          </div>
        </section>

        {/* Problem & Solution */}
        <ProblemSolution />
        

        {/* How It Works */}
        <HowItWorks />
        
        {/* Core Features */}
        <Features />

        {/* Roadmap */}
        <Roadmap />

        {/* Vision */}
        <Vision />
    </>
  );
}
