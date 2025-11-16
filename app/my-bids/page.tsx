import { InDevelopment } from "@/components/fairdrop/in-development";

export default function MyBidsPage() {
  return (
    <InDevelopment
      title="My Bids"
      description="Track all your auction bids and purchases in one place. This feature is coming soon!"
      features={[
        "View all active bids",
        "Track bid history",
        "See won auctions",
        "Download purchase receipts",
        "Manage your items",
      ]}
    />
  );
}
