import { getLineraClientManager } from "linera-react-client";
import { AuctionStatus } from "@/stores/auction-store";

export interface AuctionConfig {
  startTimestamp: number | null;
  endTimestamp: number | null;
  decrementRate: number | null;
  decrementInterval: number | null;
  startPrice: number | null;
  floorPrice: number | null;
  totalQuantity?: number | null;
}

export interface CalculatedAuctionState {
  currentPrice: number;
  timeToFloorPrice: number; // milliseconds
  timeToStart: number; // milliseconds (negative if started)
  percentageDecreased: number; // 0-100
  status: AuctionStatus;
  isAtFloorPrice: boolean;
  nextPriceDropIn: number; // milliseconds until next price drop
}

/**
 * Calculate the current state of a Dutch auction based on config
 * Dutch auction: price starts high and decreases over time until floor price
 */
export function calculateAuctionState(
  config: AuctionConfig,
  currentTime: number = Date.now()
): CalculatedAuctionState {
  const {
    startTimestamp,
    endTimestamp,
    startPrice,
    floorPrice,
    decrementRate,
    decrementInterval,
  } = config;

  if (endTimestamp && currentTime > endTimestamp) {
    return {
      currentPrice: floorPrice || 0,
      timeToFloorPrice: 0,
      timeToStart: 0,
      percentageDecreased: 0,
      status: AuctionStatus.Ended,
      isAtFloorPrice: false,
      nextPriceDropIn: 0,
    };
  }

  // If auction hasn't started yet
  if (startTimestamp && currentTime < startTimestamp) {
    return {
      currentPrice: startPrice || 0,
      timeToFloorPrice: 0,
      timeToStart: startTimestamp - currentTime,
      percentageDecreased: 0,
      status: AuctionStatus.Scheduled,
      isAtFloorPrice: false,
      nextPriceDropIn: 0,
    };
  }

  // Calculate time elapsed since start
  const elapsedTime = startTimestamp ? currentTime - startTimestamp : 0;

  // Calculate how many price decrements have occurred
  const numDecrements = decrementInterval && decrementInterval > 0
    ? Math.floor(elapsedTime / decrementInterval)
    : 0;

  // Calculate current price
  const priceReduction = (decrementRate || 0) * numDecrements;
  const calculatedPrice = Math.max(
    (startPrice || 0) - priceReduction,
    floorPrice || 0
  );

  const isAtFloorPrice = calculatedPrice <= (floorPrice || 0);

  // Calculate time until next price drop
  let nextPriceDropIn = 0;
  if (!isAtFloorPrice && decrementInterval) {
    const timeSinceLastDrop = elapsedTime % decrementInterval;
    nextPriceDropIn = decrementInterval - timeSinceLastDrop;
  }

  // Calculate time until floor price
  let timeToFloorPrice = 0;
  if (!isAtFloorPrice && startPrice && floorPrice && decrementRate && decrementInterval) {
    const remainingPriceToFloor = calculatedPrice - floorPrice;
    const remainingDecrements = Math.ceil(remainingPriceToFloor / decrementRate);
    timeToFloorPrice = remainingDecrements * decrementInterval;
  }

  // Calculate percentage decreased
  const totalPriceRange = (startPrice || 0) - (floorPrice || 0);
  const priceDecreased = (startPrice || 0) - calculatedPrice;
  const percentageDecreased = totalPriceRange > 0
    ? (priceDecreased / totalPriceRange) * 100
    : 0;

  return {
    currentPrice: calculatedPrice,
    timeToFloorPrice,
    timeToStart: startTimestamp ? startTimestamp - currentTime : 0,
    percentageDecreased,
    status: AuctionStatus.Active,
    isAtFloorPrice,
    nextPriceDropIn,
  };
}

/**
 * Calculate the next price after current price drops
 */
export function getNextPrice(config: AuctionConfig, currentPrice: number): number {
  const { decrementRate, floorPrice } = config;
  const nextPrice = currentPrice - (decrementRate || 0);
  return Math.max(nextPrice, floorPrice || 0);
}

/**
 * Check if auction has reached floor price
 */
export function isAtFloorPrice(currentPrice: number, floorPrice: number | null): boolean {
  return currentPrice === (floorPrice || 0);
}


export async function handleWasmFailureRecovery() {
  const manager = getLineraClientManager();
  if (!manager?.reinit) {
    window.location.reload();
    return;
  }
  try {
    await manager.reinit();
    // optionally retry the failed query here
  } catch (e) {
    window.location.reload();
  }
}
