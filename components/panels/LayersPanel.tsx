'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { generateId } from '@/lib/utils/id';
import { Layer, TileLayer, ObjectLayer } from '@/types';

export const LayersPanel: FC = () => {
  const layers = useEditorStore(state => state.layers);
  const selection = useEditorStore(state => state.selection);
  const addLayer = useEditorStore(state => state.addLayer);
  const removeLayer = useEditorStore(state => state.removeLayer);
  const moveLayer = useEditorStore(state => state.moveLayer);
  const setLayerVisibility = useEditorStore(state => state.setLayerVisibility);
  const setLayerLocked = useEditorStore(state => state.setLayerLocked);
  const setSelection = useEditorStore(state => state.setSelection);

  const handleAddTileLayer = () => {
    const layer: TileLayer = {
      id: generateId(),
      name: `Tile Layer ${layers.filter(l => l.type === 'tile').length + 1}`,
      type: 'tile',
      visible: true,
      locked: false,
      tilesetId: null,
      grid: new Map()
    };
    addLayer(layer);
  };

  const handleAddObjectLayer = () => {
    const layer: ObjectLayer = {
      id: generateId(),
      name: `Object Layer ${layers.filter(l => l.type === 'object').length + 1}`,
      type: 'object',
      visible: true,
      locked: false,
      objects: []
    };
    addLayer(layer);
  };

  return (
    <div className="layers-section">
      <div className="section-header px-3 py-2.5 font-bold bg-[#121521] border-b border-[#1f2535] sticky top-0 z-[2] flex justify-between items-center">
        <span>Layers</span>
        <div className="flex gap-1">
          <Button size="small" onClick={handleAddTileLayer}>+ Tile</Button>
          <Button size="small" onClick={handleAddObjectLayer}>+ Object</Button>
        </div>
      </div>
      
      <div className="layers p-3 overflow-y-auto">
        <div className="layer-list grid gap-2">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={cn(
                'layer-card bg-[--panel-2] border border-[#2a334d] rounded-xl p-2',
                'grid grid-cols-[auto_1fr_auto] gap-2 items-center',
                'hover:border-[#3a4768]',
                selection?.layerId === layer.id && 'border-[--accent]'
              )}
            >
              <div className="flex gap-1">
                <button
                  onClick={() => setLayerVisibility(layer.id, !layer.visible)}
                  className={cn(
                    'w-6 h-6 rounded text-xs',
                    layer.visible ? 'bg-[--ok] text-white' : 'bg-[#2a334d] text-[--muted]'
                  )}
                >
                  {layer.visible ? '👁' : '—'}
                </button>
                <button
                  onClick={() => setLayerLocked(layer.id, !layer.locked)}
                  className={cn(
                    'w-6 h-6 rounded text-xs',
                    layer.locked ? 'bg-[--danger] text-white' : 'bg-[#2a334d] text-[--muted]'
                  )}
                >
                  {layer.locked ? '🔒' : '—'}
                </button>
              </div>
              
              <div className="flex flex-col">
                <div className="font-semibold text-sm">{layer.name}</div>
                <div className="text-xs text-[--muted]">
                  {layer.type === 'tile' ? 'Tile Layer' : 'Object Layer'}
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => moveLayer(layer.id, 'up')}
                  disabled={index === 0}
                  className="w-6 h-6 rounded bg-[#2a334d] text-[--muted] hover:bg-[#3a4768] disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLayer(layer.id, 'down')}
                  disabled={index === layers.length - 1}
                  className="w-6 h-6 rounded bg-[#2a334d] text-[--muted] hover:bg-[#3a4768] disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeLayer(layer.id)}
                  className="w-6 h-6 rounded bg-[--danger] text-white hover:bg-[#ff6480]"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};