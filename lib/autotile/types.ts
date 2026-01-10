// Blob Autotiling System Types
// Based on Unity VoxelDefinition autotiling system

export type Int2 = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

// BlobTileType - The 47 valid 8-neighbor patterns (reduced from 256 via diagonal gating)
// Values are the 8-bit neighbor masks
export enum BlobTileType {
  SingleTile = 0,
  BothCornersBottom = 1,
  BothCornersLeft = 4,
  BothCornersTop = 16,
  BothCornersRight = 64,
  BottomLeftCornerTopRightInnerCorner = 5,
  TopLeftCornerBottomRightInnerCorner = 20,
  TopRightCornerBottomLeftInnerCorner = 80,
  BottomRightCornerTopLeftInnerCorner = 65,
  CornerBottomLeft = 7,
  CornerTopLeft = 28,
  CornerTopRight = 112,
  CornerBottomRight = 193,
  BridgeVertical = 17,
  BridgeHorizontal = 68,
  InnerCornersRightBorderLeft = 21,
  InnerCornersBottomBorderTop = 84,
  InnerCornersLeftBorderRight = 81,
  InnerCornersTopBorderBottom = 69,
  LeftBorderBottomRightInnerCorner = 23,
  TopBorderBottomLeftInnerCorner = 92,
  RightBorderTopLeftInnerCorner = 113,
  BottomBorderTopRightInnerCorner = 197,
  LeftBorderTopRightInnerCorner = 29,
  TopBorderBottomRightInnerCorner = 116,
  RightBorderBottomLeftInnerCorner = 209,
  BottomBorderTopLeftInnerCorner = 71,
  BorderLeft = 31,
  BorderTop = 124,
  BorderRight = 241,
  BorderBottom = 199,
  AllInnerCorners = 85,
  ThreeInnerCornersNotTopRight = 87,
  ThreeInnerCornersNotBottomRight = 93,
  ThreeInnerCornersNotBottomLeft = 117,
  ThreeInnerCornersNotTopLeft = 213,
  BothInnerCornersLeft = 95,
  BothInnerCornersTop = 125,
  BothInnerCornersRight = 245,
  BothInnerCornersBottom = 215,
  InnerCornerTopLeftBottomRight = 119,
  InnerCornerTopRightBottomLeft = 221,
  TopLeftInnerCorner = 127,
  TopRightInnerCorner = 253,
  BottomRightInnerCorner = 247,
  BottomLeftInnerCorner = 223,
  Full = 255,
  // Used for lookup array sizing
  MaxValue = 256,
}

// TopTileType - The 17 source tiles from the atlas
export enum TopTileType {
  Full = 0,
  Left = 1,
  Right = 2,
  Top = 3,
  Bottom = 4,
  TopLeftCorner = 5,
  TopRightCorner = 6,
  BottomLeftCorner = 7,
  BottomRightCorner = 8,
  InnerCorners = 9,
  SingleTile = 10,
  VerticalBridge = 11,
  VerticalBridgeTop = 12,
  VerticalBridgeBottom = 13,
  HorizontalBridge = 14,
  HorizontalBridgeLeft = 15,
  HorizontalBridgeRight = 16,
}

// YLevel - Side texture selection (not auto-tiled, just variants per layer)
export enum YLevel {
  TopWallLayer = 2,
  BottomWallLayer = 1,
  GroundLayer = 0,
  UndergroundLayer1 = -1,
  UndergroundLayer2 = -2,
  UndergroundLayer3 = -3,
}

// TileFeatures - Quadrant-level building blocks
export enum TileFeatures {
  Full = 0,
  SingleTile = 1,
  CornerQ2 = 2,
  CornerQ1 = 3,
  CornerQ4 = 4,
  CornerQ3 = 5,
  BorderLeftQ1 = 6,
  BorderLeftQ3 = 7,
  BorderRightQ2 = 8,
  BorderRightQ4 = 9,
  BorderTopQ1 = 10,
  BorderTopQ2 = 11,
  BorderBottomQ3 = 12,
  BorderBottomQ4 = 13,
  InnerCornerQ2 = 14,
  InnerCornerQ1 = 15,
  InnerCornerQ4 = 16,
  InnerCornerQ3 = 17,
}

// TileQuadrant - Which quarter of the tile
export enum TileQuadrant {
  /** top-left */ Q1 = 0,
  /** top-right */ Q2 = 1,
  /** bottom-left */ Q3 = 2,
  /** bottom-right */ Q4 = 3,
  All = 4,
}

// Type name aliases for configuration
export type TopTileTypeName =
  | "Full" | "Left" | "Right" | "Top" | "Bottom"
  | "TopLeftCorner" | "TopRightCorner" | "BottomLeftCorner" | "BottomRightCorner"
  | "InnerCorners" | "SingleTile"
  | "VerticalBridge" | "VerticalBridgeTop" | "VerticalBridgeBottom"
  | "HorizontalBridge" | "HorizontalBridgeLeft" | "HorizontalBridgeRight";

export type YLevelName =
  | "BottomWallLayer" | "TopWallLayer" | "GroundLayer"
  | "UndergroundLayer1" | "UndergroundLayer2" | "UndergroundLayer3";

// Tileset configuration - maps tile positions on the source atlas
export interface TilesetConfig {
  tileSize: Int2; // usually {x:16, y:16}

  /** Tile positions are "tile grid coords", origin = top-left of the atlas. */
  topTextures: Partial<Record<TopTileTypeName, readonly Int2[]>>;

  /** Side textures are not auto-tiled; they're just variants per YLevel. */
  sideTextures: Partial<Record<YLevelName, readonly Int2[]>>;
}

// UV rectangle for texture sampling (normalized UVs; bottom-left origin)
export interface UVRect {
  min: { x: number; y: number };
  max: { x: number; y: number };
  uv00: { x: number; y: number };
  uv10: { x: number; y: number };
  uv01: { x: number; y: number };
  uv11: { x: number; y: number };
}

// Neighbor presence for runtime blob mask calculation
export interface NeighborPresence {
  top: boolean;
  topRight: boolean;
  right: boolean;
  bottomRight: boolean;
  bottom: boolean;
  bottomLeft: boolean;
  left: boolean;
  topLeft: boolean;
}

// Generated tileset output
export interface GeneratedTileset {
  tileSize: Int2;
  columns: number;
  atlas: ImageData;

  topTiles: Map<BlobTileType, ImageData[]>;
  sideTiles: Map<YLevel, ImageData[]>;

  // Maps BlobTileType to atlas indices (multiple for variants)
  topIndices: Map<BlobTileType, number[]>;
  sideIndices: Map<YLevel, number[]>;

  topTexturePositions: Map<BlobTileType, UVRect[]>;
  sideTexturePositions: Map<YLevel, UVRect[]>;
}

// Autotile category for editor
// Top tiles are blob-autotiled, side tiles use simpler edge patterns
export type AutotileCategory = 'ground' | 'wallTop' | 'groundSide' | 'wallSide';

// Categories that are "top" tiles (blob autotiled)
export type AutotileTopCategory = 'ground' | 'wallTop';

// Categories that are "side" tiles (edge pattern based)
export type AutotileSideCategory = 'groundSide' | 'wallSide';

// Configuration for a single autotile source (ground or wallTop)
export interface AutotileSourceConfig {
  enabled: boolean;
  // Rect pattern top-left corner
  rectOrigin: Int2;
  // Rect pattern dimensions (cols x rows) - minimum 3x2
  // Tile layout: corners at 4 corners, top/bottom edges fill first/last row middle,
  // left/right edges are single column, full tiles fill the center
  rectSize: Int2;
  // Cross pattern position (4x4 grid for bridge/inner tiles)
  crossOrigin: Int2;
  // Single tile position (optional - can be unset)
  singleTile?: Int2;
}

// Wall side configuration (special handling for potentially empty tiles)
export interface WallSideConfig {
  enabled: boolean;
  // Rect origin (5x2 grid)
  rectOrigin: Int2;
  // Which tiles in the 5x2 grid have data (for validation)
  validTiles: boolean[][];
}

// Ground side configuration (underground tiles with Y levels)
export interface GroundSideConfig {
  enabled: boolean;
  // Rect origin (5x4 grid - one row per Y level 0-3)
  // Row 0: Y level 0 (closest to ground surface)
  // Row 1: Y level 1
  // Row 2: Y level 2
  // Row 3: Y level 3 (deepest underground)
  rectOrigin: Int2;
  // Which tiles in the 5x4 grid have data (for validation)
  validTiles: boolean[][];
}

// Full autotile configuration for a tileset
export interface TilesetAutotileConfig {
  ground: AutotileSourceConfig;
  wallTop: AutotileSourceConfig;
  wallSide: WallSideConfig;
  groundSide: GroundSideConfig;
}
