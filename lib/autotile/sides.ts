// Side tile helpers for ground and wall depth visualization
// Ground sides: 4 levels deep (y+1 to y+4)
// Wall sides: 2 levels deep (y+1 to y+2)

import type { AutotileCategory, WallSideConfig, GroundSideConfig } from './types';
import type { TileCell, TilesetMetadata } from '@/types';

export const GROUND_SIDE_DEPTH = 4;
export const WALL_SIDE_DEPTH = 2;

// Priority for override rules: higher number = higher priority
// wallTop > wallSide > ground > groundSide > empty
const CATEGORY_PRIORITY: Record<AutotileCategory, number> = {
  'wallTop': 4,
  'wallSide': 3,
  'ground': 2,
  'groundSide': 1,
};

/**
 * Check if a category can override an existing tile
 * @param existing The existing tile's category (null if empty)
 * @param placing The category being placed
 */
export function canOverride(
  existing: AutotileCategory | null | undefined,
  placing: AutotileCategory
): boolean {
  if (!existing) return true;
  return CATEGORY_PRIORITY[placing] > CATEGORY_PRIORITY[existing];
}

export function canPlaceSideTile(
  existingCell: TileCell | undefined,
  sideCategory: 'groundSide' | 'wallSide',
  placingTopY: number,
  placingTilesetId?: string
): boolean {
  if (!existingCell) return true;
  if (!existingCell.autotileCategory) return false;
  if (canOverride(existingCell.autotileCategory, sideCategory)) return true;
  if (existingCell.autotileCategory !== sideCategory) return false;
  if (placingTilesetId && existingCell.tilesetId !== placingTilesetId) return false;
  if (existingCell.sideTopY === undefined) return true;
  return existingCell.sideTopY <= placingTopY;
}

/**
 * Get the column index (0-4) for a side tile based on neighboring top tiles
 * 5 columns represent different edge patterns:
 * - 0: Left edge (neighbor only on right)
 * - 1: Left-middle variant
 * - 2: Middle (neighbors on both sides)
 * - 3: Right-middle variant
 * - 4: Right edge (neighbor only on left)
 *
 * For single columns (no neighbors), use middle (2)
 *
 * @param hasLeftNeighbor Whether there's a top tile to the left
 * @param hasRightNeighbor Whether there's a top tile to the right
 * @param validTiles Optional 2D array indicating which tiles have data [row][col]
 * @param level The depth level (row in validTiles)
 * @returns Column index, or -1 if no valid tile exists for this position
 */
export function getSideColumnIndex(
  hasLeftNeighbor: boolean,
  hasRightNeighbor: boolean,
  validTiles?: boolean[][],
  level?: number
): number {
  // Determine which column(s) to consider based on neighbors
  let candidateColumns: number[];

  if (hasLeftNeighbor && hasRightNeighbor) {
    // Middle - can use columns 1, 2, or 3 (variants)
    candidateColumns = [1, 2, 3];
  } else if (hasLeftNeighbor && !hasRightNeighbor) {
    // Right edge (has neighbor to left, we're the right end)
    candidateColumns = [4];
  } else if (!hasLeftNeighbor && hasRightNeighbor) {
    // Left edge (has neighbor to right, we're the left end)
    candidateColumns = [0];
  } else {
    // Single column - no neighbors on either side, use middle variants
    candidateColumns = [1, 2, 3];
  }

  // If we have validTiles info, filter to only valid columns
  if (validTiles && level !== undefined && level < validTiles.length) {
    const rowValidation = validTiles[level];
    if (rowValidation) {
      candidateColumns = candidateColumns.filter(col =>
        col < rowValidation.length && rowValidation[col] === true
      );
    }
  }

  // If no valid columns, fall back to any valid tile in this row
  if (candidateColumns.length === 0 && validTiles && level !== undefined && level < validTiles.length) {
    const rowValidation = validTiles[level];
    if (rowValidation) {
      candidateColumns = rowValidation
        .map((isValid, idx) => (isValid ? idx : -1))
        .filter(idx => idx >= 0);
    }
  }

  if (candidateColumns.length === 0) {
    return -1;
  }

  // Randomly select from valid candidates for variety
  const randomIndex = Math.floor(Math.random() * candidateColumns.length);
  return candidateColumns[randomIndex];
}

/**
 * Calculate the tileset index for a side tile
 * @param column X pattern column (0-4)
 * @param level Depth level (0-3 for ground, 0-1 for wall)
 * @param sideConfig The side config with rectOrigin
 * @param tilesetCols Number of columns in the tileset
 */
export function getSideTileIndex(
  column: number,
  level: number,
  sideConfig: { rectOrigin: { x: number; y: number } },
  tilesetCols: number
): number {
  const tileX = sideConfig.rectOrigin.x + column;
  const tileY = sideConfig.rectOrigin.y + level;
  return tileY * tilesetCols + tileX;
}

/**
 * Get the tileset columns count from metadata
 */
export function getTilesetColumns(meta: TilesetMetadata, imgWidth: number): number {
  const { tileW, margin, spacing } = meta;
  return Math.floor((imgWidth - 2 * margin + spacing) / (tileW + spacing));
}

/**
 * Check if a tile at position is a top tile of the specified category
 */
export function isTopTileAt(
  grid: Map<string, TileCell>,
  x: number,
  y: number,
  topCategory: 'ground' | 'wallTop',
  tilesetId?: string
): boolean {
  const cell = grid.get(`${x},${y}`);
  if (cell?.autotileCategory !== topCategory) return false;
  if (!tilesetId) return true;
  return cell.tilesetId === tilesetId;
}

/**
 * Get the corresponding top category for a side category
 */
export function getTopCategoryForSide(
  sideCategory: 'groundSide' | 'wallSide'
): 'ground' | 'wallTop' {
  return sideCategory === 'groundSide' ? 'ground' : 'wallTop';
}

/**
 * Get the corresponding side category for a top category
 */
export function getSideCategoryForTop(
  topCategory: 'ground' | 'wallTop'
): 'groundSide' | 'wallSide' {
  return topCategory === 'ground' ? 'groundSide' : 'wallSide';
}

/**
 * Get the depth for a category
 */
export function getSideDepth(topCategory: 'ground' | 'wallTop'): number {
  return topCategory === 'ground' ? GROUND_SIDE_DEPTH : WALL_SIDE_DEPTH;
}

/**
 * Determines if an existing cell should block side tile placement
 * For groundSide: block if any tile exists
 * For wallSide: only block if wallTop or wallSide exists
 */
export function shouldBlockSidePlacement(
  existingCell: TileCell | undefined,
  sideCategory: 'groundSide' | 'wallSide'
): boolean {
  if (!existingCell) return false;

  // Regular tiles (no autotile category) block everything
  if (!existingCell.autotileCategory) return true;

  // Check override rules
  return !canOverride(existingCell.autotileCategory, sideCategory);
}
