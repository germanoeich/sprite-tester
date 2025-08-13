'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { ModeSelector } from './ModeSelector';
import { PPUControl } from './PPUControl';
import { GameResControl } from './GameResControl';
import { exportScene, importScene } from '@/lib/utils/export';
import { openFileDialog } from '@/lib/utils/file';
import { generateId } from '@/lib/utils/id';
import { showToast } from '@/components/ui/Toast';
import { assetManager } from '@/lib/utils/assetManager';

export const Toolbar: FC = () => {
  const gridVisible = useEditorStore(state => state.gridVisible);
  const snapToGrid = useEditorStore(state => state.snapToGrid);
  const toggleGrid = useEditorStore(state => state.toggleGrid);
  const toggleSnapToGrid = useEditorStore(state => state.toggleSnapToGrid);
  const resetCamera = useEditorStore(state => state.resetCamera);
  
  // Get full state for export
  const state = useEditorStore();
  
  const handleExport = () => {
    exportScene(state);
    showToast('Scene exported successfully', 'success');
  };
  
  const loadSceneData = async (sceneData: any) => {
    const store = useEditorStore.getState();
    
    // Clear existing assets first
    const currentAssets = [...useEditorStore.getState().assets];
    currentAssets.forEach((asset: any) => {
      assetManager.removeImage(asset.id);
      store.removeAsset(asset.id);
    });
    
    // Clear existing layers
    const currentLayers = [...useEditorStore.getState().layers];
    currentLayers.forEach((layer: any) => {
      store.removeLayer(layer.id);
    });
    
    // Update state with imported data
    if (sceneData.ppu) store.setPPU(sceneData.ppu);
    if (sceneData.gameResolution) {
      store.setGameResolution(
        sceneData.gameResolution.width,
        sceneData.gameResolution.height
      );
    }
    
    // Add imported assets and track first tileset
    let firstTilesetId: string | null = null;
    if (sceneData.assets) {
      sceneData.assets.forEach((asset: any) => {
        // Store the image in assetManager (this is critical for rendering!)
        if (asset.img) {
          assetManager.setImage(asset.id, asset.img);
        }
        // addAsset will set img to null but keeps the dataURL
        store.addAsset(asset);
        // After adding, update with the actual img
        store.updateAsset(asset.id, { img: asset.img });
        
        // Track the first tileset
        if (!firstTilesetId && asset.type === 'tileset') {
          firstTilesetId = asset.id;
        }
      });
    }
    
    // Add imported layers (they already have proper structure from importScene)
    if (sceneData.layers) {
      sceneData.layers.forEach((layer: any) => {
        store.addLayer(layer);
      });
    }
    
    // Select the first tileset if available so the palette is not empty
    if (firstTilesetId) {
      store.setActiveTilesetId(firstTilesetId);
      store.setSelectedAssetId(firstTilesetId);
    }
  };

  const handleImport = async () => {
    const files = await openFileDialog('application/json', false);
    if (!files || files.length === 0) return;
    
    try {
      const sceneData = await importScene(files[0]);
      await loadSceneData(sceneData);
      showToast('Scene imported successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to import scene: ${errorMessage}`, 'error');
      console.error('Import error:', error);
    }
  };

  const handleLoadExample = async () => {
    try {
      // Fetch the example scene from the public folder
      const response = await fetch('/examples/example-scene.json');
      if (!response.ok) {
        throw new Error('Failed to load example scene');
      }
      const text = await response.text();
      const file = new File([text], 'example-scene.json', { type: 'application/json' });
      const sceneData = await importScene(file);
      await loadSceneData(sceneData);
      showToast('Example scene loaded successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Failed to load example: ${errorMessage}`, 'error');
      console.error('Load example error:', error);
    }
  };

  return (
    <header className="toolbar grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 bg-gradient-to-b from-[#0f121a] to-[#0b0d12] border-b border-[#1f2535]">
      {/* Left section - Brand */}
      <div className="brand">
        Sprite Tester <small className="text-[--muted] font-medium">v2</small>
      </div>
      
      {/* Center section - Controls */}
      <div className="controls flex gap-2 items-center justify-center">
        <ModeSelector />
        
        <div className="group bg-[--panel] px-2 py-1.5 rounded-[10px] border border-[#232a3d] flex gap-1.5 items-center">
          <label className="text-[--muted] text-xs">Grid</label>
          <input 
            type="checkbox" 
            checked={gridVisible}
            onChange={toggleGrid}
            className="translate-y-[1px]"
          />
        </div>
        
        <div className="group bg-[--panel] px-2 py-1.5 rounded-[10px] border border-[#232a3d] flex gap-1.5 items-center">
          <label className="text-[--muted] text-xs">Snap</label>
          <input 
            type="checkbox" 
            checked={snapToGrid}
            onChange={toggleSnapToGrid}
            className="translate-y-[1px]"
          />
        </div>
        
        <PPUControl />
        <GameResControl />
        
        <Button variant="ghost" size="small" onClick={resetCamera}>
          Reset View (R)
        </Button>
      </div>
      
      {/* Right section - Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="primary" size="small" onClick={handleImport}>
          Import Scene
        </Button>
        <Button variant="primary" size="small" onClick={handleLoadExample}>
          Load Example
        </Button>
        <Button variant="default" size="small" onClick={handleExport}>
          Export Scene
        </Button>
      </div>
    </header>
  );
};