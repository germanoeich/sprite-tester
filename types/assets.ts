export interface AssetImportOptions {
  name: string;
  type: 'sprite' | 'tileset';
  file: File;
}

export interface SpriteFrameData {
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number;
}

export interface TilesetSliceData {
  tileWidth: number;
  tileHeight: number;
  margin: number;
  spacing: number;
}

export interface AnimationFrame {
  index: number;
  duration: number;
}

export interface AnimationSequence {
  name: string;
  frames: AnimationFrame[];
  loop: boolean;
}