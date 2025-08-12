'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { Field } from '@/components/ui/Field';
import { assetManager } from '@/lib/utils/assetManager';

export const InspectorPanel: FC = () => {
  const selectedAssetId = useEditorStore(state => state.selectedAssetId);
  const selection = useEditorStore(state => state.selection);
  const assets = useEditorStore(state => state.assets);
  const layers = useEditorStore(state => state.layers);
  const updateAsset = useEditorStore(state => state.updateAsset);
  
  const selectedAsset = assets.find(a => a.id === selectedAssetId);

  const renderAssetInspector = () => {
    if (!selectedAsset) {
      return <div className="text-[--muted] text-sm">No asset selected</div>;
    }

    if (selectedAsset.type === 'tileset') {
      const meta = selectedAsset.meta as any;
      return (
        <div className="grid gap-3">
          <h3 className="font-semibold">Tileset Properties</h3>
          <Field
            label="Tile Width"
            type="number"
            value={meta.tileW || 16}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, tileW: parseInt(e.target.value) || 16 }
            })}
          />
          <Field
            label="Tile Height"
            type="number"
            value={meta.tileH || 16}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, tileH: parseInt(e.target.value) || 16 }
            })}
          />
          <Field
            label="Margin"
            type="number"
            value={meta.margin || 0}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, margin: parseInt(e.target.value) || 0 }
            })}
          />
          <Field
            label="Spacing"
            type="number"
            value={meta.spacing || 0}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, spacing: parseInt(e.target.value) || 0 }
            })}
          />
        </div>
      );
    } else {
      const meta = selectedAsset.meta as any;
      return (
        <div className="grid gap-3">
          <h3 className="font-semibold">Sprite Properties</h3>
          <Field
            label="Frame Width"
            type="number"
            value={meta.frameW || 16}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, frameW: parseInt(e.target.value) || 16 }
            })}
          />
          <Field
            label="Frame Height"
            type="number"
            value={meta.frameH || 16}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, frameH: parseInt(e.target.value) || 16 }
            })}
          />
          <Field
            label="Columns"
            type="number"
            value={meta.cols || 1}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, cols: parseInt(e.target.value) || 1 }
            })}
          />
          <Field
            label="Rows"
            type="number"
            value={meta.rows || 1}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, rows: parseInt(e.target.value) || 1 }
            })}
          />
          <Field
            label="Frame Duration"
            type="number"
            value={meta.frameDur || 100}
            onChange={(e) => updateAsset(selectedAsset.id, {
              meta: { ...meta, frameDur: parseInt(e.target.value) || 100 }
            })}
          />
          <div className="flex items-center gap-2">
            <label className="text-[--muted] text-xs">Loop</label>
            <input
              type="checkbox"
              checked={meta.loop ?? true}
              onChange={(e) => updateAsset(selectedAsset.id, {
                meta: { ...meta, loop: e.target.checked }
              })}
            />
          </div>
        </div>
      );
    }
  };

  const renderObjectInspector = () => {
    if (!selection) {
      return <div className="text-[--muted] text-sm">No object selected</div>;
    }

    const layer = layers.find(l => l.id === selection.layerId);
    if (!layer || layer.type !== 'object') {
      return <div className="text-[--muted] text-sm">Invalid selection</div>;
    }

    const object = (layer as any).objects.find((o: any) => o.id === selection.objectId);
    if (!object) {
      return <div className="text-[--muted] text-sm">Object not found</div>;
    }

    return (
      <div className="grid gap-3">
        <h3 className="font-semibold">Object Properties</h3>
        <Field label="X" type="number" value={object.x} disabled />
        <Field label="Y" type="number" value={object.y} disabled />
        <Field label="Scale" type="number" value={object.scale} disabled />
        <Field label="Rotation" type="number" value={object.rot} disabled />
      </div>
    );
  };

  return (
    <div className="inspector-section overflow-hidden">
      <div className="section-header px-3 py-2.5 font-bold bg-[#121521] border-b border-[#1f2535] sticky top-0 z-[2]">
        Inspector
      </div>
      
      <div className="inspector p-3 overflow-y-auto">
        {selection ? renderObjectInspector() : renderAssetInspector()}
      </div>
    </div>
  );
};