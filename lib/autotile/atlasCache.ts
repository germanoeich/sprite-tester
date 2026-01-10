// Atlas cache for storing generated autotile atlases
// Each tileset+category combination has its own generated atlas

import type { AutotileTopCategory, AutotileSourceConfig, Int2, BlobTileType } from './types';
import { generateTileset } from './generator';
import { autotileSourceToTilesetConfig } from './defaults';

interface CachedAtlas {
  canvas: HTMLCanvasElement;
  tileSize: Int2;
  columns: number;
  // Maps BlobTileType value to first atlas index for that type
  blobTypeToIndex: Map<number, number>;
}

// Cache key format: `${tilesetId}_${category}`
const atlasCache = new Map<string, CachedAtlas>();

function getCacheKey(tilesetId: string, category: AutotileTopCategory): string {
  return `${tilesetId}_${category}`;
}

// Get ImageData from an HTMLImageElement
function getImageDataFromImage(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Convert ImageData to canvas for efficient rendering
function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function getOrGenerateAtlas(
  tilesetId: string,
  category: AutotileTopCategory,
  sourceImg: HTMLImageElement,
  config: AutotileSourceConfig,
  tileSize: Int2
): CachedAtlas | null {
  const key = getCacheKey(tilesetId, category);

  // Check cache first
  const cached = atlasCache.get(key);
  if (cached) {
    return cached;
  }

  // Generate the atlas
  try {
    const sourceImageData = getImageDataFromImage(sourceImg);
    // Config now has rectSize, so one function handles both ground (5x4) and wallTop (5x3)
    const tilesetConfig = autotileSourceToTilesetConfig(config, tileSize);
    const generated = generateTileset(sourceImageData, tilesetConfig, 20);

    // Build blob type to atlas index mapping (use first variant index for each type)
    const blobTypeToIndex = new Map<number, number>();
    for (const [blobType, indices] of generated.topIndices.entries()) {
      if (indices.length > 0) {
        blobTypeToIndex.set(blobType as number, indices[0]);
      }
    }

    const cachedAtlas: CachedAtlas = {
      canvas: imageDataToCanvas(generated.atlas),
      tileSize: generated.tileSize,
      columns: generated.columns,
      blobTypeToIndex
    };

    atlasCache.set(key, cachedAtlas);
    return cachedAtlas;
  } catch (error) {
    console.error(`Failed to generate autotile atlas for ${key}:`, error);
    return null;
  }
}

export function getCachedAtlas(tilesetId: string, category: AutotileTopCategory): CachedAtlas | null {
  return atlasCache.get(getCacheKey(tilesetId, category)) ?? null;
}

export function invalidateAtlas(tilesetId: string, category?: AutotileTopCategory): void {
  if (category) {
    atlasCache.delete(getCacheKey(tilesetId, category));
  } else {
    // Invalidate all categories for this tileset
    const keysToDelete: string[] = [];
    for (const key of atlasCache.keys()) {
      if (key.startsWith(`${tilesetId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => atlasCache.delete(key));
  }
}

export function clearAtlasCache(): void {
  atlasCache.clear();
}

export function hasAtlas(tilesetId: string, category: AutotileTopCategory): boolean {
  return atlasCache.has(getCacheKey(tilesetId, category));
}
