import { useEffect, RefObject } from 'react';

export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: (entry: ResizeObserverEntry) => void
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry);
      }
    });
    
    observer.observe(element);
    
    // Trigger initial measurement
    const rect = element.getBoundingClientRect();
    callback({
      contentRect: rect,
      target: element,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: []
    } as ResizeObserverEntry);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, callback]);
}