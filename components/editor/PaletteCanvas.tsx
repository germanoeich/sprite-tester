'use client';

import { FC, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { PaletteRenderer } from '@/lib/canvas/paletteRenderer';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { usePaletteInteraction } from '@/hooks/usePaletteInteraction';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { usePaletteCanvasState } from '@/hooks/useOptimizedEditorStore';

export const PaletteCanvas: FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PaletteRenderer | null>(null);
  
  // Subscribe to relevant state with optimized selectors
  const {
    paletteCamera,
    activeTilesetId,
    assets,
    tileBrush,
    paletteDragSelect
  } = usePaletteCanvasState();
  
  const activeTileset = useMemo(() => 
    assets.find(a => a.id === activeTilesetId), 
    [assets, activeTilesetId]
  );
  
  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    rendererRef.current = new PaletteRenderer(canvas, ctx);
    
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);
  
  // Update renderer when state changes
  useEffect(() => {
    if (!rendererRef.current) return;
    
    rendererRef.current.updateCamera(paletteCamera);
    rendererRef.current.setTileset(activeTileset || null);
    rendererRef.current.setTileBrush(tileBrush);
    rendererRef.current.setDragSelect(paletteDragSelect);
  }, [paletteCamera, activeTileset, tileBrush, paletteDragSelect]);
  
  // Handle canvas resize with memoized callback
  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    if (!canvasRef.current || !rendererRef.current) return;
    
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = entry.contentRect;
    
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rendererRef.current.setContext(ctx);
      rendererRef.current.setDPR(dpr);
    }
  }, []);
  
  useResizeObserver(canvasRef, handleResize);
  
  // Animation frame with memoized callback
  const render = useCallback(() => {
    rendererRef.current?.render();
  }, []);
  
  useAnimationFrame(render);
  
  // Handle interactions
  usePaletteInteraction(canvasRef, rendererRef);
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full cursor-move"
      style={{ imageRendering: 'pixelated' }}
    />
  );
});

PaletteCanvas.displayName = 'PaletteCanvas';