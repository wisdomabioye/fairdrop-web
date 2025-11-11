import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  variant?: "default" | "gradient";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value, max = 100, showLabel = false, variant = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const barVariants = {
      default: "bg-primary",
      gradient: "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] stage-progress",
    };

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        <div className="relative h-3 bg-glass rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-500 ease-out ${barVariants[variant]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="text-xs text-text-secondary mt-1 text-right">
            {value} / {max} ({percentage.toFixed(0)}%)
          </p>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
