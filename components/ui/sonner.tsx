'use client';

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-text-primary group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-glass group-[.toast]:text-text-secondary group-[.toast]:border group-[.toast]:border-white/10 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:hover:bg-white/10",
          closeButton:
            "group-[.toast]:bg-glass group-[.toast]:text-text-secondary group-[.toast]:border group-[.toast]:border-white/10 group-[.toast]:hover:bg-white/10",
          error:
            "group-[.toast]:bg-error/10 group-[.toast]:text-error group-[.toast]:border-error/20",
          success:
            "group-[.toast]:bg-success/10 group-[.toast]:text-success group-[.toast]:border-success/20",
          warning:
            "group-[.toast]:bg-warning/10 group-[.toast]:text-warning group-[.toast]:border-warning/20",
          info:
            "group-[.toast]:bg-info/10 group-[.toast]:text-info group-[.toast]:border-info/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
