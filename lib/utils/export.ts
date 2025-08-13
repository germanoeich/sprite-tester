import { EditorState, Layer, TileLayer, ObjectLayer, Asset } from '@/types';
import { downloadJSON } from './file';

interface ExportedScene {
  version: string;
  ppu: number;
  gameResolution: {
    width: number;
    height: number;
  };
  layers: ExportedLayer[];
  assets: ExportedAsset[]; // Full asset data
}

interface ExportedAsset {
  id: string;
  name: string;
  type: 'sprite' | 'tileset';
  dataURL: string;
  meta: any;
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
      width: state.gameResolution?.width || 480,
      height: state.gameResolution?.height || 270
    },
    layers: [],
    assets: []
  };
  
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
        
        // Convert Map to object
        const gridData: Record<string, any> = {};
        tileLayer.grid.forEach((value, key) => {
          gridData[key] = value;
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
      }
      
      return exportedLayer;
    });
  }
  
  // Export ALL assets, not just referenced ones
  if (state.assets) {
    scene.assets = state.assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      dataURL: asset.dataURL,
      meta: asset.meta
    }));
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  downloadJSON(scene, `scene-${timestamp}.json`);
}

export async function importScene(file: File): Promise<Partial<EditorState>> {
  const text = await file.text();
  let scene: ExportedScene;
  
  try {
    scene = JSON.parse(text) as ExportedScene;
  } catch (e) {
    throw new Error(`Invalid JSON file: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  
  if (!scene.version || !scene.layers) {
    throw new Error('Invalid scene file format - missing required fields');
  }
  
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
  
  // Process assets - create HTMLImageElement for each
  const assets: Asset[] = [];
  
  // Handle both old format (array of IDs) and new format (array of asset objects)
  const assetData = scene.assets || [];
  
  for (const item of assetData) {
    // Skip if this is just an ID string (old format) or invalid data
    if (typeof item === 'string' || !item) {
      console.warn('Skipping invalid or legacy asset format');
      continue;
    }
    
    const exportedAsset = item as ExportedAsset;
    
    // Validate required fields
    if (!exportedAsset.id || !exportedAsset.dataURL || !exportedAsset.name) {
      console.warn(`Skipping invalid asset: missing required fields`, exportedAsset);
      continue;
    }
    
    // Skip assets with undefined or invalid dataURL
    if (exportedAsset.dataURL === 'undefined' || !exportedAsset.dataURL.startsWith('data:')) {
      console.warn(`Skipping asset ${exportedAsset.name}: invalid dataURL`);
      continue;
    }
    
    try {
      const img = new Image();
      img.src = exportedAsset.dataURL;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image for asset: ${exportedAsset.name}`));
      });
      
      assets.push({
        id: exportedAsset.id,
        name: exportedAsset.name,
        type: exportedAsset.type || 'sprite',
        dataURL: exportedAsset.dataURL,
        img,
        meta: exportedAsset.meta || {}
      } as Asset);
    } catch (e) {
      console.warn(`Failed to load asset ${exportedAsset.name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      // Still add the asset but with null img - it can be re-loaded later
      assets.push({
        id: exportedAsset.id,
        name: exportedAsset.name,
        type: exportedAsset.type || 'sprite',
        dataURL: exportedAsset.dataURL,
        img: null,
        meta: exportedAsset.meta || {}
      } as Asset);
    }
  }
  
  return {
    ppu: scene.ppu,
    gameResolution: {
      enabled: false,
      width: scene.gameResolution.width,
      height: scene.gameResolution.height
    },
    layers,
    assets
  };
}