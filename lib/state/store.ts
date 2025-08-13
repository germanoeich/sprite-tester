import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import { assetManager } from '@/lib/utils/assetManager';
import { saveToLocalStorage } from '@/lib/utils/localStorage';
import type { 
  EditorState, 
  Asset, 
  Layer, 
  TileLayer, 
  ObjectLayer, 
  PlacedObject,
  TextPlacedObject,
  ArrowPlacedObject,
  EditorMode,
  AssetTab,
  Selection,
  DragState,
  TextSettings,
  ArrowSettings
} from '@/types';

// Enable MapSet plugin for Immer to handle Maps and Sets
enableMapSet();

interface EditorActions {
  // Editor actions
  setMode: (mode: EditorMode) => void;
  setPPU: (ppu: number) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleGameResolution: () => void;
  setGameResolution: (width: number, height: number) => void;
  
  // Text settings actions
  setTextSettings: (settings: Partial<TextSettings>) => void;
  
  // Arrow settings actions
  setArrowSettings: (settings: Partial<ArrowSettings>) => void;
  setDrawingArrow: (arrow: { startX: number; startY: number; endX: number; endY: number } | null) => void;
  
  // Asset actions
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  setSelectedAssetId: (id: string | null) => void;
  setActiveTilesetId: (id: string | null) => void;
  setActiveAssetTab: (tab: AssetTab) => void;
  
  // Layer actions
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerLocked: (id: string, locked: boolean) => void;
  
  // Camera actions
  panCamera: (dx: number, dy: number) => void;
  zoomCamera: (delta: number, pivotX?: number, pivotY?: number) => void;
  resetCamera: () => void;
  setCameraPosition: (x: number, y: number) => void;
  setCameraZoom: (zoom: number) => void;
  
  // Selection actions
  setSelection: (selection: Selection | null) => void;
  clearSelection: () => void;
  
  // Tile brush actions
  setTileBrush: (brush: Partial<EditorState['tileBrush']>) => void;
  clearTileBrush: () => void;
  
  // UI State actions
  setHoverInfo: (info: string) => void;
  setDragging: (state: DragState | null) => void;
  setPanning: (panning: boolean) => void;
  
  // Palette camera actions
  panPalette: (dx: number, dy: number) => void;
  zoomPalette: (delta: number, pivotX?: number, pivotY?: number) => void;
  resetPalette: () => void;
  setPaletteDragSelect: (select: EditorState['paletteDragSelect']) => void;
  setPalettePanning: (panning: boolean) => void;
  
  // Object actions
  addObject: (layerId: string, object: PlacedObject) => void;
  removeObject: (layerId: string, objectId: string) => void;
  updateObject: (layerId: string, objectId: string, updates: Partial<PlacedObject>) => void;
  
  // Tile actions
  setTile: (layerId: string, x: number, y: number, tilesetId: string, index: number) => void;
  removeTile: (layerId: string, x: number, y: number) => void;
  clearTileLayer: (layerId: string) => void;
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  // Editor Settings
  ppu: 16,
  gridVisible: true,
  snapToGrid: true,
  mode: 'select',
  gameResolution: {
    enabled: false,
    width: 480,
    height: 270
  },
  
  // Assets
  assets: [],
  selectedAssetId: null,
  activeTilesetId: null,
  activeAssetTab: 'sprite',
  
  // Layers - start with default layers
  layers: [
    {
      id: 'bg',
      name: 'Background',
      type: 'tile',
      visible: true,
      locked: false,
      tilesetId: null,
      grid: new Map()
    } as TileLayer,
    {
      id: 'objects',
      name: 'Objects',
      type: 'object',
      visible: true,
      locked: false,
      objects: []
    } as ObjectLayer
  ],
  
  // Camera
  camera: {
    x: 0,
    y: 0,
    zoom: 1
  },
  
  // Selection
  selection: null,
  tileBrush: {
    tilesetId: null,
    indices: [],
    width: 1,
    height: 1,
    originCol: 0,
    originRow: 0
  },
  
  // UI State
  hoverInfo: '',
  isDragging: null,
  isPanning: false,
  
  // Palette state
  paletteCamera: {
    x: 0,
    y: 0,
    zoom: 2
  },
  paletteDragSelect: null,
  palettePanning: false,
  
  // Text settings
  textSettings: {
    fontSize: 16,
    color: '#FFFFFF'
  },
  
  // Arrow settings
  arrowSettings: {
    color: '#FFFFFF',
    strokeWidth: 2
  },
  
  // Drawing state
  drawingArrow: null
};

export const useEditorStore = create<EditorStore>()(subscribeWithSelector(
  devtools(
    immer((set, get) => ({
      ...initialState,
      
      // Editor actions
      setMode: (mode) => set((state) => {
        state.mode = mode;
      }),
      
      setPPU: (ppu) => set((state) => {
        state.ppu = ppu;
      }),
      
      toggleGrid: () => set((state) => {
        state.gridVisible = !state.gridVisible;
      }),
      
      toggleSnapToGrid: () => set((state) => {
        state.snapToGrid = !state.snapToGrid;
      }),
      
      toggleGameResolution: () => set((state) => {
        state.gameResolution.enabled = !state.gameResolution.enabled;
      }),
      
      setGameResolution: (width, height) => set((state) => {
        state.gameResolution.width = width;
        state.gameResolution.height = height;
      }),
      
      // Text settings actions
      setTextSettings: (settings) => set((state) => {
        Object.assign(state.textSettings, settings);
      }),
      
      // Arrow settings actions
      setArrowSettings: (settings) => set((state) => {
        Object.assign(state.arrowSettings, settings);
      }),
      
      setDrawingArrow: (arrow) => set((state) => {
        state.drawingArrow = arrow;
      }),
      
      // Asset actions
      addAsset: (asset) => set((state) => {
        // Don't directly mutate HTMLImageElement with Immer
        state.assets.push({ ...asset, img: null });
      }),
      
      removeAsset: (id) => set((state) => {
        // Remove from assets array
        state.assets = state.assets.filter(a => a.id !== id);
        
        // Clear selections
        if (state.selectedAssetId === id) state.selectedAssetId = null;
        if (state.activeTilesetId === id) state.activeTilesetId = null;
        
        // Remove from assetManager
        assetManager.removeImage(id);
        
        // Remove all sprite objects that use this asset
        state.layers.forEach(layer => {
          if (layer.type === 'object') {
            const objLayer = layer as ObjectLayer;
            objLayer.objects = objLayer.objects.filter(obj => {
              // Only check assetId for sprite objects
              if (obj.type === 'sprite') {
                return obj.assetId !== id;
              }
              // Keep text and arrow objects
              return true;
            });
          }
        });
        
        // Clear tiles that use this tileset
        state.layers.forEach(layer => {
          if (layer.type === 'tile') {
            const tileLayer = layer as TileLayer;
            // Remove tiles that reference this tileset
            const keysToDelete: string[] = [];
            tileLayer.grid.forEach((cell, key) => {
              if (cell.tilesetId === id) {
                keysToDelete.push(key);
              }
            });
            keysToDelete.forEach(key => tileLayer.grid.delete(key));
          }
        });
      }),
      
      updateAsset: (id, updates) => set((state) => {
        const asset = state.assets.find(a => a.id === id);
        if (asset) {
          Object.assign(asset, updates);
        }
      }),
      
      setSelectedAssetId: (id) => set((state) => {
        state.selectedAssetId = id;
      }),
      
      setActiveTilesetId: (id) => set((state) => {
        state.activeTilesetId = id;
        if (id) {
          state.tileBrush.tilesetId = id;
          // Don't update the tile layer's tilesetId - each tile has its own tilesetId
        }
      }),
      
      setActiveAssetTab: (tab) => set((state) => {
        state.activeAssetTab = tab;
      }),
      
      // Layer actions
      addLayer: (layer) => set((state) => {
        // Check if layer with this ID already exists
        if (state.layers.some(l => l.id === layer.id)) {
          console.warn(`Layer with ID ${layer.id} already exists, skipping`);
          return;
        }
        state.layers.push(layer);
      }),
      
      removeLayer: (id) => set((state) => {
        state.layers = state.layers.filter(l => l.id !== id);
      }),
      
      updateLayer: (id, updates) => set((state) => {
        const layer = state.layers.find(l => l.id === id);
        if (layer) {
          Object.assign(layer, updates);
        }
      }),
      
      moveLayer: (id, direction) => set((state) => {
        const index = state.layers.findIndex(l => l.id === id);
        if (index === -1) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= state.layers.length) return;
        
        const layer = state.layers[index];
        state.layers.splice(index, 1);
        state.layers.splice(newIndex, 0, layer);
      }),
      
      setLayerVisibility: (id, visible) => set((state) => {
        const layer = state.layers.find(l => l.id === id);
        if (layer) layer.visible = visible;
      }),
      
      setLayerLocked: (id, locked) => set((state) => {
        const layer = state.layers.find(l => l.id === id);
        if (layer) layer.locked = locked;
      }),
      
      // Camera actions
      panCamera: (dx, dy) => set((state) => {
        state.camera.x += dx;
        state.camera.y += dy;
      }),
      
      zoomCamera: (delta, pivotX = 0, pivotY = 0) => set((state) => {
        const oldZoom = state.camera.zoom;
        const newZoom = Math.min(10, Math.max(0.1, oldZoom * (1 + delta)));
        
        // Adjust camera position to zoom around pivot
        const zoomRatio = newZoom / oldZoom;
        state.camera.x = pivotX - (pivotX - state.camera.x) * zoomRatio;
        state.camera.y = pivotY - (pivotY - state.camera.y) * zoomRatio;
        state.camera.zoom = newZoom;
      }),
      
      resetCamera: () => set((state) => {
        state.camera = { x: 0, y: 0, zoom: 1 };
      }),
      
      setCameraPosition: (x, y) => set((state) => {
        state.camera.x = x;
        state.camera.y = y;
      }),
      
      setCameraZoom: (zoom) => set((state) => {
        state.camera.zoom = zoom;
      }),
      
      // Selection actions
      setSelection: (selection) => set((state) => {
        state.selection = selection;
      }),
      
      clearSelection: () => set((state) => {
        state.selection = null;
      }),
      
      // Tile brush actions
      setTileBrush: (brush) => set((state) => {
        Object.assign(state.tileBrush, brush);
      }),
      
      clearTileBrush: () => set((state) => {
        state.tileBrush = {
          tilesetId: null,
          indices: [],
          width: 1,
          height: 1,
          originCol: 0,
          originRow: 0
        };
      }),
      
      // UI State actions
      setHoverInfo: (info) => set((state) => {
        state.hoverInfo = info;
      }),
      
      setDragging: (dragState) => set((state) => {
        state.isDragging = dragState;
      }),
      
      setPanning: (panning) => set((state) => {
        state.isPanning = panning;
      }),
      
      // Palette camera actions
      panPalette: (dx, dy) => set((state) => {
        state.paletteCamera.x += dx;
        state.paletteCamera.y += dy;
      }),
      
      zoomPalette: (delta, pivotX = 0, pivotY = 0) => set((state) => {
        const oldZoom = state.paletteCamera.zoom;
        const newZoom = Math.min(16, Math.max(0.5, oldZoom * (1 + delta)));
        
        const zoomRatio = newZoom / oldZoom;
        state.paletteCamera.x = pivotX - (pivotX - state.paletteCamera.x) * zoomRatio;
        state.paletteCamera.y = pivotY - (pivotY - state.paletteCamera.y) * zoomRatio;
        state.paletteCamera.zoom = newZoom;
      }),
      
      resetPalette: () => set((state) => {
        state.paletteCamera = { x: 0, y: 0, zoom: 2 };
      }),
      
      setPaletteDragSelect: (select) => set((state) => {
        state.paletteDragSelect = select;
      }),
      
      setPalettePanning: (panning) => set((state) => {
        state.palettePanning = panning;
      }),
      
      // Object actions
      addObject: (layerId, object) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as ObjectLayer;
        if (layer && layer.type === 'object') {
          layer.objects.push(object);
        }
      }),
      
      removeObject: (layerId, objectId) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as ObjectLayer;
        if (layer && layer.type === 'object') {
          layer.objects = layer.objects.filter(o => o.id !== objectId);
        }
      }),
      
      updateObject: (layerId, objectId, updates) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as ObjectLayer;
        if (layer && layer.type === 'object') {
          const object = layer.objects.find(o => o.id === objectId);
          if (object) {
            Object.assign(object, updates);
          }
        }
      }),
      
      // Tile actions
      setTile: (layerId, x, y, tilesetId, index) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as TileLayer;
        if (layer && layer.type === 'tile') {
          const key = `${x},${y}`;
          layer.grid.set(key, { tilesetId, index });
        }
      }),
      
      removeTile: (layerId, x, y) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as TileLayer;
        if (layer && layer.type === 'tile') {
          const key = `${x},${y}`;
          layer.grid.delete(key);
        }
      }),
      
      clearTileLayer: (layerId) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as TileLayer;
        if (layer && layer.type === 'tile') {
          layer.grid.clear();
        }
      })
    }))
  ))
);

// Auto-save to localStorage on state changes (debounced)
let saveTimeout: NodeJS.Timeout | null = null;

useEditorStore.subscribe(
  (state) => ({
    ppu: state.ppu,
    gridVisible: state.gridVisible,
    snapToGrid: state.snapToGrid,
    gameResolution: state.gameResolution,
    assets: state.assets,
    layers: state.layers,
    camera: state.camera,
    textSettings: state.textSettings,
    arrowSettings: state.arrowSettings
  }),
  (current) => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Save after 1 second of inactivity
    saveTimeout = setTimeout(() => {
      saveToLocalStorage(current);
      console.log('Auto-saved to localStorage');
    }, 1000);
  },
  {
    equalityFn: (a, b) => false // Always trigger save on any change
  }
);