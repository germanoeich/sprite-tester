// Blob Autotile Generator
// Generates 47 blob tiles from 17 source tiles using quadrant compositing

import {
  Int2,
  Rect,
  UVRect,
  BlobTileType,
  TopTileType,
  YLevel,
  TileFeatures,
  TileQuadrant,
  TopTileTypeName,
  YLevelName,
  TilesetConfig,
  NeighborPresence,
  GeneratedTileset,
} from './types';

// --- UV helpers ---

export function uvRectFromPixels(pixelPosTopLeft: Int2, spriteSize: Int2, texW: number, texH: number): UVRect {
  // Matches Unity UVRect.FromPixels: input pos is top-left; output UVs are bottom-left origin.
  const min = { x: pixelPosTopLeft.x / texW, y: 1 - (pixelPosTopLeft.y + spriteSize.y) / texH };
  const max = { x: (pixelPosTopLeft.x + spriteSize.x) / texW, y: 1 - pixelPosTopLeft.y / texH };
  return {
    min,
    max,
    uv00: { x: min.x, y: min.y },
    uv10: { x: max.x, y: min.y },
    uv01: { x: min.x, y: max.y },
    uv11: { x: max.x, y: max.y },
  };
}

export function uvRectFromTileIndex(tileIndex: Int2, tileSize: Int2, texW: number, texH: number): UVRect {
  return uvRectFromPixels({ x: tileIndex.x * tileSize.x, y: tileIndex.y * tileSize.y }, tileSize, texW, texH);
}

// --- Quadrant/feature logic ---

export function getQuadrantRect(quadrant: TileQuadrant, tileSize: Int2): Rect {
  const half = { x: Math.floor(tileSize.x / 2), y: Math.floor(tileSize.y / 2) };
  switch (quadrant) {
    case TileQuadrant.Q1: return { x: 0, y: 0, w: half.x, h: half.y };
    case TileQuadrant.Q2: return { x: half.x, y: 0, w: half.x, h: half.y };
    case TileQuadrant.Q3: return { x: 0, y: half.y, w: half.x, h: half.y };
    case TileQuadrant.Q4: return { x: half.x, y: half.y, w: half.x, h: half.y };
    case TileQuadrant.All: return { x: 0, y: 0, w: tileSize.x, h: tileSize.y };
  }
}

export function getQuadrant(feature: TileFeatures): TileQuadrant {
  switch (feature) {
    case TileFeatures.CornerQ1:
    case TileFeatures.BorderLeftQ1:
    case TileFeatures.BorderTopQ1:
    case TileFeatures.InnerCornerQ1: return TileQuadrant.Q1;

    case TileFeatures.CornerQ2:
    case TileFeatures.BorderRightQ2:
    case TileFeatures.BorderTopQ2:
    case TileFeatures.InnerCornerQ2: return TileQuadrant.Q2;

    case TileFeatures.CornerQ3:
    case TileFeatures.BorderLeftQ3:
    case TileFeatures.BorderBottomQ3:
    case TileFeatures.InnerCornerQ3: return TileQuadrant.Q3;

    case TileFeatures.CornerQ4:
    case TileFeatures.BorderRightQ4:
    case TileFeatures.BorderBottomQ4:
    case TileFeatures.InnerCornerQ4: return TileQuadrant.Q4;

    case TileFeatures.Full:
    case TileFeatures.SingleTile: return TileQuadrant.All;
  }
}

export function getFeaturesInTopTile(type: TopTileType): readonly TileFeatures[] {
  switch (type) {
    case TopTileType.Full: return [TileFeatures.Full];
    case TopTileType.Left: return [TileFeatures.BorderLeftQ1, TileFeatures.BorderLeftQ3];
    case TopTileType.Right: return [TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4];
    case TopTileType.Top: return [TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2];
    case TopTileType.Bottom: return [TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4];
    case TopTileType.TopLeftCorner: return [TileFeatures.CornerQ1, TileFeatures.BorderTopQ2, TileFeatures.BorderLeftQ3];
    case TopTileType.TopRightCorner: return [TileFeatures.CornerQ2, TileFeatures.BorderTopQ1, TileFeatures.BorderRightQ4];
    case TopTileType.BottomLeftCorner: return [TileFeatures.CornerQ3, TileFeatures.BorderLeftQ1, TileFeatures.BorderBottomQ4];
    case TopTileType.BottomRightCorner: return [TileFeatures.CornerQ4, TileFeatures.BorderBottomQ3, TileFeatures.BorderRightQ2];
    case TopTileType.InnerCorners: return [TileFeatures.InnerCornerQ3, TileFeatures.InnerCornerQ4, TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ2];
    case TopTileType.SingleTile: return [TileFeatures.SingleTile];
    case TopTileType.VerticalBridge: return [TileFeatures.BorderLeftQ1, TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4, TileFeatures.BorderLeftQ3];
    case TopTileType.VerticalBridgeTop: return [TileFeatures.CornerQ1, TileFeatures.CornerQ2, TileFeatures.BorderLeftQ3, TileFeatures.BorderRightQ4];
    case TopTileType.VerticalBridgeBottom: return [TileFeatures.CornerQ3, TileFeatures.CornerQ4, TileFeatures.BorderLeftQ1, TileFeatures.BorderRightQ2];
    case TopTileType.HorizontalBridge: return [TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2, TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4];
    case TopTileType.HorizontalBridgeLeft: return [TileFeatures.CornerQ1, TileFeatures.CornerQ3, TileFeatures.BorderTopQ2, TileFeatures.BorderBottomQ4];
    case TopTileType.HorizontalBridgeRight: return [TileFeatures.CornerQ2, TileFeatures.CornerQ4, TileFeatures.BorderTopQ1, TileFeatures.BorderBottomQ3];
  }
}

// --- Blob recipes (47) ---

const TopLeftCorner: readonly TileFeatures[] = [TileFeatures.CornerQ1, TileFeatures.BorderTopQ2, TileFeatures.BorderLeftQ3];
const TopRightCorner: readonly TileFeatures[] = [TileFeatures.CornerQ2, TileFeatures.BorderTopQ1, TileFeatures.BorderRightQ4];
const BottomLeftCorner: readonly TileFeatures[] = [TileFeatures.CornerQ3, TileFeatures.BorderLeftQ1, TileFeatures.BorderBottomQ4];
const BottomRightCorner: readonly TileFeatures[] = [TileFeatures.CornerQ4, TileFeatures.BorderBottomQ3, TileFeatures.BorderRightQ2];
const BothTopCorners: readonly TileFeatures[] = [TileFeatures.CornerQ2, TileFeatures.CornerQ1, TileFeatures.BorderLeftQ3, TileFeatures.BorderRightQ4];
const BothBottomCorners: readonly TileFeatures[] = [TileFeatures.CornerQ4, TileFeatures.CornerQ3, TileFeatures.BorderLeftQ1, TileFeatures.BorderRightQ2];
const BothLeftCorners: readonly TileFeatures[] = [TileFeatures.CornerQ1, TileFeatures.CornerQ3, TileFeatures.BorderTopQ2, TileFeatures.BorderBottomQ4];
const BothRightCorners: readonly TileFeatures[] = [TileFeatures.CornerQ2, TileFeatures.CornerQ4, TileFeatures.BorderTopQ1, TileFeatures.BorderBottomQ3];

export const BlobTileFeatureMap: ReadonlyArray<[BlobTileType, readonly TileFeatures[]]> = [
  [BlobTileType.SingleTile, [TileFeatures.SingleTile]],
  [BlobTileType.BorderTop, [TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2]],
  [BlobTileType.BorderRight, [TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4]],
  [BlobTileType.BorderBottom, [TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4]],
  [BlobTileType.BorderLeft, [TileFeatures.BorderLeftQ1, TileFeatures.BorderLeftQ3]],
  [BlobTileType.CornerTopRight, TopRightCorner],
  [BlobTileType.CornerBottomRight, BottomRightCorner],
  [BlobTileType.CornerBottomLeft, BottomLeftCorner],
  [BlobTileType.CornerTopLeft, TopLeftCorner],
  [BlobTileType.BridgeVertical, [TileFeatures.BorderLeftQ1, TileFeatures.BorderLeftQ3, TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4]],
  [BlobTileType.BridgeHorizontal, [TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2, TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4]],
  [BlobTileType.BothCornersTop, BothTopCorners],
  [BlobTileType.BothCornersBottom, BothBottomCorners],
  [BlobTileType.BothCornersLeft, BothLeftCorners],
  [BlobTileType.BothCornersRight, BothRightCorners],
  [BlobTileType.AllInnerCorners, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ3, TileFeatures.InnerCornerQ4]],
  [BlobTileType.TopLeftCornerBottomRightInnerCorner, [...TopLeftCorner, TileFeatures.InnerCornerQ4]],
  [BlobTileType.TopRightCornerBottomLeftInnerCorner, [...TopRightCorner, TileFeatures.InnerCornerQ3]],
  [BlobTileType.BottomLeftCornerTopRightInnerCorner, [...BottomLeftCorner, TileFeatures.InnerCornerQ2]],
  [BlobTileType.BottomRightCornerTopLeftInnerCorner, [...BottomRightCorner, TileFeatures.InnerCornerQ1]],
  [BlobTileType.InnerCornersBottomBorderTop, [TileFeatures.InnerCornerQ3, TileFeatures.InnerCornerQ4, TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2]],
  [BlobTileType.InnerCornersTopBorderBottom, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ2, TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4]],
  [BlobTileType.InnerCornersRightBorderLeft, [TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ4, TileFeatures.BorderLeftQ1, TileFeatures.BorderLeftQ3]],
  [BlobTileType.InnerCornersLeftBorderRight, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ3, TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4]],
  [BlobTileType.InnerCornerTopLeftBottomRight, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ4]],
  [BlobTileType.InnerCornerTopRightBottomLeft, [TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ3]],
  [BlobTileType.ThreeInnerCornersNotTopLeft, [TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ3, TileFeatures.InnerCornerQ4]],
  [BlobTileType.ThreeInnerCornersNotTopRight, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ3, TileFeatures.InnerCornerQ4]],
  [BlobTileType.ThreeInnerCornersNotBottomRight, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ3]],
  [BlobTileType.ThreeInnerCornersNotBottomLeft, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ4]],
  [BlobTileType.LeftBorderBottomRightInnerCorner, [TileFeatures.BorderLeftQ1, TileFeatures.BorderLeftQ3, TileFeatures.InnerCornerQ4]],
  [BlobTileType.LeftBorderTopRightInnerCorner, [TileFeatures.BorderLeftQ1, TileFeatures.BorderLeftQ3, TileFeatures.InnerCornerQ2]],
  [BlobTileType.RightBorderBottomLeftInnerCorner, [TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4, TileFeatures.InnerCornerQ3]],
  [BlobTileType.RightBorderTopLeftInnerCorner, [TileFeatures.BorderRightQ2, TileFeatures.BorderRightQ4, TileFeatures.InnerCornerQ1]],
  [BlobTileType.TopBorderBottomRightInnerCorner, [TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2, TileFeatures.InnerCornerQ4]],
  [BlobTileType.TopBorderBottomLeftInnerCorner, [TileFeatures.BorderTopQ1, TileFeatures.BorderTopQ2, TileFeatures.InnerCornerQ3]],
  [BlobTileType.BottomBorderTopRightInnerCorner, [TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4, TileFeatures.InnerCornerQ2]],
  [BlobTileType.BottomBorderTopLeftInnerCorner, [TileFeatures.BorderBottomQ3, TileFeatures.BorderBottomQ4, TileFeatures.InnerCornerQ1]],
  [BlobTileType.BothInnerCornersBottom, [TileFeatures.InnerCornerQ3, TileFeatures.InnerCornerQ4]],
  [BlobTileType.BothInnerCornersTop, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ2]],
  [BlobTileType.BothInnerCornersLeft, [TileFeatures.InnerCornerQ1, TileFeatures.InnerCornerQ3]],
  [BlobTileType.BothInnerCornersRight, [TileFeatures.InnerCornerQ2, TileFeatures.InnerCornerQ4]],
  [BlobTileType.BottomRightInnerCorner, [TileFeatures.InnerCornerQ4]],
  [BlobTileType.BottomLeftInnerCorner, [TileFeatures.InnerCornerQ3]],
  [BlobTileType.TopRightInnerCorner, [TileFeatures.InnerCornerQ2]],
  [BlobTileType.TopLeftInnerCorner, [TileFeatures.InnerCornerQ1]],
  [BlobTileType.Full, [TileFeatures.Full]],
] as const;

// --- Image helpers (top-left origin, like canvas/ImageData) ---

export function cropImageData(src: ImageData, rect: Rect): ImageData {
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > src.width || rect.y + rect.h > src.height)
    throw new Error(`crop out of bounds: ${JSON.stringify(rect)} src=${src.width}x${src.height}`);

  const out = new ImageData(rect.w, rect.h);
  for (let row = 0; row < rect.h; row++) {
    const srcStart = ((rect.y + row) * src.width + rect.x) * 4;
    const srcEnd = srcStart + rect.w * 4;
    const dstStart = row * rect.w * 4;
    out.data.set(src.data.subarray(srcStart, srcEnd), dstStart);
  }
  return out;
}

export function blitImageData(dst: ImageData, src: ImageData, dstPos: Int2): void {
  if (dstPos.x < 0 || dstPos.y < 0 || dstPos.x + src.width > dst.width || dstPos.y + src.height > dst.height)
    throw new Error(`blit out of bounds: dstPos=${JSON.stringify(dstPos)} src=${src.width}x${src.height} dst=${dst.width}x${dst.height}`);

  for (let row = 0; row < src.height; row++) {
    const srcStart = row * src.width * 4;
    const srcEnd = srcStart + src.width * 4;
    const dstStart = ((dstPos.y + row) * dst.width + dstPos.x) * 4;
    dst.data.set(src.data.subarray(srcStart, srcEnd), dstStart);
  }
}

export function sliceQuadrant(tile: ImageData, quadrant: TileQuadrant, tileSize: Int2): ImageData {
  return cropImageData(tile, getQuadrantRect(quadrant, tileSize));
}

function pushMapArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

function isBottomBorder(req: readonly TileFeatures[]): boolean {
  return req.length === 2 && req.includes(TileFeatures.BorderBottomQ3) && req.includes(TileFeatures.BorderBottomQ4);
}
function isTopBorder(req: readonly TileFeatures[]): boolean {
  return req.length === 2 && req.includes(TileFeatures.BorderTopQ1) && req.includes(TileFeatures.BorderTopQ2);
}
function isLeftBorder(req: readonly TileFeatures[]): boolean {
  return req.length === 2 && req.includes(TileFeatures.BorderLeftQ1) && req.includes(TileFeatures.BorderLeftQ3);
}
function isRightBorder(req: readonly TileFeatures[]): boolean {
  return req.length === 2 && req.includes(TileFeatures.BorderRightQ2) && req.includes(TileFeatures.BorderRightQ4);
}

export function appendTexturesInGrid(textures: readonly ImageData[], columns: number): ImageData {
  if (columns <= 0) columns = 1;
  const gridHeight = Math.ceil(textures.length / columns);

  let maxW = 0;
  let maxH = 0;
  for (const t of textures) {
    maxW = Math.max(maxW, t.width);
    maxH = Math.max(maxH, t.height);
  }

  const out = new ImageData(maxW * columns, maxH * gridHeight);

  for (let i = 0; i < textures.length; i++) {
    const t = textures[i];
    const gridX = i % columns;
    const gridY = Math.floor(i / columns); // row 0 at top
    blitImageData(out, t, { x: gridX * maxW, y: gridY * maxH });
  }

  return out;
}

export function generateTileset(sourceAtlas: ImageData, cfg: TilesetConfig, columns = 20): GeneratedTileset {
  if (cfg.tileSize.x % 2 !== 0 || cfg.tileSize.y % 2 !== 0)
    throw new Error(`tileSize must be divisible by 2. Got ${cfg.tileSize.x}x${cfg.tileSize.y}`);

  // 1) Slice tiles out of atlas
  const slicedTopTiles = new Map<TopTileType, ImageData[]>();
  const slicedSideTiles = new Map<YLevel, ImageData[]>();

  const topOrder: readonly TopTileTypeName[] = [
    "Full", "Left", "Right", "Top", "Bottom",
    "TopLeftCorner", "TopRightCorner", "BottomLeftCorner", "BottomRightCorner",
    "InnerCorners", "SingleTile",
    "VerticalBridge", "VerticalBridgeTop", "VerticalBridgeBottom",
    "HorizontalBridge", "HorizontalBridgeLeft", "HorizontalBridgeRight",
  ];

  const sideOrder: readonly YLevelName[] = [
    "BottomWallLayer", "TopWallLayer", "GroundLayer", "UndergroundLayer1", "UndergroundLayer2", "UndergroundLayer3",
  ];

  for (const name of topOrder) {
    const type = TopTileType[name as keyof typeof TopTileType];
    const positions = cfg.topTextures[name] ?? [];
    for (const p of positions) {
      const pixelPos = { x: p.x * cfg.tileSize.x, y: p.y * cfg.tileSize.y };
      const tile = cropImageData(sourceAtlas, { x: pixelPos.x, y: pixelPos.y, w: cfg.tileSize.x, h: cfg.tileSize.y });
      pushMapArray(slicedTopTiles, type, tile);
    }
  }

  for (const name of sideOrder) {
    const lvl = YLevel[name as keyof typeof YLevel];
    const positions = cfg.sideTextures[name] ?? [];
    for (const p of positions) {
      const pixelPos = { x: p.x * cfg.tileSize.x, y: p.y * cfg.tileSize.y };
      const tile = cropImageData(sourceAtlas, { x: pixelPos.x, y: pixelPos.y, w: cfg.tileSize.x, h: cfg.tileSize.y });
      pushMapArray(slicedSideTiles, lvl, tile);
    }
  }

  // 2) Build feature library
  const featureTextures = new Map<TileFeatures, ImageData[]>();
  for (const [topType, tiles] of slicedTopTiles.entries()) {
    const feats = getFeaturesInTopTile(topType);
    for (const tile of tiles) {
      for (const feat of feats) {
        const quad = getQuadrant(feat);
        const section = sliceQuadrant(tile, quad, cfg.tileSize);
        pushMapArray(featureTextures, feat, section);
      }
    }
  }

  const fullBase = featureTextures.get(TileFeatures.Full)?.[0];

  function generateTile(required: readonly TileFeatures[]): ImageData {
    const out = new ImageData(cfg.tileSize.x, cfg.tileSize.y);
    if (fullBase) out.data.set(fullBase.data);
    for (const feat of required) {
      const tex = featureTextures.get(feat)?.[0];
      if (!tex) continue;
      const r = getQuadrantRect(getQuadrant(feat), cfg.tileSize);
      blitImageData(out, tex, { x: r.x, y: r.y });
    }
    return out;
  }

  function generateVariantsFromLists(required: readonly TileFeatures[], lists: readonly ImageData[][]): ImageData[] {
    if (lists.length === 0) return [];
    for (const list of lists) {
      if (list.length === 0) return [];
    }

    const results: ImageData[] = [];
    const current: ImageData[] = new Array(required.length);

    const build = (idx: number) => {
      if (idx === lists.length) {
        const out = new ImageData(cfg.tileSize.x, cfg.tileSize.y);
        if (fullBase) out.data.set(fullBase.data);
        for (let i = 0; i < required.length; i++) {
          const feat = required[i];
          const tex = current[i];
          if (!tex) continue;
          const r = getQuadrantRect(getQuadrant(feat), cfg.tileSize);
          blitImageData(out, tex, { x: r.x, y: r.y });
        }
        results.push(out);
        return;
      }

      const list = lists[idx];
      for (let i = 0; i < list.length; i++) {
        current[idx] = list[i];
        build(idx + 1);
      }
    };

    build(0);
    return results;
  }

  function generateEdgeVariantsFromSources(required: readonly TileFeatures[], sources: readonly ImageData[]): ImageData[] {
    const lists = required.map((feat) => {
      const quad = getQuadrant(feat);
      return sources.map((src) => sliceQuadrant(src, quad, cfg.tileSize));
    });
    return generateVariantsFromLists(required, lists);
  }

  function generateTileVariants(required: readonly TileFeatures[]): ImageData[] {
    // Special-case straight borders (Unity behavior)
    if (isBottomBorder(required)) {
      const sources = [...(slicedTopTiles.get(TopTileType.Bottom) ?? []), ...(slicedTopTiles.get(TopTileType.HorizontalBridge) ?? [])];
      return generateEdgeVariantsFromSources(required, sources);
    }
    if (isTopBorder(required)) {
      const sources = [...(slicedTopTiles.get(TopTileType.Top) ?? []), ...(slicedTopTiles.get(TopTileType.HorizontalBridge) ?? [])];
      return generateEdgeVariantsFromSources(required, sources);
    }
    if (isLeftBorder(required)) {
      const sources = [...(slicedTopTiles.get(TopTileType.Left) ?? []), ...(slicedTopTiles.get(TopTileType.VerticalBridge) ?? [])];
      return generateEdgeVariantsFromSources(required, sources);
    }
    if (isRightBorder(required)) {
      const sources = [...(slicedTopTiles.get(TopTileType.Right) ?? []), ...(slicedTopTiles.get(TopTileType.VerticalBridge) ?? [])];
      return generateEdgeVariantsFromSources(required, sources);
    }

    // General case: build all quadrant combinations
    const lists: ImageData[][] = [];
    for (const feat of required) {
      const list = featureTextures.get(feat);
      if (!list || list.length === 0) return [];
      lists.push(list);
    }

    return generateVariantsFromLists(required, lists);
  }

  // 3) Generate blob tiles, then append side tiles
  const texturesInOrder: ImageData[] = [];
  const topTiles = new Map<BlobTileType, ImageData[]>();
  const topIndices = new Map<BlobTileType, number[]>();
  const sideTiles = new Map<YLevel, ImageData[]>();
  const sideIndices = new Map<YLevel, number[]>();

  let tileIndex = 0;

  for (const [blobType, required] of BlobTileFeatureMap) {
    const variants = generateTileVariants(required);
    const used = variants.length > 0 ? variants : [generateTile(required)];
    for (const tile of used) {
      texturesInOrder.push(tile);
      pushMapArray(topTiles, blobType, tile);
      pushMapArray(topIndices, blobType, tileIndex);
      tileIndex++;
    }
  }

  for (const name of sideOrder) {
    const lvl = YLevel[name as keyof typeof YLevel];
    const tiles = slicedSideTiles.get(lvl) ?? [];
    for (const tile of tiles) {
      texturesInOrder.push(tile);
      pushMapArray(sideTiles, lvl, tile);
      pushMapArray(sideIndices, lvl, tileIndex);
      tileIndex++;
    }
  }

  // 4) Pack atlas
  const atlas = appendTexturesInGrid(texturesInOrder, columns);

  // 5) UVs for each variant
  const topTexturePositions = new Map<BlobTileType, UVRect[]>();
  const sideTexturePositions = new Map<YLevel, UVRect[]>();

  for (const [blobType, indices] of topIndices.entries()) {
    const uvs: UVRect[] = [];
    for (const i of indices) {
      uvs.push(uvRectFromTileIndex({ x: i % columns, y: Math.floor(i / columns) }, cfg.tileSize, atlas.width, atlas.height));
    }
    topTexturePositions.set(blobType, uvs);
  }

  for (const [lvl, indices] of sideIndices.entries()) {
    const uvs: UVRect[] = [];
    for (const i of indices) {
      uvs.push(uvRectFromTileIndex({ x: i % columns, y: Math.floor(i / columns) }, cfg.tileSize, atlas.width, atlas.height));
    }
    sideTexturePositions.set(lvl, uvs);
  }

  return { tileSize: cfg.tileSize, columns, atlas, topTiles, sideTiles, topIndices, sideIndices, topTexturePositions, sideTexturePositions };
}

// --- Runtime neighbor mask ("blob index") ---

export function blobMaskFromNeighbors(n: NeighborPresence): number {
  let top = n.top ? 1 : 0;
  let bottom = n.bottom ? 1 : 0;
  let left = n.left ? 1 : 0;
  let right = n.right ? 1 : 0;
  let topRight = n.topRight ? 1 : 0;
  let topLeft = n.topLeft ? 1 : 0;
  let bottomRight = n.bottomRight ? 1 : 0;
  let bottomLeft = n.bottomLeft ? 1 : 0;

  // diagonal gating
  if (!left || !top) topLeft = 0;
  if (!right || !top) topRight = 0;
  if (!left || !bottom) bottomLeft = 0;
  if (!right || !bottom) bottomRight = 0;

  return top + 2 * topRight + 4 * right + 8 * bottomRight + 16 * bottom + 32 * bottomLeft + 64 * left + 128 * topLeft;
}

// Lookup table: BlobTileType value (mask) -> index in BlobTileFeatureMap order
// This is needed because the generated atlas tiles are in BlobTileFeatureMap order
const blobTypeToAtlasIndex = new Map<BlobTileType, number>();
BlobTileFeatureMap.forEach(([blobType], index) => {
  blobTypeToAtlasIndex.set(blobType, index);
});

export function getBlobAtlasIndex(blobType: BlobTileType): number {
  return blobTypeToAtlasIndex.get(blobType) ?? 0;
}

// Get neighbor presence from a grid at position (x, y)
export function getNeighborPresence(
  grid: Map<string, { autotileCategory?: string | null; tilesetId?: string }>,
  x: number,
  y: number,
  category: string,
  tilesetId?: string
): NeighborPresence {
  const hasNeighbor = (dx: number, dy: number): boolean => {
    const cell = grid.get(`${x + dx},${y + dy}`);
    if (cell?.autotileCategory !== category) return false;
    if (!tilesetId) return true;
    return cell.tilesetId === tilesetId;
  };

  return {
    top: hasNeighbor(0, -1),
    topRight: hasNeighbor(1, -1),
    right: hasNeighbor(1, 0),
    bottomRight: hasNeighbor(1, 1),
    bottom: hasNeighbor(0, 1),
    bottomLeft: hasNeighbor(-1, 1),
    left: hasNeighbor(-1, 0),
    topLeft: hasNeighbor(-1, -1),
  };
}
