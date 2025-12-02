import { MyBids } from '@/components/auction/my-bids';
import { AUCTION_DROPS } from '@/constant/drops';

export default function MyBidsPage() {

  return (
    <div>
      {
        AUCTION_DROPS.map((auctionData, index) => (
          <MyBids 
            key={auctionData.applicationId + index}
            applicationId={auctionData.applicationId} 
            walletAddress="" 
          />
        ))
      }
      
    </div>
  )
}
