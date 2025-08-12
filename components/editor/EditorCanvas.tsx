'use client';

import { FC, useRef, useEffect, useCallback, memo } from 'react';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { useEditorCanvasState } from '@/hooks/useOptimizedEditorStore';

export const EditorCanvas: FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  
  // Subscribe to relevant state with optimized selectors
  const {
    camera,
    layers,
    gridVisible,
    gameResolution,
    ppu,
    selection,
    assets,
    mode,
    tileBrush
  } = useEditorCanvasState();
  
  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    rendererRef.current = new CanvasRenderer(canvas, ctx);
    
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);
  
  // Update renderer when state changes
  useEffect(() => {
    if (!rendererRef.current) return;
    
    rendererRef.current.updateCamera(camera);
    rendererRef.current.updateLayers(layers);
    rendererRef.current.setGridVisible(gridVisible);
    rendererRef.current.setGameResolution(gameResolution);
    rendererRef.current.setPPU(ppu);
    rendererRef.current.setSelection(selection);
    rendererRef.current.setAssets(assets);
    rendererRef.current.setMode(mode);
    rendererRef.current.setTileBrush(tileBrush);
  }, [camera, layers, gridVisible, gameResolution, ppu, selection, assets, mode, tileBrush]);
  
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
  useCanvasInteraction(canvasRef, rendererRef);
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
    />
  );
});

EditorCanvas.displayName = 'EditorCanvas';