import { Camera, Layer, TileLayer, ObjectLayer, Asset, GameResolution, Selection, EditorMode, TileBrush, TilesetMetadata, PlacedObject, TextPlacedObject, ArrowPlacedObject, SpritePlacedObject, DrawingArrow, TileCell, AutotileCategory } from '@/types';
import { assetManager } from '@/lib/utils/assetManager';
import { getOrGenerateAtlas, getCachedAtlas } from '@/lib/autotile/atlasCache';

function hashTileVariant(x: number, y: number, seed: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 0x9e3779b1);
  h = Math.imul(h ^ (y | 0), 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
}

function pickVariantIndex(indices: number[] | undefined, x: number, y: number, seed: number): number {
  if (!indices || indices.length === 0) return 0;
  if (indices.length === 1) return indices[0];
  const h = hashTileVariant(x, y, seed);
  return indices[h % indices.length];
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  private layers: Layer[] = [];
  private gridVisible = true;
  private gameResolution: GameResolution = { enabled: false, width: 320, height: 240 };
  private ppu = 16;
  private selection: Selection | null = null;
  private assets: Asset[] = [];
  private mode: EditorMode = 'select';
  private tileBrush: TileBrush = {
    tilesetId: null,
    indices: [],
    width: 1,
    height: 1,
    originCol: 0,
    originRow: 0
  };
  private dpr = 1;
  private animationFrames = new Map<string, number>();
  private drawingArrow: DrawingArrow | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  destroy() {
    this.animationFrames.clear();
  }

  setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setDPR(dpr: number) {
    this.dpr = dpr;
  }

  updateCamera(camera: Camera) {
    this.camera = camera;
  }

  updateLayers(layers: Layer[]) {
    this.layers = layers;
  }

  setGridVisible(visible: boolean) {
    this.gridVisible = visible;
  }

  setGameResolution(resolution: GameResolution) {
    this.gameResolution = resolution;
  }

  setPPU(ppu: number) {
    this.ppu = ppu;
  }

  setSelection(selection: Selection | null) {
    this.selection = selection;
  }

  setAssets(assets: Asset[]) {
    this.assets = assets;
  }

  setMode(mode: EditorMode) {
    this.mode = mode;
  }

  setTileBrush(brush: TileBrush) {
    this.tileBrush = brush;
  }

  setDrawingArrow(arrow: DrawingArrow | null) {
    this.drawingArrow = arrow;
  }

  render() {
    const { width, height } = this.canvas;
    const cssWidth = width / this.dpr;
    const cssHeight = height / this.dpr;

    // Clear
    this.ctx.clearRect(0, 0, cssWidth, cssHeight);
    
    // Save state
    this.ctx.save();
    
    // Center origin
    this.ctx.translate(cssWidth / 2, cssHeight / 2);
    
    // Apply camera transform or game viewport
    if (this.gameResolution.enabled) {
      // Calculate scale to fit game resolution in canvas
      const scaleX = cssWidth / this.gameResolution.width;
      const scaleY = cssHeight / this.gameResolution.height;
      const scale = Math.min(scaleX, scaleY);
      
      // Apply game viewport scaling
      this.ctx.scale(scale, scale);
      
      // Draw game viewport background
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(
        -this.gameResolution.width / 2,
        -this.gameResolution.height / 2,
        this.gameResolution.width,
        this.gameResolution.height
      );
      
      // Set up clipping region to game viewport
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(
        -this.gameResolution.width / 2,
        -this.gameResolution.height / 2,
        this.gameResolution.width,
        this.gameResolution.height
      );
      this.ctx.clip();
      
      // Apply camera panning within the game view
      this.ctx.translate(-this.camera.x, -this.camera.y);
    } else {
      // Normal editor camera
      this.ctx.scale(this.camera.zoom, this.camera.zoom);
      this.ctx.translate(-this.camera.x, -this.camera.y);
    }
    
    // Draw grid (only in editor mode)
    if (this.gridVisible && !this.gameResolution.enabled) {
      this.drawGrid();
    }
    
    // Draw layers
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      
      if (layer.type === 'tile') {
        this.drawTileLayer(layer as TileLayer);
      } else {
        this.drawObjectLayer(layer as ObjectLayer);
      }
    }
    
    // Draw selection (only in editor mode)
    if (this.selection && !this.gameResolution.enabled) {
      this.drawSelection();
    }
    
    // Draw arrow being drawn (only in editor mode)
    if (this.drawingArrow && !this.gameResolution.enabled && this.mode === 'arrow') {
      this.drawTemporaryArrow();
    }
    
    // Restore clipping if game resolution was enabled
    if (this.gameResolution.enabled) {
      this.ctx.restore();
      
      // Draw letterbox/pillarbox areas
      this.ctx.fillStyle = '#1a1d28';
      const halfWidth = this.gameResolution.width / 2;
      const halfHeight = this.gameResolution.height / 2;
      const canvasHalfWidth = cssWidth / 2;
      const canvasHalfHeight = cssHeight / 2;
      
      // Calculate scale to fit game resolution in canvas
      const scaleX = cssWidth / this.gameResolution.width;
      const scaleY = cssHeight / this.gameResolution.height;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledHalfWidth = halfWidth * scale;
      const scaledHalfHeight = halfHeight * scale;
      
      // Top letterbox
      if (scaledHalfHeight < canvasHalfHeight) {
        this.ctx.fillRect(-canvasHalfWidth, -canvasHalfHeight, cssWidth, canvasHalfHeight - scaledHalfHeight);
        // Bottom letterbox
        this.ctx.fillRect(-canvasHalfWidth, scaledHalfHeight, cssWidth, canvasHalfHeight - scaledHalfHeight);
      }
      
      // Left pillarbox
      if (scaledHalfWidth < canvasHalfWidth) {
        this.ctx.fillRect(-canvasHalfWidth, -canvasHalfHeight, canvasHalfWidth - scaledHalfWidth, cssHeight);
        // Right pillarbox
        this.ctx.fillRect(scaledHalfWidth, -canvasHalfHeight, canvasHalfWidth - scaledHalfWidth, cssHeight);
      }
    }
    
    // Restore state
    this.ctx.restore();
  }

  private drawGrid() {
    const gridSize = this.ppu;
    const viewBounds = this.getViewBounds();
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)'; // --grid color
    this.ctx.lineWidth = 1 / this.camera.zoom;
    this.ctx.beginPath();
    
    // Vertical lines
    const startX = Math.floor(viewBounds.left / gridSize) * gridSize;
    const endX = Math.ceil(viewBounds.right / gridSize) * gridSize;
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo(x, viewBounds.top);
      this.ctx.lineTo(x, viewBounds.bottom);
    }
    
    // Horizontal lines
    const startY = Math.floor(viewBounds.top / gridSize) * gridSize;
    const endY = Math.ceil(viewBounds.bottom / gridSize) * gridSize;
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(viewBounds.left, y);
      this.ctx.lineTo(viewBounds.right, y);
    }
    
    this.ctx.stroke();
    
    // Draw origin lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2 / this.camera.zoom;
    this.ctx.beginPath();
    this.ctx.moveTo(0, viewBounds.top);
    this.ctx.lineTo(0, viewBounds.bottom);
    this.ctx.moveTo(viewBounds.left, 0);
    this.ctx.lineTo(viewBounds.right, 0);
    this.ctx.stroke();
  }

  private drawGameBoundary() {
    const { width, height } = this.gameResolution;
    
    this.ctx.strokeStyle = '#ffd166'; // --outline color
    this.ctx.lineWidth = 2 / this.camera.zoom;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(-width / 2, -height / 2, width, height);
    this.ctx.setLineDash([]);
  }

  private drawTileLayer(layer: TileLayer) {
    if (layer.grid.size === 0) return;

    this.ctx.imageSmoothingEnabled = false;

    // Separate autotiles from regular tiles
    const regularTilesByTileset = new Map<string, Array<{x: number, y: number, index: number}>>();
    const autotilesByKey = new Map<string, Array<{x: number, y: number, index: number, tilesetId: string}>>();

    layer.grid.forEach((cell, key) => {
      const [x, y] = key.split(',').map(Number);

      if (cell.autotileCategory) {
        // Group autotiles by tileset+category
        const autotileKey = `${cell.tilesetId}_${cell.autotileCategory}`;
        if (!autotilesByKey.has(autotileKey)) {
          autotilesByKey.set(autotileKey, []);
        }
        autotilesByKey.get(autotileKey)!.push({ x, y, index: cell.index, tilesetId: cell.tilesetId });
      } else {
        // Regular tiles
        if (!regularTilesByTileset.has(cell.tilesetId)) {
          regularTilesByTileset.set(cell.tilesetId, []);
        }
        regularTilesByTileset.get(cell.tilesetId)!.push({ x, y, index: cell.index });
      }
    });

    // Render regular tiles grouped by tileset
    regularTilesByTileset.forEach((tiles, tilesetId) => {
      const tileset = this.assets.find(a => a.id === tilesetId);
      if (!tileset) return;

      const img = assetManager.getImage(tileset.id);
      if (!img) return;

      const meta = tileset.meta as TilesetMetadata;
      const { tileW, tileH, margin, spacing } = meta;
      const cols = Math.floor((img.width - 2 * margin + spacing) / (tileW + spacing));

      tiles.forEach(({ x, y, index }) => {
        const sourceX = margin + (index % cols) * (tileW + spacing);
        const sourceY = margin + Math.floor(index / cols) * (tileH + spacing);

        this.ctx.drawImage(
          img,
          sourceX, sourceY, tileW, tileH,
          x * this.ppu, y * this.ppu, this.ppu, this.ppu
        );
      });
    });

    // Render autotiles from generated atlases (ground/wallTop)
    // and side tiles directly from tileset (groundSide/wallSide)
    autotilesByKey.forEach((tiles, autotileKey) => {
      if (tiles.length === 0) return;

      const [tilesetId, category] = autotileKey.split('_') as [string, AutotileCategory];
      const tileset = this.assets.find(a => a.id === tilesetId);
      if (!tileset) return;

      const img = assetManager.getImage(tileset.id);
      if (!img) return;

      const meta = tileset.meta as TilesetMetadata;
      if (!meta.autotileConfig) return;

      // Side tiles (groundSide/wallSide) render directly from tileset
      if (category === 'groundSide' || category === 'wallSide') {
        const { tileW, tileH, margin, spacing } = meta;
        const cols = Math.floor((img.width - 2 * margin + spacing) / (tileW + spacing));

        tiles.forEach(({ x, y, index }) => {
          // index is already the tileset index for side tiles
          const sourceX = margin + (index % cols) * (tileW + spacing);
          const sourceY = margin + Math.floor(index / cols) * (tileH + spacing);

          this.ctx.drawImage(
            img,
            sourceX, sourceY, tileW, tileH,
            x * this.ppu, y * this.ppu, this.ppu, this.ppu
          );
        });
        return;
      }

      // Top tiles (ground/wallTop) use generated blob atlas
      const config = meta.autotileConfig[category as 'ground' | 'wallTop'];
      if (!config || !config.enabled) return;

      // Get or generate the atlas
      const atlas = getOrGenerateAtlas(
        tilesetId,
        category as 'ground' | 'wallTop',
        img,
        config,
        { x: meta.tileW, y: meta.tileH }
      );

      if (!atlas) return;

      const { canvas: atlasCanvas, tileSize, columns, blobTypeToIndices, variantSeed } = atlas;

      tiles.forEach(({ x, y, index }) => {
        // index is the BlobTileType mask - convert to atlas index (variant-aware)
        const atlasIndex = pickVariantIndex(blobTypeToIndices.get(index), x, y, variantSeed);
        const sourceX = (atlasIndex % columns) * tileSize.x;
        const sourceY = Math.floor(atlasIndex / columns) * tileSize.y;

        this.ctx.drawImage(
          atlasCanvas,
          sourceX, sourceY, tileSize.x, tileSize.y,
          x * this.ppu, y * this.ppu, this.ppu, this.ppu
        );
      });
    });
  }

  private drawObjectLayer(layer: ObjectLayer) {
    const now = Date.now();
    
    for (const obj of layer.objects) {
      if (obj.type === 'sprite') {
        this.drawSpriteObject(obj as SpritePlacedObject, layer, now);
      } else if (obj.type === 'text') {
        // Hide text in game resolution mode
        if (!this.gameResolution.enabled) {
          this.drawTextObject(obj as TextPlacedObject, layer);
        }
      } else if (obj.type === 'arrow') {
        // Hide arrows in game resolution mode
        if (!this.gameResolution.enabled) {
          this.drawArrowObject(obj as ArrowPlacedObject, layer);
        }
      }
    }
  }
  
  private drawSpriteObject(obj: SpritePlacedObject, layer: ObjectLayer, now: number) {
    const asset = this.assets.find(a => a.id === obj.assetId);
    if (!asset) return;
    
    const img = assetManager.getImage(asset.id);
    if (!img) return;
    
    this.ctx.save();
    this.ctx.translate(obj.x, obj.y);
    this.ctx.rotate(obj.rot);
    this.ctx.scale(obj.scale, obj.scale);
    
    if (asset.type === 'sprite') {
      const meta = asset.meta as any;
      const frameIndex = this.getAnimationFrame(obj.id, meta, now - obj.t);
      const col = frameIndex % meta.cols;
      const row = Math.floor(frameIndex / meta.cols);
      
      this.ctx.drawImage(
        img,
        col * meta.frameW, row * meta.frameH, meta.frameW, meta.frameH,
        -meta.frameW / 2, -meta.frameH / 2, meta.frameW, meta.frameH
      );
    } else {
      this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
    }
    
    this.ctx.restore();
    
    // Draw selection outline
    if (this.selection?.layerId === layer.id && this.selection?.objectId === obj.id) {
      this.ctx.strokeStyle = '#ffd166'; // --outline color
      this.ctx.lineWidth = 2 / this.camera.zoom;
      
      // Get actual sprite bounds
      let width = this.ppu;
      let height = this.ppu;
      
      if (asset.type === 'sprite') {
        const meta = asset.meta as any;
        width = meta.frameW * obj.scale;
        height = meta.frameH * obj.scale;
      }
      
      this.ctx.strokeRect(
        obj.x - width / 2,
        obj.y - height / 2,
        width,
        height
      );
    }
  }
  
  private drawTextObject(obj: TextPlacedObject, layer: ObjectLayer) {
    this.ctx.save();
    
    // Set text properties
    this.ctx.font = `${obj.fontSize}px monospace`;
    this.ctx.fillStyle = obj.color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw text
    this.ctx.fillText(obj.text, obj.x, obj.y);
    
    // Draw selection outline
    if (this.selection?.layerId === layer.id && this.selection?.objectId === obj.id) {
      const metrics = this.ctx.measureText(obj.text);
      const width = metrics.width;
      const height = obj.fontSize;
      
      this.ctx.strokeStyle = '#ffd166'; // --outline color
      this.ctx.lineWidth = 2 / this.camera.zoom;
      this.ctx.strokeRect(
        obj.x - width / 2,
        obj.y - height / 2,
        width,
        height
      );
    }
    
    this.ctx.restore();
  }
  
  private drawArrowObject(obj: ArrowPlacedObject, layer: ObjectLayer) {
    this.ctx.save();
    
    // Set arrow properties
    this.ctx.strokeStyle = obj.color;
    this.ctx.lineWidth = obj.strokeWidth;
    this.ctx.lineCap = 'round';
    
    // Draw arrow line
    this.ctx.beginPath();
    this.ctx.moveTo(obj.x, obj.y);
    this.ctx.lineTo(obj.endX, obj.endY);
    this.ctx.stroke();
    
    // Draw arrow head
    const angle = Math.atan2(obj.endY - obj.y, obj.endX - obj.x);
    const headLength = 10;
    
    this.ctx.beginPath();
    this.ctx.moveTo(obj.endX, obj.endY);
    this.ctx.lineTo(
      obj.endX - headLength * Math.cos(angle - Math.PI / 6),
      obj.endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(obj.endX, obj.endY);
    this.ctx.lineTo(
      obj.endX - headLength * Math.cos(angle + Math.PI / 6),
      obj.endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    
    // Draw selection outline
    if (this.selection?.layerId === layer.id && this.selection?.objectId === obj.id) {
      this.ctx.strokeStyle = '#ffd166'; // --outline color
      this.ctx.lineWidth = 2 / this.camera.zoom;
      
      // Draw selection circles at start and end points
      this.ctx.beginPath();
      this.ctx.arc(obj.x, obj.y, 5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(obj.endX, obj.endY, 5, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }
  
  private drawTemporaryArrow() {
    if (!this.drawingArrow) return;
    
    this.ctx.save();
    
    // Set temporary arrow style
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.setLineDash([5, 5]);
    
    // Draw arrow line
    this.ctx.beginPath();
    this.ctx.moveTo(this.drawingArrow.startX, this.drawingArrow.startY);
    this.ctx.lineTo(this.drawingArrow.endX, this.drawingArrow.endY);
    this.ctx.stroke();
    
    // Draw arrow head
    const angle = Math.atan2(
      this.drawingArrow.endY - this.drawingArrow.startY,
      this.drawingArrow.endX - this.drawingArrow.startX
    );
    const headLength = 10;
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.drawingArrow.endX, this.drawingArrow.endY);
    this.ctx.lineTo(
      this.drawingArrow.endX - headLength * Math.cos(angle - Math.PI / 6),
      this.drawingArrow.endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(this.drawingArrow.endX, this.drawingArrow.endY);
    this.ctx.lineTo(
      this.drawingArrow.endX - headLength * Math.cos(angle + Math.PI / 6),
      this.drawingArrow.endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private drawSelection() {
    // Selection rendering handled in drawObjectLayer
  }

  private getAnimationFrame(objId: string, meta: any, elapsed: number): number {
    const totalFrames = meta.cols * meta.rows;
    if (totalFrames <= 1) return 0;
    
    const frameDuration = meta.frameDur || 100;
    const frame = Math.floor(elapsed / frameDuration);
    
    if (meta.loop) {
      return frame % totalFrames;
    } else {
      return Math.min(frame, totalFrames - 1);
    }
  }

  private getViewBounds() {
    const halfWidth = (this.canvas.width / this.dpr) / (2 * this.camera.zoom);
    const halfHeight = (this.canvas.height / this.dpr) / (2 * this.camera.zoom);
    
    return {
      left: this.camera.x - halfWidth,
      right: this.camera.x + halfWidth,
      top: this.camera.y - halfHeight,
      bottom: this.camera.y + halfHeight
    };
  }
}
