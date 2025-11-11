import { Header } from "@/components/fairdrop/header";
import { HeroSection } from "@/components/fairdrop/hero-section";
import { FeaturedAuctions } from "@/components/fairdrop/featured-auctions";
import { HowItWorks } from "@/components/fairdrop/how-it-works";
import { ExampleAuctionComponent } from "@/components/Linera/ExampleAuctionComponent";

export default function Home() {
  return (
    <div className="min-h-screen space-bg">
      <Header />
      <main>
        <ExampleAuctionComponent 
          applicationId="21396e21a43fd7c365ce58d32062583fec83a956033d02f80a0bc6f330435334"
        />
        <HeroSection />
        <FeaturedAuctions />
        <HowItWorks />
      </main>
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-text-secondary text-sm">
          <p>© 2025 Fairdrop. Built on Linera Blockchain.</p>
          <p className="mt-2">Transparent • Fair • Decentralized</p>
        </div>
      </footer>
    </div>
  );
}
