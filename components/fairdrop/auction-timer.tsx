'use client';

import * as React from "react";

export interface AuctionTimerProps {
  endTime: Date | number;
  onComplete?: () => void;
  showMilliseconds?: boolean;
}


const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-glass border border-white/10 rounded-xl px-4 py-3 min-w-[70px]">
      <div className="text-3xl font-bold text-text-primary font-mono tabular-nums">
        {value.toString().padStart(2, "0")}
      </div>
    </div>
    <div className="text-xs text-text-secondary mt-1 uppercase tracking-wider">{label}</div>
  </div>
);

export function AuctionTimer({ endTime, onComplete, showMilliseconds = false }: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = typeof endTime === "number" ? endTime : endTime.getTime();
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsComplete(true);
        onComplete?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        milliseconds: Math.floor((difference % 1000) / 10),
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, showMilliseconds ? 50 : 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [endTime, onComplete, showMilliseconds]);

  if (isComplete) {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-success animate-pulse">
          Auction Ended
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-center justify-center">
      {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="Days" />}
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <span className="text-2xl text-text-secondary font-bold">:</span>
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <span className="text-2xl text-text-secondary font-bold">:</span>
      <TimeUnit value={timeLeft.seconds} label="Sec" />
      {showMilliseconds && (
        <>
          <span className="text-2xl text-text-secondary font-bold">.</span>
          <div className="flex flex-col items-center">
            <div className="bg-glass border border-white/10 rounded-xl px-3 py-3 min-w-[50px]">
              <div className="text-2xl font-bold text-text-primary font-mono tabular-nums">
                {timeLeft.milliseconds.toString().padStart(2, "0")}
              </div>
            </div>
            <div className="text-xs text-text-secondary mt-1 uppercase tracking-wider">MS</div>
          </div>
        </>
      )}
    </div>
  );
}
