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
import { showToast } from '@/components/ui/Toast';

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
  
  const handleImport = async () => {
    const files = await openFileDialog('application/json', false);
    if (!files || files.length === 0) return;
    
    try {
      const sceneData = await importScene(files[0]);
      
      // Update state with imported data
      if (sceneData.ppu) useEditorStore.getState().setPPU(sceneData.ppu);
      if (sceneData.gameResolution) {
        useEditorStore.getState().setGameResolution(
          sceneData.gameResolution.width,
          sceneData.gameResolution.height
        );
      }
      if (sceneData.layers) {
        // Clear existing layers and add imported ones
        // This is simplified - in production you'd want to merge or replace more carefully
        sceneData.layers.forEach(layer => {
          useEditorStore.getState().addLayer(layer);
        });
      }
      
      showToast('Scene imported successfully', 'success');
    } catch (error) {
      showToast('Failed to import scene', 'error');
      console.error('Import error:', error);
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
          Reset View
        </Button>
      </div>
      
      {/* Right section - Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="primary" size="small" onClick={handleImport}>
          Import Scene
        </Button>
        <Button variant="default" size="small" onClick={handleExport}>
          Export Scene
        </Button>
      </div>
    </header>
  );
};