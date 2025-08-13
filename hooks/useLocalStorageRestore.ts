import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { loadFromLocalStorage } from '@/lib/utils/localStorage';
import { assetManager } from '@/lib/utils/assetManager';
import { showToast } from '@/components/ui/Toast';

export function useLocalStorageRestore() {
  const hasRestored = useRef(false);
  
  useEffect(() => {
    // Only restore once
    if (hasRestored.current) return;
    hasRestored.current = true;
    
    const restoreState = async () => {
      try {
        const storedState = loadFromLocalStorage();
        if (!storedState) return;
        
        const store = useEditorStore.getState();
        
        // Restore basic settings
        if (storedState.ppu !== undefined) store.setPPU(storedState.ppu);
        if (storedState.gridVisible !== undefined) {
          if (storedState.gridVisible !== store.gridVisible) {
            store.toggleGrid();
          }
        }
        if (storedState.snapToGrid !== undefined) {
          if (storedState.snapToGrid !== store.snapToGrid) {
            store.toggleSnapToGrid();
          }
        }
        if (storedState.gameResolution) {
          store.setGameResolution(
            storedState.gameResolution.width,
            storedState.gameResolution.height
          );
        }
        
        // Restore camera
        if (storedState.camera) {
          store.setCameraPosition(storedState.camera.x, storedState.camera.y);
          store.setCameraZoom(storedState.camera.zoom);
        }
        
        // Restore text and arrow settings
        if (storedState.textSettings) {
          store.setTextSettings(storedState.textSettings);
        }
        if (storedState.arrowSettings) {
          store.setArrowSettings(storedState.arrowSettings);
        }
        
        // Clear existing assets and layers
        const currentAssets = [...store.assets];
        currentAssets.forEach(asset => {
          assetManager.removeImage(asset.id);
          store.removeAsset(asset.id);
        });
        
        const currentLayers = [...store.layers];
        currentLayers.forEach(layer => {
          store.removeLayer(layer.id);
        });
        
        // Restore assets with images
        if (storedState.assets) {
          for (const asset of storedState.assets) {
            if (asset.dataURL && asset.dataURL !== 'undefined' && asset.dataURL.startsWith('data:')) {
              try {
                const img = new Image();
                img.src = asset.dataURL;
                
                await new Promise<void>((resolve, reject) => {
                  img.onload = () => resolve();
                  img.onerror = () => reject(new Error(`Failed to load image for asset: ${asset.name}`));
                });
                
                // Store the image in assetManager
                assetManager.setImage(asset.id, img);
                
                // Add asset to store with image
                store.addAsset(asset);
                store.updateAsset(asset.id, { img });
              } catch (error) {
                console.warn(`Failed to restore asset ${asset.name}:`, error);
                // Still add the asset but without the image
                store.addAsset(asset);
              }
            }
          }
        }
        
        // Restore layers
        if (storedState.layers) {
          storedState.layers.forEach(layer => {
            store.addLayer(layer);
          });
        }
        
        showToast('Session restored from browser storage', 'success');
      } catch (error) {
        console.error('Failed to restore from localStorage:', error);
        showToast('Failed to restore previous session', 'error');
      }
    };
    
    // Restore after a short delay to ensure app is initialized
    setTimeout(restoreState, 100);
  }, []);
}