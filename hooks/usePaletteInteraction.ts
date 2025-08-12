import { useEffect, RefObject, useRef } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { PaletteRenderer } from '@/lib/canvas/paletteRenderer';
import { assetManager } from '@/lib/utils/assetManager';

export function usePaletteInteraction(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  rendererRef: RefObject<PaletteRenderer | null>
) {
  // Store refs to avoid recreating handlers on every state change
  const stateRef = useRef({
    paletteCamera: { x: 0, y: 0, zoom: 2 } as any,
    activeTilesetId: null as any,
    assets: [] as any[]
  });
  
  const actionsRef = useRef({
    panPalette: null as any,
    zoomPalette: null as any,
    setTileBrush: null as any,
    setPaletteDragSelect: null as any,
    setPalettePanning: null as any
  });
  
  // Update refs when state changes
  stateRef.current.paletteCamera = useEditorStore(state => state.paletteCamera);
  stateRef.current.activeTilesetId = useEditorStore(state => state.activeTilesetId);
  stateRef.current.assets = useEditorStore(state => state.assets);
  
  actionsRef.current.panPalette = useEditorStore(state => state.panPalette);
  actionsRef.current.zoomPalette = useEditorStore(state => state.zoomPalette);
  actionsRef.current.setTileBrush = useEditorStore(state => state.setTileBrush);
  actionsRef.current.setPaletteDragSelect = useEditorStore(state => state.setPaletteDragSelect);
  actionsRef.current.setPalettePanning = useEditorStore(state => state.setPalettePanning);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;
    
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let isDragging = false;
    let dragStart: { col: number; row: number } | null = null;
    
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Middle mouse or shift+left for panning
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        actionsRef.current.setPalettePanning(true);
        e.preventDefault();
        return;
      }
      
      if (e.button !== 0) return;
      
      const tile = renderer.screenToTile(x, y);
      if (tile) {
        isDragging = true;
        dragStart = tile;
        actionsRef.current.setPaletteDragSelect({
          startCol: tile.col,
          startRow: tile.row,
          endCol: tile.col,
          endRow: tile.row
        });
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        actionsRef.current.panPalette(dx, dy);
        panStart = { x: e.clientX, y: e.clientY };
      } else if (isDragging && dragStart) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const tile = renderer.screenToTile(x, y);
        if (tile) {
          actionsRef.current.setPaletteDragSelect({
            startCol: dragStart.col,
            startRow: dragStart.row,
            endCol: tile.col,
            endRow: tile.row
          });
        }
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        isPanning = false;
        actionsRef.current.setPalettePanning(false);
      } else if (isDragging && dragStart) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const tile = renderer.screenToTile(x, y);
        if (tile && stateRef.current.activeTilesetId) {
          const minCol = Math.min(dragStart.col, tile.col);
          const maxCol = Math.max(dragStart.col, tile.col);
          const minRow = Math.min(dragStart.row, tile.row);
          const maxRow = Math.max(dragStart.row, tile.row);
          
          const width = maxCol - minCol + 1;
          const height = maxRow - minRow + 1;
          
          // Get tileset meta
          const tileset = stateRef.current.assets.find(a => a.id === stateRef.current.activeTilesetId);
          if (tileset && tileset.meta) {
            const meta = tileset.meta as any;
            const img = assetManager.getImage(tileset.id);
            if (!img) return;
            const cols = Math.floor((img.width - 2 * meta.margin + meta.spacing) / (meta.tileW + meta.spacing));
            
            const indices: number[] = [];
            for (let r = 0; r < height; r++) {
              for (let c = 0; c < width; c++) {
                indices.push((minRow + r) * cols + (minCol + c));
              }
            }
            
            console.log('Setting tile brush:', { tilesetId: stateRef.current.activeTilesetId, indices, width, height });
            
            actionsRef.current.setTileBrush({
              tilesetId: stateRef.current.activeTilesetId,
              indices,
              width,
              height,
              originCol: minCol,
              originRow: minRow
            });
          }
        }
        
        isDragging = false;
        dragStart = null;
        actionsRef.current.setPaletteDragSelect(null);
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Trackpad pan vs zoom detection
      if (!(e.ctrlKey || e.metaKey || e.altKey)) {
        // Pan
        actionsRef.current.panPalette(-e.deltaX, -e.deltaY);
      } else {
        // Zoom
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        actionsRef.current.zoomPalette(delta, x, y);
      }
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []); // Empty dependency array since we use refs
}