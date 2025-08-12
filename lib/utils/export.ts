import { EditorState, Layer, TileLayer, ObjectLayer } from '@/types';
import { downloadJSON } from './file';

interface ExportedScene {
  version: string;
  ppu: number;
  gameResolution: {
    width: number;
    height: number;
  };
  layers: ExportedLayer[];
  assets: string[]; // Asset IDs that are referenced
}

interface ExportedLayer {
  id: string;
  name: string;
  type: 'tile' | 'object';
  visible: boolean;
  locked: boolean;
  data: any;
}

export function exportScene(state: Partial<EditorState>) {
  const scene: ExportedScene = {
    version: '1.0.0',
    ppu: state.ppu || 16,
    gameResolution: {
      width: state.gameResolution?.width || 320,
      height: state.gameResolution?.height || 240
    },
    layers: [],
    assets: []
  };
  
  const assetIds = new Set<string>();
  
  if (state.layers) {
    scene.layers = state.layers.map(layer => {
      const exportedLayer: ExportedLayer = {
        id: layer.id,
        name: layer.name,
        type: layer.type,
        visible: layer.visible,
        locked: layer.locked,
        data: {}
      };
      
      if (layer.type === 'tile') {
        const tileLayer = layer as TileLayer;
        if (tileLayer.tilesetId) {
          assetIds.add(tileLayer.tilesetId);
        }
        
        // Convert Map to object
        const gridData: Record<string, any> = {};
        tileLayer.grid.forEach((value, key) => {
          gridData[key] = value;
          if (value.tilesetId) {
            assetIds.add(value.tilesetId);
          }
        });
        
        exportedLayer.data = {
          tilesetId: tileLayer.tilesetId,
          grid: gridData
        };
      } else {
        const objectLayer = layer as ObjectLayer;
        exportedLayer.data = {
          objects: objectLayer.objects
        };
        
        // Collect asset IDs from objects
        objectLayer.objects.forEach(obj => {
          assetIds.add(obj.assetId);
        });
      }
      
      return exportedLayer;
    });
  }
  
  scene.assets = Array.from(assetIds);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  downloadJSON(scene, `scene-${timestamp}.json`);
}

export async function importScene(file: File): Promise<Partial<EditorState>> {
  const text = await file.text();
  const scene = JSON.parse(text) as ExportedScene;
  
  const layers: Layer[] = scene.layers.map(layer => {
    if (layer.type === 'tile') {
      const grid = new Map<string, any>();
      Object.entries(layer.data.grid || {}).forEach(([key, value]) => {
        grid.set(key, value);
      });
      
      return {
        id: layer.id,
        name: layer.name,
        type: 'tile',
        visible: layer.visible,
        locked: layer.locked,
        tilesetId: layer.data.tilesetId,
        grid
      } as TileLayer;
    } else {
      return {
        id: layer.id,
        name: layer.name,
        type: 'object',
        visible: layer.visible,
        locked: layer.locked,
        objects: layer.data.objects || []
      } as ObjectLayer;
    }
  });
  
  return {
    ppu: scene.ppu,
    gameResolution: {
      enabled: false,
      width: scene.gameResolution.width,
      height: scene.gameResolution.height
    },
    layers
  };
}