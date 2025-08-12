// Asset Manager to handle HTMLImageElement storage outside of Immer
class AssetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  
  setImage(assetId: string, img: HTMLImageElement) {
    this.images.set(assetId, img);
  }
  
  getImage(assetId: string): HTMLImageElement | null {
    return this.images.get(assetId) || null;
  }
  
  removeImage(assetId: string) {
    this.images.delete(assetId);
  }
  
  clear() {
    this.images.clear();
  }
}

export const assetManager = new AssetManager();