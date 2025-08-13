'use client';

import { FC, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { PaletteCanvas } from '../editor/PaletteCanvas';

export const PalettePanel: FC = () => {
  const activeTilesetId = useEditorStore(state => state.activeTilesetId);
  const assets = useEditorStore(state => state.assets);
  const activeTileset = assets.find(a => a.id === activeTilesetId);

  return (
    <div className="palette-section grid grid-rows-[auto_1fr] overflow-hidden h-full">
      <div className="section-header px-3 py-2.5 font-bold bg-[#121521] border-b border-[#1f2535] sticky top-0 z-[2]">
        Palette
      </div>
      
      <div className="palette p-3 overflow-hidden flex flex-col">
        <div className="palette-info text-xs text-[--muted] mb-2">
          {activeTileset 
            ? `${activeTileset.name} • Tileset loaded`
            : 'No tileset selected'
          }
        </div>
        
        <div className="tilesetPreview bg-[#0c0f16] rounded-lg border border-dashed border-[#2b3247] flex-1 overflow-hidden relative min-h-[100px]">
          <PaletteCanvas />
        </div>
      </div>
    </div>
  );
};