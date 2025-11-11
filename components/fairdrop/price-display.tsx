'use client';

import * as React from "react";

export interface PriceDisplayProps {
  currentPrice: number;
  startPrice?: number;
  floorPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
}

export function PriceDisplay({
  currentPrice,
  startPrice,
  floorPrice,
  currency = "USD",
  size = "md",
  showTrend = true,
}: PriceDisplayProps) {
  const [previousPrice, setPreviousPrice] = React.useState(currentPrice);
  const [trend, setTrend] = React.useState<"up" | "down" | "neutral">("neutral");

  React.useEffect(() => {
    if (currentPrice < previousPrice) {
      setTrend("down");
    } else if (currentPrice > previousPrice) {
      setTrend("up");
    }
    setPreviousPrice(currentPrice);
  }, [currentPrice, previousPrice]);

  const sizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  const trendColors = {
    up: "text-error",
    down: "text-success",
    neutral: "text-text-primary",
  };

  const trendIcons = {
    up: "↗",
    down: "↘",
    neutral: "→",
  };

  const discount = startPrice ? ((startPrice - currentPrice) / startPrice * 100).toFixed(0) : null;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-baseline gap-2">
        <span className={`font-bold ${sizes[size]} ${trendColors[trend]} transition-colors duration-300`}>
          ${currentPrice.toFixed(2)}
        </span>
        <span className="text-text-secondary text-lg">{currency}</span>
      </div>

      {showTrend && trend !== "neutral" && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[trend]}`}>
          <span className="text-lg">{trendIcons[trend]}</span>
          <span>Price {trend === "down" ? "decreasing" : "increasing"}</span>
        </div>
      )}

      {discount && parseFloat(discount) > 0 && (
        <div className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-semibold border border-success/30">
          {discount}% off from start
        </div>
      )}

      {startPrice && floorPrice && (
        <div className="flex gap-4 text-xs text-text-secondary mt-2">
          <div className="flex flex-col items-center">
            <span className="opacity-70">Start</span>
            <span className="font-medium">${startPrice.toFixed(2)}</span>
          </div>
          <div className="w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="opacity-70">Floor</span>
            <span className="font-medium">${floorPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
