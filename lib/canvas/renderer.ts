import { Camera, Layer, TileLayer, ObjectLayer, Asset, GameResolution, Selection, EditorMode, TileBrush, TilesetMetadata } from '@/types';
import { assetManager } from '@/lib/utils/assetManager';

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
    
    // Apply camera transform
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw grid
    if (this.gridVisible) {
      this.drawGrid();
    }
    
    // Draw game resolution boundary
    if (this.gameResolution.enabled) {
      this.drawGameBoundary();
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
    
    // Draw selection
    if (this.selection) {
      this.drawSelection();
    }
    
    // Restore state
    this.ctx.restore();
  }

  private drawGrid() {
    const gridSize = this.ppu;
    const viewBounds = this.getViewBounds();
    
    this.ctx.strokeStyle = 'var(--grid)';
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
    
    this.ctx.strokeStyle = 'var(--outline)';
    this.ctx.lineWidth = 2 / this.camera.zoom;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(-width / 2, -height / 2, width, height);
    this.ctx.setLineDash([]);
  }

  private drawTileLayer(layer: TileLayer) {
    if (!layer.tilesetId || layer.grid.size === 0) return;
    
    const tileset = this.assets.find(a => a.id === layer.tilesetId);
    if (!tileset) return;
    
    const img = assetManager.getImage(tileset.id);
    if (!img) return;
    
    const meta = tileset.meta as TilesetMetadata;
    const { tileW, tileH, margin, spacing } = meta;
    const cols = Math.floor((img.width - 2 * margin + spacing) / (tileW + spacing));
    
    this.ctx.imageSmoothingEnabled = false;
    
    layer.grid.forEach((cell, key) => {
      const [x, y] = key.split(',').map(Number);
      const sourceX = margin + (cell.index % cols) * (tileW + spacing);
      const sourceY = margin + Math.floor(cell.index / cols) * (tileH + spacing);
      
      this.ctx.drawImage(
        img,
        sourceX, sourceY, tileW, tileH,
        x * this.ppu, y * this.ppu, this.ppu, this.ppu
      );
    });
  }

  private drawObjectLayer(layer: ObjectLayer) {
    const now = Date.now();
    
    for (const obj of layer.objects) {
      const asset = this.assets.find(a => a.id === obj.assetId);
      if (!asset) continue;
      
      const img = assetManager.getImage(asset.id);
      if (!img) continue;
      
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
        this.ctx.strokeStyle = 'var(--outline)';
        this.ctx.lineWidth = 2 / this.camera.zoom;
        this.ctx.strokeRect(
          obj.x - this.ppu / 2,
          obj.y - this.ppu / 2,
          this.ppu,
          this.ppu
        );
      }
    }
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