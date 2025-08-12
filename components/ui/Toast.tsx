'use client';

import { FC, useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export const Toast: FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        {
          'bg-[--panel] text-[--text] border border-[#2a334d]': type === 'info',
          'bg-[--ok] text-white': type === 'success',
          'bg-[--danger] text-white': type === 'error',
          'bg-[--outline] text-black': type === 'warning',
        }
      )}
    >
      {message}
    </div>
  );
};

// Toast manager
let toastContainer: HTMLDivElement | null = null;

export function showToast(message: string, type?: ToastProps['type']) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toastElement = document.createElement('div');
  toastContainer.appendChild(toastElement);

  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(toastElement);
    root.render(
      <Toast
        message={message}
        type={type}
        onClose={() => {
          root.unmount();
          toastElement.remove();
        }}
      />
    );
  });
}