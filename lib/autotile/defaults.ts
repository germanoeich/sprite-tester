// Default autotile configuration positions
// Based on standard tileset layout

import { Int2, TopTileType, TilesetAutotileConfig, AutotileSourceConfig, WallSideConfig, GroundSideConfig, TilesetConfig } from './types';

// Rect pattern (5 cols x 4 rows) tile positions:
// Row 0: TopLeftCorner(0,0), Top(1-3,0), TopRightCorner(4,0)
// Row 1: Left(0,1), Full(1-3,1), Right(4,1)
// Row 2: Left(0,2), Full(1-3,2), Right(4,2)
// Row 3: BottomLeftCorner(0,3), Bottom(1-3,3), BottomRightCorner(4,3)

// Cross pattern (4 cols x 4 rows) relative positions:
// Row 0: empty(0,0), VerticalBridgeTop(1,0), empty(2,0), empty(3,0)
// Row 1: HorizontalBridgeLeft(0,1), InnerCorners(1,1), HorizontalBridge(2,1), HorizontalBridgeRight(3,1)
// Row 2: empty(0,2), VerticalBridge(1,2), empty(2,2), empty(3,2)
// Row 3: empty(0,3), VerticalBridgeBottom(1,3), empty(2,3), empty(3,3)

export function createDefaultGroundConfig(): AutotileSourceConfig {
  return {
    enabled: true,
    rectOrigin: { x: 0, y: 5 },
    rectSize: { x: 5, y: 4 }, // 5 cols x 4 rows
    crossOrigin: { x: 6, y: 5 },
    singleTile: { x: 11, y: 4 },
  };
}

export function createDefaultWallTopConfig(): AutotileSourceConfig {
  return {
    enabled: true,
    rectOrigin: { x: 0, y: 0 },
    rectSize: { x: 5, y: 3 }, // 5 cols x 3 rows
    crossOrigin: { x: 6, y: 0 },
    singleTile: { x: 11, y: 2 },
  };
}

export function createDefaultWallSideConfig(): WallSideConfig {
  return {
    enabled: true,
    // Wall sides at (0, 3) - 5 cols x 2 rows
    rectOrigin: { x: 0, y: 3 },
    // Default all tiles as valid, will be validated on load
    validTiles: [
      [true, true, true, true, true],
      [true, true, true, true, true],
    ],
  };
}

export function createDefaultGroundSideConfig(): GroundSideConfig {
  return {
    enabled: true,
    // Ground sides (underground tiles) at (14, 0) - 5 cols x 4 rows
    // Each row is a Y level (0-3):
    // Row 0: Y level 0 (closest to ground surface)
    // Row 1: Y level 1
    // Row 2: Y level 2
    // Row 3: Y level 3 (deepest underground)
    rectOrigin: { x: 14, y: 0 },
    // Default all tiles as valid, will be validated on load
    validTiles: [
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
      [true, true, true, true, true],
    ],
  };
}

export function createDefaultAutotileConfig(): TilesetAutotileConfig {
  return {
    ground: createDefaultGroundConfig(),
    wallTop: createDefaultWallTopConfig(),
    wallSide: createDefaultWallSideConfig(),
    groundSide: createDefaultGroundSideConfig(),
  };
}

// Convert AutotileSourceConfig to TilesetConfig for the generator
// Uses dynamic rect dimensions from config
// Layout:
// - Row 0: TopLeftCorner, Top tiles (cols-2), TopRightCorner
// - Rows 1 to rows-2: Left (1 per row), Full tiles (cols-2 per row), Right (1 per row)
// - Last row: BottomLeftCorner, Bottom tiles (cols-2), BottomRightCorner
export function autotileSourceToTilesetConfig(
  source: AutotileSourceConfig,
  tileSize: Int2
): TilesetConfig {
  const { rectOrigin, rectSize, crossOrigin, singleTile } = source;
  const cols = rectSize?.x ?? 5;
  const rows = rectSize?.y ?? 4;
  const lastRow = rows - 1;
  const lastCol = cols - 1;

  // Build topTextures from the rect pattern
  const topTextures: TilesetConfig['topTextures'] = {};

  // Row 0: corners and top edges
  topTextures.TopLeftCorner = [{ x: rectOrigin.x, y: rectOrigin.y }];
  topTextures.TopRightCorner = [{ x: rectOrigin.x + lastCol, y: rectOrigin.y }];

  // Top edge tiles (middle of first row)
  const topTiles: Int2[] = [];
  for (let col = 1; col < lastCol; col++) {
    topTiles.push({ x: rectOrigin.x + col, y: rectOrigin.y });
  }
  topTextures.Top = topTiles;

  // Middle rows: Left, Full, Right
  const leftTiles: Int2[] = [];
  const rightTiles: Int2[] = [];
  const fullTiles: Int2[] = [];

  for (let row = 1; row < lastRow; row++) {
    leftTiles.push({ x: rectOrigin.x, y: rectOrigin.y + row });
    rightTiles.push({ x: rectOrigin.x + lastCol, y: rectOrigin.y + row });

    for (let col = 1; col < lastCol; col++) {
      fullTiles.push({ x: rectOrigin.x + col, y: rectOrigin.y + row });
    }
  }

  topTextures.Left = leftTiles;
  topTextures.Right = rightTiles;
  topTextures.Full = fullTiles;

  // Last row: corners and bottom edges
  topTextures.BottomLeftCorner = [{ x: rectOrigin.x, y: rectOrigin.y + lastRow }];
  topTextures.BottomRightCorner = [{ x: rectOrigin.x + lastCol, y: rectOrigin.y + lastRow }];

  // Bottom edge tiles (middle of last row)
  const bottomTiles: Int2[] = [];
  for (let col = 1; col < lastCol; col++) {
    bottomTiles.push({ x: rectOrigin.x + col, y: rectOrigin.y + lastRow });
  }
  topTextures.Bottom = bottomTiles;

  // Cross pattern tiles (4x4 grid, sparse)
  topTextures.VerticalBridgeTop = [{ x: crossOrigin.x + 1, y: crossOrigin.y + 0 }];
  topTextures.HorizontalBridgeLeft = [{ x: crossOrigin.x + 0, y: crossOrigin.y + 1 }];
  topTextures.InnerCorners = [{ x: crossOrigin.x + 1, y: crossOrigin.y + 1 }];
  topTextures.HorizontalBridge = [{ x: crossOrigin.x + 2, y: crossOrigin.y + 1 }];
  topTextures.HorizontalBridgeRight = [{ x: crossOrigin.x + 3, y: crossOrigin.y + 1 }];
  topTextures.VerticalBridge = [{ x: crossOrigin.x + 1, y: crossOrigin.y + 2 }];
  topTextures.VerticalBridgeBottom = [{ x: crossOrigin.x + 1, y: crossOrigin.y + 3 }];

  // Single tile (only if set)
  if (singleTile) {
    topTextures.SingleTile = [{ x: singleTile.x, y: singleTile.y }];
  }

  return {
    tileSize,
    topTextures,
    sideTextures: {},
  };
}

// Validate wall side tiles for empty pixels
// Wall sides are 5 cols x 2 rows
export function validateWallSideTiles(
  imageData: ImageData,
  config: WallSideConfig,
  tileSize: Int2,
  margin: number,
  spacing: number
): boolean[][] {
  const validTiles: boolean[][] = [];

  for (let row = 0; row < 2; row++) {
    validTiles[row] = [];
    for (let col = 0; col < 5; col++) {
      const tileX = margin + (config.rectOrigin.x + col) * (tileSize.x + spacing);
      const tileY = margin + (config.rectOrigin.y + row) * (tileSize.y + spacing);

      // Check if any pixel in the tile has non-zero alpha
      let hasData = false;
      for (let py = 0; py < tileSize.y && !hasData; py++) {
        for (let px = 0; px < tileSize.x && !hasData; px++) {
          const pixelX = tileX + px;
          const pixelY = tileY + py;
          if (pixelX < imageData.width && pixelY < imageData.height) {
            const idx = (pixelY * imageData.width + pixelX) * 4;
            if (imageData.data[idx + 3] > 0) {
              hasData = true;
            }
          }
        }
      }
      validTiles[row][col] = hasData;
    }
  }

  return validTiles;
}

// Validate ground side tiles for empty pixels
// Ground sides are 5 cols x 4 rows (one row per Y level 0-3)
export function validateGroundSideTiles(
  imageData: ImageData,
  config: GroundSideConfig,
  tileSize: Int2,
  margin: number,
  spacing: number
): boolean[][] {
  const validTiles: boolean[][] = [];

  for (let row = 0; row < 4; row++) {
    validTiles[row] = [];
    for (let col = 0; col < 5; col++) {
      const tileX = margin + (config.rectOrigin.x + col) * (tileSize.x + spacing);
      const tileY = margin + (config.rectOrigin.y + row) * (tileSize.y + spacing);

      // Check if any pixel in the tile has non-zero alpha
      let hasData = false;
      for (let py = 0; py < tileSize.y && !hasData; py++) {
        for (let px = 0; px < tileSize.x && !hasData; px++) {
          const pixelX = tileX + px;
          const pixelY = tileY + py;
          if (pixelX < imageData.width && pixelY < imageData.height) {
            const idx = (pixelY * imageData.width + pixelX) * 4;
            if (imageData.data[idx + 3] > 0) {
              hasData = true;
            }
          }
        }
      }
      validTiles[row][col] = hasData;
    }
  }

  return validTiles;
}
