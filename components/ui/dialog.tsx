'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

const variantStyles = {
  success: {
    icon: '✓',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
  },
  error: {
    icon: '✕',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
  info: {
    icon: 'ℹ',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  warning: {
    icon: '⚠',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  variant = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  showCancel = false,
}: DialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!mounted || (!open && !isVisible)) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const style = variantStyles[variant];

  const dialogContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Cosmic background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-4 left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-4 right-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />
        </div>

        {/* Dialog content */}
        <div
          className={`relative bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border ${style.border} rounded-2xl shadow-2xl ${style.glow} overflow-hidden`}
        >
          {/* Header with icon */}
          <div className="flex items-start gap-4 p-6 pb-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${style.iconBg} ${style.iconColor} text-2xl font-bold shrink-0`}>
              {style.icon}
            </div>
            <div className="flex-1 pt-2">
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-white/10">
            {showCancel && (
              <Button
                variant="outline"
                size="md"
                onClick={handleClose}
                className="min-w-[80px]"
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              className="min-w-[80px]"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}

// Hook for easier dialog management
export function useDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
  }>({
    open: false,
    title: '',
  });

  const showDialog = (config: Omit<typeof dialogState, 'open'>) => {
    setDialogState({ ...config, open: true });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  return {
    dialogState,
    showDialog,
    closeDialog,
  };
}
