export type EditorMode = 'select' | 'place' | 'erase';
export type AssetType = 'sprite' | 'tileset';
export type AssetTab = 'sprite' | 'tileset';
export type LayerType = 'tile' | 'object';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface GameResolution {
  enabled: boolean;
  width: number;
  height: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  dataURL: string;
  img: HTMLImageElement | null;
  meta: AssetMetadata;
}

export type AssetMetadata = SpriteMetadata | TilesetMetadata;

export interface SpriteMetadata {
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  frameDur: number;
  loop: boolean;
}

export interface TilesetMetadata {
  tileW: number;
  tileH: number;
  margin: number;
  spacing: number;
  cols?: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
}

export interface TileCell {
  tilesetId: string;
  index: number;
}

export interface TileLayer extends Layer {
  type: 'tile';
  tilesetId: string | null;
  grid: Map<string, TileCell>;
}

export interface ObjectLayer extends Layer {
  type: 'object';
  objects: PlacedObject[];
}

export interface PlacedObject {
  id: string;
  assetId: string;
  x: number;
  y: number;
  scale: number;
  rot: number;
  frame: number;
  t: number;
}

export interface TileBrush {
  tilesetId: string | null;
  indices: number[];
  width: number;
  height: number;
  originCol: number;
  originRow: number;
}

export interface Selection {
  layerId: string;
  objectId: string;
}

export interface DragState {
  type: 'object' | 'camera' | 'palette';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  data?: any;
}

export interface PaletteCamera {
  x: number;
  y: number;
  zoom: number;
}

export interface PaletteDragSelect {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

export interface EditorState {
  // Editor Settings
  ppu: number;
  gridVisible: boolean;
  snapToGrid: boolean;
  mode: EditorMode;
  gameResolution: GameResolution;
  
  // Assets
  assets: Asset[];
  selectedAssetId: string | null;
  activeTilesetId: string | null;
  activeAssetTab: AssetTab;
  
  // Layers
  layers: Layer[];
  
  // Camera
  camera: Camera;
  
  // Selection
  selection: Selection | null;
  tileBrush: TileBrush;
  
  // UI State
  hoverInfo: string;
  isDragging: DragState | null;
  isPanning: boolean;
  
  // Palette specific state
  paletteCamera: PaletteCamera;
  paletteDragSelect: PaletteDragSelect | null;
  palettePanning: boolean;
}