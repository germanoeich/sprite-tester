import { useEffect, RefObject, useRef, useCallback } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { screenToWorld, snapToGrid } from '@/lib/utils/geometry';
import { generateId } from '@/lib/utils/id';

export function useCanvasInteraction(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  rendererRef: RefObject<CanvasRenderer | null>
) {
  // Store refs to avoid recreating handlers on every state change
  const stateRef = useRef({
    mode: 'select' as any,
    camera: { x: 0, y: 0, zoom: 1 } as any,
    snapToGridEnabled: true,
    ppu: 16,
    tileBrush: null as any,
    layers: [] as any[],
    selectedAssetId: null as any
  });
  
  const actionsRef = useRef({
    panCamera: null as any,
    zoomCamera: null as any,
    setTile: null as any,
    removeTile: null as any,
    addObject: null as any,
    setSelection: null as any,
    setPanning: null as any,
    updateObject: null as any
  });
  
  // Update refs when state changes
  stateRef.current.mode = useEditorStore(state => state.mode);
  stateRef.current.camera = useEditorStore(state => state.camera);
  stateRef.current.snapToGridEnabled = useEditorStore(state => state.snapToGrid);
  stateRef.current.ppu = useEditorStore(state => state.ppu);
  stateRef.current.tileBrush = useEditorStore(state => state.tileBrush);
  stateRef.current.layers = useEditorStore(state => state.layers);
  stateRef.current.selectedAssetId = useEditorStore(state => state.selectedAssetId);
  
  actionsRef.current.panCamera = useEditorStore(state => state.panCamera);
  actionsRef.current.zoomCamera = useEditorStore(state => state.zoomCamera);
  actionsRef.current.setTile = useEditorStore(state => state.setTile);
  actionsRef.current.removeTile = useEditorStore(state => state.removeTile);
  actionsRef.current.addObject = useEditorStore(state => state.addObject);
  actionsRef.current.setSelection = useEditorStore(state => state.setSelection);
  actionsRef.current.setPanning = useEditorStore(state => state.setPanning);
  actionsRef.current.updateObject = useEditorStore(state => state.updateObject);

  const getWorldPos = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    return screenToWorld(x, y, stateRef.current.camera);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let isDraggingObject = false;
    let draggedObject: { layerId: string; objectId: string; startX: number; startY: number; offsetX: number; offsetY: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      const worldPos = getWorldPos(e);
      
      // Middle mouse or space+left for panning
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        actionsRef.current.setPanning(true);
        e.preventDefault();
        return;
      }
      
      if (e.button !== 0) return;
      
      switch (stateRef.current.mode) {
        case 'select': {
          // Find object at position
          let found = false;
          for (const layer of stateRef.current.layers) {
            if (layer.type === 'object' && layer.visible && !layer.locked) {
              const objLayer = layer as any;
              for (const obj of objLayer.objects) {
                const dx = Math.abs(worldPos.x - obj.x);
                const dy = Math.abs(worldPos.y - obj.y);
                if (dx < stateRef.current.ppu / 2 && dy < stateRef.current.ppu / 2) {
                  actionsRef.current.setSelection({ layerId: layer.id, objectId: obj.id });
                  // Start dragging the object
                  isDraggingObject = true;
                  draggedObject = {
                    layerId: layer.id,
                    objectId: obj.id,
                    startX: obj.x,
                    startY: obj.y,
                    offsetX: worldPos.x - obj.x,
                    offsetY: worldPos.y - obj.y
                  };
                  found = true;
                  break;
                }
              }
              if (found) break;
            }
          }
          if (!found) {
            actionsRef.current.setSelection(null);
          }
          break;
        }
        
        case 'tile': {
          const tileBrush = stateRef.current.tileBrush;
          console.log('Tile mode - brush:', tileBrush);
          if (!tileBrush.tilesetId || tileBrush.indices.length === 0) {
            console.log('No tile brush set');
            return;
          }
          
          const tileLayer = stateRef.current.layers.find(l => l.type === 'tile' && l.visible && !l.locked);
          if (!tileLayer) {
            console.log('No tile layer found');
            return;
          }
          
          const gridX = Math.floor(worldPos.x / stateRef.current.ppu);
          const gridY = Math.floor(worldPos.y / stateRef.current.ppu);
          
          console.log('Placing tiles at grid position:', gridX, gridY);
          
          // Place tiles from brush
          for (let dy = 0; dy < tileBrush.height; dy++) {
            for (let dx = 0; dx < tileBrush.width; dx++) {
              const index = tileBrush.indices[dy * tileBrush.width + dx];
              if (index !== undefined) {
                console.log('Setting tile:', tileLayer.id, gridX + dx, gridY + dy, tileBrush.tilesetId, index);
                actionsRef.current.setTile(tileLayer.id, gridX + dx, gridY + dy, tileBrush.tilesetId, index);
              }
            }
          }
          break;
        }
        
        case 'erase': {
          const tileLayer = stateRef.current.layers.find(l => l.type === 'tile' && l.visible && !l.locked);
          if (!tileLayer) return;
          
          const gridX = Math.floor(worldPos.x / stateRef.current.ppu);
          const gridY = Math.floor(worldPos.y / stateRef.current.ppu);
          actionsRef.current.removeTile(tileLayer.id, gridX, gridY);
          break;
        }
        
        case 'placeSprite': {
          if (!stateRef.current.selectedAssetId) return;
          
          const objLayer = stateRef.current.layers.find(l => l.type === 'object' && l.visible && !l.locked);
          if (!objLayer) return;
          
          const pos = stateRef.current.snapToGridEnabled 
            ? { x: snapToGrid(worldPos.x, stateRef.current.ppu), y: snapToGrid(worldPos.y, stateRef.current.ppu) }
            : worldPos;
          
          actionsRef.current.addObject(objLayer.id, {
            id: generateId(),
            assetId: stateRef.current.selectedAssetId,
            x: pos.x,
            y: pos.y,
            scale: 1,
            rot: 0,
            frame: 0,
            t: Date.now()
          });
          break;
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const dx = (e.clientX - panStart.x) / stateRef.current.camera.zoom;
        const dy = (e.clientY - panStart.y) / stateRef.current.camera.zoom;
        actionsRef.current.panCamera(-dx, -dy);
        panStart = { x: e.clientX, y: e.clientY };
      } else if (isDraggingObject && draggedObject) {
        // Move the selected object
        const worldPos = getWorldPos(e);
        const newX = worldPos.x - draggedObject.offsetX;
        const newY = worldPos.y - draggedObject.offsetY;
        
        // Apply snap to grid if enabled
        const finalX = stateRef.current.snapToGridEnabled 
          ? snapToGrid(newX, stateRef.current.ppu) 
          : newX;
        const finalY = stateRef.current.snapToGridEnabled 
          ? snapToGrid(newY, stateRef.current.ppu) 
          : newY;
        
        actionsRef.current.updateObject(
          draggedObject.layerId, 
          draggedObject.objectId, 
          { x: finalX, y: finalY }
        );
      }
      
      // Continue tile painting/erasing if mouse is down
      if (e.buttons === 1 && (stateRef.current.mode === 'tile' || stateRef.current.mode === 'erase')) {
        handleMouseDown(e);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        isPanning = false;
        actionsRef.current.setPanning(false);
      }
      if (isDraggingObject) {
        isDraggingObject = false;
        draggedObject = null;
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const pivotX = e.clientX - rect.left - rect.width / 2;
      const pivotY = e.clientY - rect.top - rect.height / 2;
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const camera = stateRef.current.camera;
      actionsRef.current.zoomCamera(delta, pivotX / camera.zoom + camera.x, pivotY / camera.zoom + camera.y);
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
  }, [getWorldPos]); // Only depend on the memoized getWorldPos
}