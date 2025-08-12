import { PaletteCamera, Asset, TilesetMetadata, TileBrush, PaletteDragSelect } from '@/types';
import { assetManager } from '@/lib/utils/assetManager';

export class PaletteRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: PaletteCamera = { x: 0, y: 0, zoom: 2 };
  private tileset: Asset | null = null;
  private tileBrush: TileBrush = {
    tilesetId: null,
    indices: [],
    width: 1,
    height: 1,
    originCol: 0,
    originRow: 0
  };
  private dragSelect: PaletteDragSelect | null = null;
  private dpr = 1;
  private padding = 6;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  destroy() {
    // Cleanup if needed
  }

  setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setDPR(dpr: number) {
    this.dpr = dpr;
  }

  updateCamera(camera: PaletteCamera) {
    this.camera = camera;
  }

  setTileset(tileset: Asset | null) {
    this.tileset = tileset;
  }

  setTileBrush(brush: TileBrush) {
    this.tileBrush = brush;
  }

  setDragSelect(select: PaletteDragSelect | null) {
    this.dragSelect = select;
  }

  render() {
    const { width, height } = this.canvas;
    const cssWidth = width / this.dpr;
    const cssHeight = height / this.dpr;

    // Clear
    this.ctx.clearRect(0, 0, cssWidth, cssHeight);
    
    if (!this.tileset) return;
    
    const img = assetManager.getImage(this.tileset.id);
    if (!img) return;
    
    const meta = this.tileset.meta as TilesetMetadata;
    const { tileW, tileH, margin, spacing } = meta;
    
    // Save state
    this.ctx.save();
    
    // Apply camera transform
    this.ctx.translate(this.padding + this.camera.x, this.padding + this.camera.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    
    // Draw tileset image
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(img, 0, 0);
    
    // Draw grid overlay
    this.ctx.lineWidth = 1 / this.camera.zoom;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    for (let y = margin; y + tileH <= imgHeight - margin; y += tileH + spacing) {
      for (let x = margin; x + tileW <= imgWidth - margin; x += tileW + spacing) {
        this.ctx.strokeRect(x, y, tileW, tileH);
      }
    }
    
    // Draw brush highlight
    if (this.tileBrush.tilesetId === this.tileset.id && this.tileBrush.width && this.tileBrush.height) {
      const x = margin + this.tileBrush.originCol * (tileW + spacing);
      const y = margin + this.tileBrush.originRow * (tileH + spacing);
      const w = this.tileBrush.width * tileW + (this.tileBrush.width - 1) * spacing;
      const h = this.tileBrush.height * tileH + (this.tileBrush.height - 1) * spacing;
      
      this.ctx.strokeStyle = 'var(--outline)';
      this.ctx.lineWidth = 2 / this.camera.zoom;
      this.ctx.strokeRect(x, y, w, h);
    }
    
    // Draw drag selection preview
    if (this.dragSelect) {
      const { startCol, startRow, endCol, endRow } = this.dragSelect;
      const minC = Math.min(startCol, endCol);
      const maxC = Math.max(startCol, endCol);
      const minR = Math.min(startRow, endRow);
      const maxR = Math.max(startRow, endRow);
      
      const x = margin + minC * (tileW + spacing);
      const y = margin + minR * (tileH + spacing);
      const w = (maxC - minC + 1) * tileW + (maxC - minC) * spacing;
      const h = (maxR - minR + 1) * tileH + (maxR - minR) * spacing;
      
      this.ctx.strokeStyle = 'var(--accent)';
      this.ctx.setLineDash([6, 4]);
      this.ctx.lineWidth = 2 / this.camera.zoom;
      this.ctx.strokeRect(x, y, w, h);
      this.ctx.setLineDash([]);
    }
    
    // Restore state
    this.ctx.restore();
  }
  
  getTilesetMeta(): TilesetMetadata | null {
    if (!this.tileset) return null;
    return this.tileset.meta as TilesetMetadata;
  }
  
  screenToTile(screenX: number, screenY: number): { col: number; row: number } | null {
    if (!this.tileset) return null;
    
    const img = assetManager.getImage(this.tileset.id);
    if (!img) return null;
    
    const meta = this.tileset.meta as TilesetMetadata;
    const { tileW, tileH, margin, spacing } = meta;
    
    // Convert screen to image space
    const ix = (screenX - this.padding - this.camera.x) / this.camera.zoom;
    const iy = (screenY - this.padding - this.camera.y) / this.camera.zoom;
    
    if (ix < 0 || iy < 0 || ix > img.width || iy > img.height) {
      return null;
    }
    
    const col = Math.floor((ix - margin) / (tileW + spacing));
    const row = Math.floor((iy - margin) / (tileH + spacing));
    
    if (col < 0 || row < 0) return null;
    
    const ix0 = margin + col * (tileW + spacing);
    const iy0 = margin + row * (tileH + spacing);
    
    if (ix >= ix0 && ix < ix0 + tileW && iy >= iy0 && iy < iy0 + tileH) {
      return { col, row };
    }
    
    return null;
  }
}