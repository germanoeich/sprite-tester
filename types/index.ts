export type EditorMode = 'select' | 'place' | 'erase' | 'text' | 'arrow' | 'ground' | 'walls';

// Re-export autotile types for convenience
export type { AutotileCategory, AutotileTopCategory, AutotileSideCategory, TilesetAutotileConfig, AutotileSourceConfig, WallSideConfig } from '@/lib/autotile/types';
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

import type { TilesetAutotileConfig as AutotileConfigType } from '@/lib/autotile/types';

export interface TilesetMetadata {
  tileW: number;
  tileH: number;
  margin: number;
  spacing: number;
  cols?: number;
  // Autotile configuration for this tileset
  autotileConfig?: AutotileConfigType;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
}

import type { AutotileCategory as AutotileCategoryType } from '@/lib/autotile/types';

export interface TileCell {
  tilesetId: string;
  index: number;
  // For autotile cells, this indicates the category (ground/wallTop/groundSide/wallSide)
  // null or undefined means it's a regular manually-placed tile
  autotileCategory?: AutotileCategoryType | null;
  // For side tiles: the Y coordinate of the parent top tile
  sideTopY?: number;
  // For side tiles: depth level (0-3 for groundSide, 0-1 for wallSide)
  sideLevel?: number;
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

export type PlacedObjectType = 'sprite' | 'text' | 'arrow';

export interface BasePlacedObject {
  id: string;
  type: PlacedObjectType;
  x: number;
  y: number;
}

export interface SpritePlacedObject extends BasePlacedObject {
  type: 'sprite';
  assetId: string;
  scale: number;
  rot: number;
  frame: number;
  t: number;
}

export interface TextPlacedObject extends BasePlacedObject {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
}

export interface ArrowPlacedObject extends BasePlacedObject {
  type: 'arrow';
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
}

export type PlacedObject = SpritePlacedObject | TextPlacedObject | ArrowPlacedObject;

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

export interface TextSettings {
  fontSize: number;
  color: string;
}

export interface ArrowSettings {
  color: string;
  strokeWidth: number;
}

export interface DrawingArrow {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export type AutotileConfigTab = 'ground' | 'wallTop' | 'wallSide' | 'groundSide';
export type AutotileAssignmentTool = 'rect' | 'cross' | 'single';

export interface AutotileConfigPanelState {
  isOpen: boolean;
  tilesetId: string | null;
  activeTab: AutotileConfigTab;
  assignmentTool: AutotileAssignmentTool;
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
  
  // Text settings
  textSettings: TextSettings;
  
  // Arrow settings
  arrowSettings: ArrowSettings;
  
  // Drawing state
  drawingArrow: DrawingArrow | null;

  // Autotile config panel state
  autotileConfigPanel: AutotileConfigPanelState;
}