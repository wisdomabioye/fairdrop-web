import { getLineraClientManager } from "linera-react-client";

export interface AuctionConfig {
  startTimestamp: number | null;
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
  status: 'upcoming' | 'active' | 'ended';
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
    startPrice,
    floorPrice,
    decrementRate,
    decrementInterval,
  } = config;

  // If auction hasn't started yet
  if (startTimestamp && currentTime < startTimestamp) {
    return {
      currentPrice: startPrice || 0,
      timeToFloorPrice: 0,
      timeToStart: startTimestamp - currentTime,
      percentageDecreased: 0,
      status: 'upcoming',
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

  const isAtFloorPrice = calculatedPrice === (floorPrice || 0);

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
    status: 'active',
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
