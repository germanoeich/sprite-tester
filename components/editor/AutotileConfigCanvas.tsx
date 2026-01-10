'use client';

import { FC, useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { assetManager } from '@/lib/utils/assetManager';
import type { AutotileConfigTab, AutotileAssignmentTool, TilesetMetadata, AutotileSourceConfig } from '@/types';
import type { WallSideConfig, GroundSideConfig } from '@/lib/autotile/types';
import { createDefaultAutotileConfig } from '@/lib/autotile/defaults';

interface Props {
  tilesetId: string;
  category: AutotileConfigTab;
  tool: AutotileAssignmentTool;
}

// Pattern dimensions
const RECT_PATTERN_GROUND = { cols: 5, rows: 4 };
const RECT_PATTERN_WALL_TOP = { cols: 5, rows: 3 };
const CROSS_PATTERN = { cols: 4, rows: 4 };
const WALL_SIDE_PATTERN = { cols: 5, rows: 2 };
const GROUND_SIDE_PATTERN = { cols: 5, rows: 4 };

// Colors for overlays
const COLORS = {
  rect: 'rgba(59, 130, 246, 0.4)', // blue
  rectBorder: '#3b82f6',
  cross: 'rgba(34, 197, 94, 0.4)', // green
  crossBorder: '#22c55e',
  single: 'rgba(234, 179, 8, 0.4)', // yellow
  singleBorder: '#eab308',
  hover: 'rgba(255, 255, 255, 0.2)',
  hoverBorder: '#ffffff',
};

export const AutotileConfigCanvas: FC<Props> = ({ tilesetId, category, tool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 3 });
  const [hoverTile, setHoverTile] = useState<{ col: number; row: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const assets = useEditorStore(state => state.assets);
  const updateAutotileSourceConfig = useEditorStore(state => state.updateAutotileSourceConfig);
  const updateAutotileSideConfig = useEditorStore(state => state.updateAutotileSideConfig);
  const initializeAutotileConfig = useEditorStore(state => state.initializeAutotileConfig);

  const tileset = assets.find(a => a.id === tilesetId);
  const meta = tileset?.meta as TilesetMetadata | undefined;
  const autotileConfig = meta?.autotileConfig;

  const padding = 10;

  // Initialize/fix autotile config if needed (also handles missing fields in older configs)
  useEffect(() => {
    if (tileset) {
      initializeAutotileConfig(tilesetId);
    }
  }, [tileset, tilesetId, initializeAutotileConfig]);

  // Get current config for the active category
  const currentConfig = (category === 'ground' || category === 'wallTop')
    ? autotileConfig?.[category]
    : null;

  // Get side config for wallSide/groundSide tabs
  const sideConfig = category === 'wallSide'
    ? autotileConfig?.wallSide
    : category === 'groundSide'
      ? autotileConfig?.groundSide
      : null;

  // Get the appropriate pattern for side configs
  const sidePattern = category === 'wallSide'
    ? WALL_SIDE_PATTERN
    : category === 'groundSide'
      ? GROUND_SIDE_PATTERN
      : null;

  // Get the appropriate rect pattern (ground=5x4, wallTop=5x3)
  const rectPattern = category === 'wallTop'
    ? RECT_PATTERN_WALL_TOP
    : RECT_PATTERN_GROUND;

  const screenToTile = useCallback((screenX: number, screenY: number): { col: number; row: number } | null => {
    if (!tileset || !meta) return null;

    const img = assetManager.getImage(tilesetId);
    if (!img) return null;

    const { tileW, tileH, margin, spacing } = meta;

    // Convert screen to image space
    const ix = (screenX - padding - camera.x) / camera.zoom;
    const iy = (screenY - padding - camera.y) / camera.zoom;

    if (ix < 0 || iy < 0 || ix > img.width || iy > img.height) {
      return null;
    }

    const col = Math.floor((ix - margin) / (tileW + spacing));
    const row = Math.floor((iy - margin) / (tileH + spacing));

    if (col < 0 || row < 0) return null;

    const ix0 = margin + col * (tileW + spacing);
    const iy0 = margin + row * (tileH + spacing);

    if (ix >= ix0 && ix < ix0 + tileW && iy >= iy0 && iy < iy0 + tileH) {
      return { col, row };
    }

    return null;
  }, [tileset, meta, tilesetId, camera, padding]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tileset || !meta) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = assetManager.getImage(tilesetId);
    if (!img) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    // Clear
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    ctx.save();

    // Apply camera transform
    ctx.translate(padding + camera.x, padding + camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw tileset image
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);

    const { tileW, tileH, margin, spacing } = meta;

    // Draw grid overlay
    ctx.lineWidth = 1 / camera.zoom;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';

    const imgWidth = img.width;
    const imgHeight = img.height;

    for (let y = margin; y + tileH <= imgHeight - margin; y += tileH + spacing) {
      for (let x = margin; x + tileW <= imgWidth - margin; x += tileW + spacing) {
        ctx.strokeRect(x, y, tileW, tileH);
      }
    }

    // Draw current assignments
    if (currentConfig) {
      // Draw rect pattern overlay
      drawPatternOverlay(ctx, currentConfig.rectOrigin, rectPattern, margin, tileW, tileH, spacing, COLORS.rect, COLORS.rectBorder);

      // Draw cross pattern overlay
      drawPatternOverlay(ctx, currentConfig.crossOrigin, CROSS_PATTERN, margin, tileW, tileH, spacing, COLORS.cross, COLORS.crossBorder);

      // Draw single tile overlay (if set)
      if (currentConfig.singleTile) {
        const singleX = margin + currentConfig.singleTile.x * (tileW + spacing);
        const singleY = margin + currentConfig.singleTile.y * (tileH + spacing);
        ctx.fillStyle = COLORS.single;
        ctx.fillRect(singleX, singleY, tileW, tileH);
        ctx.strokeStyle = COLORS.singleBorder;
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(singleX, singleY, tileW, tileH);
      }
    }

    // Draw side config assignments (wallSide/groundSide)
    if (sideConfig && sidePattern) {
      drawPatternOverlay(ctx, sideConfig.rectOrigin, sidePattern, margin, tileW, tileH, spacing, COLORS.rect, COLORS.rectBorder);
    }

    // Draw hover preview
    if (hoverTile) {
      let previewPattern = { cols: 1, rows: 1 };
      if (sidePattern) {
        // Side configs only use rect pattern
        previewPattern = sidePattern;
      } else if (tool === 'rect') {
        previewPattern = rectPattern;
      } else if (tool === 'cross') {
        previewPattern = CROSS_PATTERN;
      }

      const x = margin + hoverTile.col * (tileW + spacing);
      const y = margin + hoverTile.row * (tileH + spacing);
      const w = previewPattern.cols * tileW + (previewPattern.cols - 1) * spacing;
      const h = previewPattern.rows * tileH + (previewPattern.rows - 1) * spacing;

      ctx.fillStyle = COLORS.hover;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = COLORS.hoverBorder;
      ctx.lineWidth = 2 / camera.zoom;
      ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [tileset, meta, tilesetId, camera, currentConfig, sideConfig, sidePattern, hoverTile, tool, padding]);

  function drawPatternOverlay(
    ctx: CanvasRenderingContext2D,
    origin: { x: number; y: number },
    pattern: { cols: number; rows: number },
    margin: number,
    tileW: number,
    tileH: number,
    spacing: number,
    fillColor: string,
    strokeColor: string
  ) {
    const x = margin + origin.x * (tileW + spacing);
    const y = margin + origin.y * (tileH + spacing);
    const w = pattern.cols * tileW + (pattern.cols - 1) * spacing;
    const h = pattern.rows * tileH + (pattern.rows - 1) * spacing;

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2 / camera.zoom;
    ctx.strokeRect(x, y, w, h);
  }

  // Animation frame
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [render]);

  // Handle resize
  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = entry.contentRect;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  useResizeObserver(canvasRef, handleResize);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      // Pan
      setIsPanning(true);
      setLastMouse({ x, y });
    } else if (e.button === 2) {
      // Right-click to clear single tile selection
      if (tool === 'single' && category !== 'wallSide' && category !== 'groundSide') {
        const catKey = category as 'ground' | 'wallTop';
        updateAutotileSourceConfig(tilesetId, catKey, {
          singleTile: undefined
        });
      }
    } else if (e.button === 0) {
      // Click to assign
      const tile = screenToTile(x, y);
      if (tile) {
        if (category === 'wallSide' || category === 'groundSide') {
          // Side configs only have rect origin
          updateAutotileSideConfig(tilesetId, category, { x: tile.col, y: tile.row });
        } else {
          const catKey = category as 'ground' | 'wallTop';
          if (tool === 'rect') {
            updateAutotileSourceConfig(tilesetId, catKey, {
              rectOrigin: { x: tile.col, y: tile.row }
            });
          } else if (tool === 'cross') {
            updateAutotileSourceConfig(tilesetId, catKey, {
              crossOrigin: { x: tile.col, y: tile.row }
            });
          } else if (tool === 'single') {
            // Toggle: if clicking on currently selected single tile, clear it
            const currentSingle = currentConfig?.singleTile;
            if (currentSingle && currentSingle.x === tile.col && currentSingle.y === tile.row) {
              updateAutotileSourceConfig(tilesetId, catKey, {
                singleTile: undefined
              });
            } else {
              updateAutotileSourceConfig(tilesetId, catKey, {
                singleTile: { x: tile.col, y: tile.row }
              });
            }
          }
        }
      }
    }
  }, [screenToTile, tool, category, tilesetId, currentConfig, updateAutotileSourceConfig, updateAutotileSideConfig]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isPanning) {
      const dx = x - lastMouse.x;
      const dy = y - lastMouse.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMouse({ x, y });
    } else {
      const tile = screenToTile(x, y);
      setHoverTile(tile);
    }
  }, [isPanning, lastMouse, screenToTile]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setHoverTile(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(10, Math.max(0.5, camera.zoom * (1 + delta)));

    const zoomRatio = newZoom / camera.zoom;
    const pivotX = x - padding;
    const pivotY = y - padding;

    setCamera(prev => ({
      x: pivotX - (pivotX - prev.x) * zoomRatio,
      y: pivotY - (pivotY - prev.y) * zoomRatio,
      zoom: newZoom
    }));
  }, [camera.zoom, padding]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
    />
  );
};
