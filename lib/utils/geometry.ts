import { Point, Rectangle } from '@/types/canvas';

export function pointInRect(point: Point, rect: Rectangle): boolean {
  return point.x >= rect.x && 
         point.x < rect.x + rect.width &&
         point.y >= rect.y && 
         point.y < rect.y + rect.height;
}

export function rectsIntersect(a: Rectangle, b: Rectangle): boolean {
  return !(a.x + a.width <= b.x || 
           b.x + b.width <= a.x || 
           a.y + a.height <= b.y || 
           b.y + b.height <= a.y);
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function worldToScreen(worldX: number, worldY: number, camera: { x: number, y: number, zoom: number }): Point {
  return {
    x: (worldX - camera.x) * camera.zoom,
    y: (worldY - camera.y) * camera.zoom
  };
}

export function screenToWorld(screenX: number, screenY: number, camera: { x: number, y: number, zoom: number }): Point {
  return {
    x: screenX / camera.zoom + camera.x,
    y: screenY / camera.zoom + camera.y
  };
}

export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}