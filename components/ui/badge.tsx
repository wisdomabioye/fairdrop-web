import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  glow?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", glow = false, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200";

    const variants = {
      default: "bg-glass text-text-primary border border-white/10",
      success: "bg-success/20 text-success border border-success/30",
      warning: "bg-warning/20 text-warning border border-warning/30",
      error: "bg-error/20 text-error border border-error/30",
      info: "bg-secondary/20 text-secondary border border-secondary/30",
    };

    const glowEffect = glow ? "glow-effect" : "";

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${glowEffect} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
