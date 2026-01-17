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
  ArrowSettings,
  AutotileConfigTab,
  AutotileAssignmentTool,
  TilesetMetadata,
  TileCell,
  AutotileCategory,
  AutotileSourceConfig
} from '@/types';
import { getNeighborPresence, blobMaskFromNeighbors } from '@/lib/autotile/generator';
import { createDefaultAutotileConfig, createDefaultWallSideConfig, createDefaultGroundSideConfig, validateWallSideTiles, validateGroundSideTiles } from '@/lib/autotile/defaults';
import { invalidateAtlas } from '@/lib/autotile/atlasCache';

// Helper to get ImageData from HTMLImageElement
function getImageDataFromImage(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function areBooleanGridEqual(a?: boolean[][], b?: boolean[][]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let row = 0; row < a.length; row++) {
    const rowA = a[row];
    const rowB = b[row];
    if (!rowA || !rowB || rowA.length !== rowB.length) return false;
    for (let col = 0; col < rowA.length; col++) {
      if (rowA[col] !== rowB[col]) return false;
    }
  }
  return true;
}
import {
  getSideDepth,
  getSideCategoryForTop,
  getSideColumnIndex,
  getSideTileIndex,
  canPlaceSideTile,
  isTopTileAt,
  GROUND_SIDE_DEPTH,
  WALL_SIDE_DEPTH
} from '@/lib/autotile/sides';

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

  // Autotile config panel actions
  openAutotileConfigPanel: (tilesetId: string) => void;
  closeAutotileConfigPanel: () => void;
  setAutotileConfigTab: (tab: AutotileConfigTab) => void;
  setAutotileAssignmentTool: (tool: AutotileAssignmentTool) => void;

  // Autotile configuration actions
  updateAutotileSourceConfig: (
    tilesetId: string,
    category: 'ground' | 'wallTop',
    updates: Partial<AutotileSourceConfig>
  ) => void;
  updateAutotileSideConfig: (
    tilesetId: string,
    side: 'wallSide' | 'groundSide',
    rectOrigin: { x: number; y: number }
  ) => void;
  initializeAutotileConfig: (tilesetId: string) => void;

  // Autotile placement actions
  setAutotile: (layerId: string, x: number, y: number, tilesetId: string, category: AutotileCategory) => void;
  eraseAutotile: (layerId: string, x: number, y: number) => void;
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
  drawingArrow: null,

  // Autotile config panel state
  autotileConfigPanel: {
    isOpen: false,
    tilesetId: null,
    activeTab: 'ground',
    assignmentTool: 'rect'
  }
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
      }),

      // Autotile config panel actions
      openAutotileConfigPanel: (tilesetId) => set((state) => {
        state.autotileConfigPanel.isOpen = true;
        state.autotileConfigPanel.tilesetId = tilesetId;
        // Also set as active tileset so ground/walls tools use it
        state.activeTilesetId = tilesetId;
      }),

      closeAutotileConfigPanel: () => set((state) => {
        state.autotileConfigPanel.isOpen = false;
        state.autotileConfigPanel.tilesetId = null;
      }),

      setAutotileConfigTab: (tab) => set((state) => {
        state.autotileConfigPanel.activeTab = tab;
      }),

      setAutotileAssignmentTool: (tool) => set((state) => {
        state.autotileConfigPanel.assignmentTool = tool;
      }),

      // Autotile configuration actions
      updateAutotileSourceConfig: (tilesetId, category, updates) => set((state) => {
        const asset = state.assets.find(a => a.id === tilesetId);
        if (!asset || asset.type !== 'tileset') return;

        const meta = asset.meta as TilesetMetadata;
        if (!meta.autotileConfig) {
          meta.autotileConfig = createDefaultAutotileConfig();
        }

        Object.assign(meta.autotileConfig[category], updates);
        // Invalidate cached atlas since config changed
        invalidateAtlas(tilesetId, category);
      }),

      updateAutotileSideConfig: (tilesetId, side, rectOrigin) => set((state) => {
        const asset = state.assets.find(a => a.id === tilesetId);
        if (!asset || asset.type !== 'tileset') return;

        const meta = asset.meta as TilesetMetadata;
        if (!meta.autotileConfig) {
          meta.autotileConfig = createDefaultAutotileConfig();
        }

        // Ensure the specific side config exists (for older saved configs)
        if (!meta.autotileConfig[side]) {
          if (side === 'wallSide') {
            meta.autotileConfig.wallSide = createDefaultWallSideConfig();
          } else {
            meta.autotileConfig.groundSide = createDefaultGroundSideConfig();
          }
        }

        meta.autotileConfig[side].rectOrigin = rectOrigin;

        // Re-validate tiles at new origin to check which have pixel data
        const img = assetManager.getImage(tilesetId);
        if (img) {
          const tileSize = { x: meta.tileW, y: meta.tileH };
          const imageData = getImageDataFromImage(img);

          if (side === 'wallSide') {
            meta.autotileConfig.wallSide.validTiles = validateWallSideTiles(
              imageData,
              meta.autotileConfig.wallSide,
              tileSize,
              meta.margin,
              meta.spacing
            );
          } else {
            meta.autotileConfig.groundSide.validTiles = validateGroundSideTiles(
              imageData,
              meta.autotileConfig.groundSide,
              tileSize,
              meta.margin,
              meta.spacing
            );
          }
        }
      }),

      initializeAutotileConfig: (tilesetId) => set((state) => {
        const asset = state.assets.find(a => a.id === tilesetId);
        if (!asset || asset.type !== 'tileset') return;

        const meta = asset.meta as TilesetMetadata;
        let didChange = false;

        if (!meta.autotileConfig) {
          meta.autotileConfig = createDefaultAutotileConfig();
          didChange = true;
        } else {
          // Ensure all configs have required fields (for older saved configs)
          if (!meta.autotileConfig.wallSide) {
            meta.autotileConfig.wallSide = createDefaultWallSideConfig();
            didChange = true;
          }
          if (!meta.autotileConfig.groundSide) {
            meta.autotileConfig.groundSide = createDefaultGroundSideConfig();
            didChange = true;
          }
          // Ensure rectSize exists for ground and wallTop (added later)
          if (meta.autotileConfig.ground && !meta.autotileConfig.ground.rectSize) {
            meta.autotileConfig.ground.rectSize = { x: 5, y: 4 };
            // Invalidate cached atlas since it was generated with wrong size
            invalidateAtlas(tilesetId, 'ground');
            didChange = true;
          }
          if (meta.autotileConfig.wallTop && !meta.autotileConfig.wallTop.rectSize) {
            meta.autotileConfig.wallTop.rectSize = { x: 5, y: 3 }; // wallTop is 5x3, NOT 5x4
            // Invalidate cached atlas since it was generated with wrong size
            invalidateAtlas(tilesetId, 'wallTop');
            didChange = true;
          }
        }

        // Validate side tiles to check which have actual pixel data
        const img = assetManager.getImage(tilesetId);
        if (img && meta.autotileConfig) {
          const tileSize = { x: meta.tileW, y: meta.tileH };
          const imageData = getImageDataFromImage(img);

          // Validate wall side tiles (5x2 grid)
          if (meta.autotileConfig.wallSide) {
            const nextValidTiles = validateWallSideTiles(
              imageData,
              meta.autotileConfig.wallSide,
              tileSize,
              meta.margin,
              meta.spacing
            );
            if (!areBooleanGridEqual(meta.autotileConfig.wallSide.validTiles, nextValidTiles)) {
              meta.autotileConfig.wallSide.validTiles = nextValidTiles;
              didChange = true;
            }
          }

          // Validate ground side tiles (5x4 grid)
          if (meta.autotileConfig.groundSide) {
            const nextValidTiles = validateGroundSideTiles(
              imageData,
              meta.autotileConfig.groundSide,
              tileSize,
              meta.margin,
              meta.spacing
            );
            if (!areBooleanGridEqual(meta.autotileConfig.groundSide.validTiles, nextValidTiles)) {
              meta.autotileConfig.groundSide.validTiles = nextValidTiles;
              didChange = true;
            }
          }
        }

        if (!didChange) return;
      }),

      // Autotile placement actions
      setAutotile: (layerId, x, y, tilesetId, category) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as TileLayer;
        if (!layer || layer.type !== 'tile') return;

        // Only handle top categories (ground/wallTop) - sides are placed automatically
        if (category !== 'ground' && category !== 'wallTop') return;

        const tileset = state.assets.find(a => a.id === tilesetId);
        if (!tileset || tileset.type !== 'tileset') return;

        const meta = tileset.meta as TilesetMetadata;
        const img = assetManager.getImage(tilesetId);
        if (!img || !meta.autotileConfig) return;

        const tilesetCols = Math.floor((img.width - 2 * meta.margin + meta.spacing) / (meta.tileW + meta.spacing));
        const sideConfig = category === 'ground' ? meta.autotileConfig.groundSide : meta.autotileConfig.wallSide;
        const sideCategory = getSideCategoryForTop(category);
        const sideDepth = getSideDepth(category);

        const key = `${x},${y}`;

        // Set the autotile at this position
        layer.grid.set(key, {
          tilesetId,
          index: 0, // Will be recalculated
          autotileCategory: category
        });

        // Recalculate blob mask for this tile and all neighbors
        const positions = [
          { x, y },
          { x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 },
          { x: x - 1, y },                          { x: x + 1, y },
          { x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }
        ];

        for (const pos of positions) {
          const posKey = `${pos.x},${pos.y}`;
          const cell = layer.grid.get(posKey);

          if (cell && cell.autotileCategory === category) {
            const neighbors = getNeighborPresence(layer.grid, pos.x, pos.y, category);
            const mask = blobMaskFromNeighbors(neighbors);
            cell.index = mask;
          }
        }

        // Place side tiles below the top tile
        if (sideConfig?.enabled) {
          const hasLeftNeighbor = isTopTileAt(layer.grid, x - 1, y, category);
          const hasRightNeighbor = isTopTileAt(layer.grid, x + 1, y, category);
          const validTiles = sideConfig.validTiles;

          for (let level = 0; level < sideDepth; level++) {
            const sideY = y + level + 1;
            const sideKey = `${x},${sideY}`;
            const existingCell = layer.grid.get(sideKey);
            const canPlace = canPlaceSideTile(existingCell, sideCategory, y);
            if (!canPlace) continue;

            const column = getSideColumnIndex(hasLeftNeighbor, hasRightNeighbor, validTiles, level);

            if (column >= 0) {
              const sideIndex = getSideTileIndex(column, level, sideConfig, tilesetCols);
              layer.grid.set(sideKey, {
                tilesetId,
                index: sideIndex,
                autotileCategory: sideCategory,
                sideTopY: y,
                sideLevel: level
              });
            } else if (
              existingCell?.autotileCategory === sideCategory &&
              (existingCell.sideTopY === undefined || existingCell.sideTopY <= y)
            ) {
              layer.grid.delete(sideKey);
            }
          }

          // Update neighboring columns' side tiles X patterns
          for (const nx of [x - 1, x + 1]) {
            if (isTopTileAt(layer.grid, nx, y, category)) {
              const neighborHasLeft = isTopTileAt(layer.grid, nx - 1, y, category);
              const neighborHasRight = isTopTileAt(layer.grid, nx + 1, y, category);

              for (let level = 0; level < sideDepth; level++) {
                const sideY = y + level + 1;
                const sideKey = `${nx},${sideY}`;
                const sideCell = layer.grid.get(sideKey);
                const neighborColumn = getSideColumnIndex(neighborHasLeft, neighborHasRight, validTiles, level);
                if (neighborColumn >= 0) {
                  if (canPlaceSideTile(sideCell, sideCategory, y)) {
                    layer.grid.set(sideKey, {
                      tilesetId,
                      index: getSideTileIndex(neighborColumn, level, sideConfig, tilesetCols),
                      autotileCategory: sideCategory,
                      sideTopY: y,
                      sideLevel: level
                    });
                  } else if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === y) {
                    sideCell.index = getSideTileIndex(neighborColumn, level, sideConfig, tilesetCols);
                  }
                } else if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === y) {
                  layer.grid.delete(sideKey);
                }
              }
            }
          }
        }
      }),

      eraseAutotile: (layerId, x, y) => set((state) => {
        const layer = state.layers.find(l => l.id === layerId) as TileLayer;
        if (!layer || layer.type !== 'tile') return;

        const key = `${x},${y}`;
        const cell = layer.grid.get(key);

        if (!cell || !cell.autotileCategory) return;

        const category = cell.autotileCategory;
        const tilesetId = cell.tilesetId;

        // Handle erasing top tiles (ground/wallTop) - also remove side tiles
        if (category === 'ground' || category === 'wallTop') {
          const tileset = state.assets.find(a => a.id === tilesetId);
          const meta = tileset?.meta as TilesetMetadata | undefined;
          const img = assetManager.getImage(tilesetId);

          const sideCategory = getSideCategoryForTop(category);
          const sideDepth = getSideDepth(category);
          const sideConfig = category === 'ground' ? meta?.autotileConfig?.groundSide : meta?.autotileConfig?.wallSide;
          const tilesetCols = img && meta ? Math.floor((img.width - 2 * meta.margin + meta.spacing) / (meta.tileW + meta.spacing)) : 0;

          // Remove the top tile
          layer.grid.delete(key);

          // Recalculate blob mask for all neighbors
          const positions = [
            { x: x - 1, y: y - 1 }, { x, y: y - 1 }, { x: x + 1, y: y - 1 },
            { x: x - 1, y },                          { x: x + 1, y },
            { x: x - 1, y: y + 1 }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }
          ];

          for (const pos of positions) {
            const posKey = `${pos.x},${pos.y}`;
            const neighborCell = layer.grid.get(posKey);

            if (neighborCell && neighborCell.autotileCategory === category) {
              const neighbors = getNeighborPresence(layer.grid, pos.x, pos.y, category);
              const mask = blobMaskFromNeighbors(neighbors);
              neighborCell.index = mask;
            }
          }

          // Remove side tiles that belonged to this top tile
          for (let level = 0; level < sideDepth; level++) {
            const sideY = y + level + 1;
            const sideKey = `${x},${sideY}`;
            const sideCell = layer.grid.get(sideKey);

            // Only remove if it's a side tile belonging to this top tile
            if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === y) {
              layer.grid.delete(sideKey);
            }
          }

          if (sideConfig?.enabled && tilesetCols > 0) {
            const validTiles = sideConfig.validTiles;
            const minTopY = y - (sideDepth - 1);

            for (let topY = minTopY; topY < y; topY++) {
              if (!isTopTileAt(layer.grid, x, topY, category)) continue;

              const hasLeftNeighbor = isTopTileAt(layer.grid, x - 1, topY, category);
              const hasRightNeighbor = isTopTileAt(layer.grid, x + 1, topY, category);

              for (let level = 0; level < sideDepth; level++) {
                const sideY = topY + level + 1;
                if (sideY < y + 1 || sideY > y + sideDepth) continue;

                const sideKey = `${x},${sideY}`;
                const sideCell = layer.grid.get(sideKey);
                const column = getSideColumnIndex(hasLeftNeighbor, hasRightNeighbor, validTiles, level);

                if (column >= 0) {
                  if (canPlaceSideTile(sideCell, sideCategory, topY)) {
                    layer.grid.set(sideKey, {
                      tilesetId,
                      index: getSideTileIndex(column, level, sideConfig, tilesetCols),
                      autotileCategory: sideCategory,
                      sideTopY: topY,
                      sideLevel: level
                    });
                  } else if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === topY) {
                    sideCell.index = getSideTileIndex(column, level, sideConfig, tilesetCols);
                  }
                } else if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === topY) {
                  layer.grid.delete(sideKey);
                }
              }
            }
          }

          // Update neighboring columns' side tiles X patterns
          if (sideConfig?.enabled && tilesetCols > 0) {
            const validTiles = sideConfig.validTiles;
            for (const nx of [x - 1, x + 1]) {
              if (isTopTileAt(layer.grid, nx, y, category)) {
                const neighborHasLeft = isTopTileAt(layer.grid, nx - 1, y, category);
                const neighborHasRight = isTopTileAt(layer.grid, nx + 1, y, category);

                for (let level = 0; level < sideDepth; level++) {
                  const sideY = y + level + 1;
                  const sideKey = `${nx},${sideY}`;
                  const sideCell = layer.grid.get(sideKey);

                  const neighborColumn = getSideColumnIndex(neighborHasLeft, neighborHasRight, validTiles, level);
                  if (neighborColumn >= 0) {
                    if (canPlaceSideTile(sideCell, sideCategory, y)) {
                      layer.grid.set(sideKey, {
                        tilesetId,
                        index: getSideTileIndex(neighborColumn, level, sideConfig, tilesetCols),
                        autotileCategory: sideCategory,
                        sideTopY: y,
                        sideLevel: level
                      });
                    } else if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === y) {
                      sideCell.index = getSideTileIndex(neighborColumn, level, sideConfig, tilesetCols);
                    }
                  } else if (sideCell?.autotileCategory === sideCategory && sideCell?.sideTopY === y) {
                    layer.grid.delete(sideKey);
                  }
                }
              }
            }
          }
        } else if (category === 'groundSide' || category === 'wallSide') {
          // Erasing a side tile directly - just remove it
          layer.grid.delete(key);
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
