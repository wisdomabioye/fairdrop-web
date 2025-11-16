'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export interface InDevelopmentProps {
  title?: string;
  description?: string;
  features?: string[];
  showBackButton?: boolean;
}

export function InDevelopment({
  title = "Coming Soon",
  description = "We're working hard to bring you this feature. Stay tuned!",
  features = [],
  showBackButton = true,
}: InDevelopmentProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen space-bg flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Rotating rings */}
              <div className="absolute inset-0 -m-4">
                <div className="w-32 h-32 border-4 border-primary/30 rounded-full animate-spin" style={{ animationDuration: "3s" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
                </div>
              </div>
              <div className="absolute inset-0 -m-2">
                <div className="w-28 h-28 border-4 border-secondary/30 rounded-full animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
                </div>
              </div>

              {/* Center icon */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {title}
          </h1>

          {/* Description */}
          <p className="text-text-secondary text-center mb-8 text-lg">
            {description}
          </p>

          {/* Features List */}
          {features.length > 0 && (
            <div className="mb-8 space-y-3">
              <h3 className="text-text-primary font-semibold text-center mb-4">
                Upcoming Features:
              </h3>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-glass border border-white/10 backdrop-blur-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary shrink-0 animate-pulse" />
                    <span className="text-text-secondary text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
            <p className="text-xs text-text-secondary text-center">
              Development in progress...
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.back()}
                className="min-w-[150px]"
              >
                Go Back
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/")}
              className="min-w-[150px]"
            >
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
