'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { openFileDialog, fileToDataURL, loadImage } from '@/lib/utils/file';
import { generateId } from '@/lib/utils/id';
import { assetManager } from '@/lib/utils/assetManager';
import { Asset, AssetTab } from '@/types';
import { AnimatedSpritePreview } from '@/components/ui/AnimatedSpritePreview';

export const AssetsPanel: FC = () => {
  const assets = useEditorStore(state => state.assets);
  const activeAssetTab = useEditorStore(state => state.activeAssetTab);
  const selectedAssetId = useEditorStore(state => state.selectedAssetId);
  const setActiveAssetTab = useEditorStore(state => state.setActiveAssetTab);
  const setSelectedAssetId = useEditorStore(state => state.setSelectedAssetId);
  const setActiveTilesetId = useEditorStore(state => state.setActiveTilesetId);
  const addAsset = useEditorStore(state => state.addAsset);
  const removeAsset = useEditorStore(state => state.removeAsset);
  const clearTileBrush = useEditorStore(state => state.clearTileBrush);

  const handleImport = async () => {
    const files = await openFileDialog('image/*', true);
    if (!files) return;

    for (const file of files) {
      const dataURL = await fileToDataURL(file);
      const img = await loadImage(dataURL);
      
      const assetId = generateId();
      
      // Store image separately
      assetManager.setImage(assetId, img);
      
      const asset: Asset = {
        id: assetId,
        name: file.name,
        type: activeAssetTab,
        dataURL,
        img: null, // Don't store HTMLImageElement in Zustand
        meta: activeAssetTab === 'tileset' 
          ? { tileW: 16, tileH: 16, margin: 0, spacing: 0 }
          : { 
              cols: 1, 
              rows: 1, 
              frameW: Math.floor(img.width / 1), // Auto-calculate from image width and cols
              frameH: Math.floor(img.height / 1), // Auto-calculate from image height and rows
              frameDur: 100, 
              loop: true 
            }
      };
      
      addAsset(asset);
      
      if (activeAssetTab === 'tileset') {
        setActiveTilesetId(asset.id);
      }
    }
  };

  const filteredAssets = assets.filter(a => a.type === activeAssetTab);

  return (
    <div className="assets-section border-b border-[#1f2535] h-full flex flex-col">
      <div className="asset-tabs flex bg-[#121521] border-b border-[#1f2535] flex-shrink-0">
        {(['sprite', 'tileset'] as AssetTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveAssetTab(tab)}
            className={cn(
              'flex-1 px-3 py-2 bg-transparent border-none text-[--muted] font-semibold',
              'cursor-pointer border-b-2 border-transparent transition-all',
              'hover:bg-[rgba(255,255,255,0.02)]',
              activeAssetTab === tab && 'text-[--text] border-b-[--accent] bg-[rgba(122,162,255,0.08)]'
            )}
          >
            {tab === 'sprite' ? 'Sprites' : 'Tilesets'}
          </button>
        ))}
      </div>
      
      <div className="assets-container overflow-y-auto overflow-x-hidden p-3 flex-1">
        <div className="asset-list grid gap-2">
          {filteredAssets.length === 0 ? (
            <div className="empty-state text-center text-[--muted] py-4">
              No {activeAssetTab}s imported yet
            </div>
          ) : (
            filteredAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAssetId(asset.id);
                  if (asset.type === 'tileset') {
                    setActiveTilesetId(asset.id);
                  } else if (asset.type === 'sprite') {
                    // Clear tile brush when selecting a sprite
                    clearTileBrush();
                  }
                }}
                className={cn(
                  'asset-card bg-[--panel-2] border-2 border-[#2a334d] rounded-xl p-2',
                  'grid grid-cols-[44px_1fr_auto] gap-2 items-center cursor-pointer',
                  'hover:border-[#3a4768] transition-all',
                  selectedAssetId === asset.id && 'border-[--accent] bg-[--accent]/10 shadow-md'
                )}
              >
                <div className="thumb w-11 h-11 bg-[#0c0f16] rounded-lg grid place-items-center border border-dashed border-[#2b3247] overflow-hidden">
                  <AnimatedSpritePreview asset={asset} className="w-11 h-11" />
                </div>
                
                <div className="meta flex gap-2.5 items-baseline min-w-0">
                  <div className="name font-bold whitespace-nowrap overflow-hidden text-ellipsis" title={asset.name}>
                    {asset.name}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAssetId(asset.id);
                      if (asset.type === 'tileset') {
                        setActiveTilesetId(asset.id);
                      } else if (asset.type === 'sprite') {
                        // Clear tile brush when selecting a sprite
                        clearTileBrush();
                      }
                    }}
                  >
                    {asset.type === 'tileset' ? 'Use' : 'Inspect'}
                  </Button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${asset.name}? This will also remove all objects/tiles using this asset.`)) {
                        removeAsset(asset.id);
                      }
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    title="Delete asset"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <Button 
          variant="primary" 
          className="w-full mt-3"
          onClick={handleImport}
        >
          Import {activeAssetTab === 'sprite' ? 'Sprites' : 'Tilesets'}
        </Button>
      </div>
    </div>
  );
};