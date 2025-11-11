'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PriceDisplay } from "./price-display";
import { AuctionTimer } from "./auction-timer";
import { Button } from "@/components/ui/button";

export interface AuctionCardProps {
  id: string;
  title: string;
  description?: string;
  currentPrice: number;
  startPrice: number;
  floorPrice: number;
  totalSupply: number;
  soldQuantity: number;
  endTime: Date | number;
  status: "active" | "upcoming" | "ended";
  imageUrl?: string;
  onBid?: (auctionId: string) => void;
  isLoading?: boolean;
}

export function AuctionCard({
  id,
  title,
  description,
  currentPrice,
  startPrice,
  floorPrice,
  totalSupply,
  soldQuantity,
  endTime,
  status,
  imageUrl,
  onBid,
  isLoading,
}: AuctionCardProps) {
  const percentageSold = (soldQuantity / totalSupply) * 100;
  const remaining = totalSupply - soldQuantity;

  const statusConfig = {
    active: { label: "Live", variant: "success" as const, glow: true },
    upcoming: { label: "Upcoming", variant: "info" as const, glow: false },
    ended: { label: "Ended", variant: "default" as const, glow: false },
  };

  return (
    <Card variant="cosmic" hover className="overflow-hidden group">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-2">
          <Badge variant={statusConfig[status].variant} glow={statusConfig[status].glow}>
            {statusConfig[status].label}
          </Badge>
          {remaining <= 10 && remaining > 0 && (
            <Badge variant="warning" glow>
              Only {remaining} left!
            </Badge>
          )}
        </div>
        <CardTitle className="group-hover:text-primary transition-colors">{title}</CardTitle>
        {description && (
          <p className="text-sm text-text-secondary mt-2">{description}</p>
        )}
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Image Preview */}
        {imageUrl && (
          <div className="relative h-48 rounded-lg overflow-hidden bg-glass border border-white/10">
            {/* eslint-disable-next-line */}
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Price Display */}
        <PriceDisplay
          currentPrice={currentPrice}
          startPrice={startPrice}
          floorPrice={floorPrice}
          size="md"
        />

        {/* Supply Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Supply</span>
            <span className="text-text-primary font-medium">
              {soldQuantity.toLocaleString()} / {totalSupply.toLocaleString()}
            </span>
          </div>
          <Progress value={soldQuantity} max={totalSupply} variant="gradient" />
          <p className="text-xs text-text-secondary text-center">
            {percentageSold.toFixed(1)}% claimed
          </p>
        </div>

        {/* Timer */}
        {status === "active" && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-text-secondary text-center mb-3 uppercase tracking-wider">
              Time Remaining
            </p>
            <AuctionTimer endTime={endTime} />
          </div>
        )}

        {status === "upcoming" && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-text-secondary text-center mb-3 uppercase tracking-wider">
              Starts In
            </p>
            <AuctionTimer endTime={endTime} />
          </div>
        )}
      </CardContent>

      <CardFooter className="relative">
        {status === "active" && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => onBid?.(id)}
            isLoading={isLoading}
            disabled={remaining === 0}
          >
            {remaining === 0 ? "Sold Out" : "Place Bid"}
          </Button>
        )}
        {status === "upcoming" && (
          <Button variant="outline" size="lg" className="w-full" disabled>
            Not Started
          </Button>
        )}
        {status === "ended" && (
          <Button variant="ghost" size="lg" className="w-full" disabled>
            Auction Ended
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
