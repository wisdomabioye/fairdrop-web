import { InDevelopment } from "@/components/fairdrop/in-development";

export default function CreatePage() {
  return (
    <InDevelopment
      title="Create Auction"
      description="Create your own Dutch auction and list your items on Fairdrop. This feature is coming soon!"
      features={[
        "Upload item images and descriptions",
        "Set starting price and floor price",
        "Configure price drop intervals",
        "Deploy auction to Linera blockchain",
        "Real-time auction monitoring",
      ]}
    />
  );
}
