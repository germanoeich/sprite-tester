export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CanvasMouseEvent {
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export interface GridSettings {
  visible: boolean;
  snap: boolean;
  sizeX: number;
  sizeY: number;
  color: string;
  opacity: number;
}