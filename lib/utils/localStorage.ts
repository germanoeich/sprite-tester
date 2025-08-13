import { EditorState } from '@/types';

const STORAGE_KEY = 'sprite-tester-state';
const STORAGE_VERSION = '1.0.0';

interface StoredState {
  version: string;
  timestamp: number;
  state: Partial<EditorState>;
}

export function saveToLocalStorage(state: Partial<EditorState>): boolean {
  try {
    // Convert Maps to objects for serialization
    const serializedState = {
      ...state,
      layers: state.layers?.map(layer => {
        if (layer.type === 'tile') {
          const tileLayer = layer as any;
          return {
            ...tileLayer,
            grid: Array.from(tileLayer.grid.entries())
          };
        }
        return layer;
      })
    };

    const storedData: StoredState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      state: serializedState
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

export function loadFromLocalStorage(): Partial<EditorState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const storedData: StoredState = JSON.parse(stored);
    
    // Check version compatibility
    if (storedData.version !== STORAGE_VERSION) {
      console.warn('Stored state version mismatch, clearing localStorage');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Reconstruct Maps from arrays and ensure objects have types
    const state = {
      ...storedData.state,
      layers: storedData.state.layers?.map(layer => {
        if (layer.type === 'tile') {
          const tileLayer = layer as any;
          if (Array.isArray(tileLayer.grid)) {
            return {
              ...tileLayer,
              grid: new Map(tileLayer.grid)
            };
          }
        } else if (layer.type === 'object') {
          const objLayer = layer as any;
          // Ensure all objects have a type field
          return {
            ...objLayer,
            objects: (objLayer.objects || []).map((obj: any) => {
              // If object doesn't have a type, it's a legacy sprite object
              if (!obj.type) {
                return {
                  ...obj,
                  type: 'sprite'
                };
              }
              return obj;
            })
          };
        }
        return layer;
      })
    };

    // Reconstruct asset images
    if (state.assets) {
      state.assets = state.assets.map(asset => ({
        ...asset,
        img: null // Images will be reloaded from dataURLs
      }));
    }

    return state;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

export function hasStoredState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}