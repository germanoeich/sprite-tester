import { useEditorStore } from '@/lib/state/store';

/**
 * Optimized selectors for canvas components
 */

export const useEditorCanvasState = () => {
  const camera = useEditorStore(state => state.camera);
  const layers = useEditorStore(state => state.layers);
  const gridVisible = useEditorStore(state => state.gridVisible);
  const gameResolution = useEditorStore(state => state.gameResolution);
  const ppu = useEditorStore(state => state.ppu);
  const selection = useEditorStore(state => state.selection);
  const assets = useEditorStore(state => state.assets);
  const mode = useEditorStore(state => state.mode);
  const tileBrush = useEditorStore(state => state.tileBrush);
  
  return {
    camera,
    layers,
    gridVisible,
    gameResolution,
    ppu,
    selection,
    assets,
    mode,
    tileBrush
  };
};

export const usePaletteCanvasState = () => {
  const paletteCamera = useEditorStore(state => state.paletteCamera);
  const activeTilesetId = useEditorStore(state => state.activeTilesetId);
  const assets = useEditorStore(state => state.assets);
  const tileBrush = useEditorStore(state => state.tileBrush);
  const paletteDragSelect = useEditorStore(state => state.paletteDragSelect);
  
  return {
    paletteCamera,
    activeTilesetId,
    assets,
    tileBrush,
    paletteDragSelect
  };
};

export const useEditorActions = () => {
  const panCamera = useEditorStore(state => state.panCamera);
  const zoomCamera = useEditorStore(state => state.zoomCamera);
  const setTile = useEditorStore(state => state.setTile);
  const removeTile = useEditorStore(state => state.removeTile);
  const addObject = useEditorStore(state => state.addObject);
  const setSelection = useEditorStore(state => state.setSelection);
  const setPanning = useEditorStore(state => state.setPanning);
  
  return {
    panCamera,
    zoomCamera,
    setTile,
    removeTile,
    addObject,
    setSelection,
    setPanning
  };
};

export const usePaletteActions = () => {
  const panPalette = useEditorStore(state => state.panPalette);
  const zoomPalette = useEditorStore(state => state.zoomPalette);
  const setTileBrush = useEditorStore(state => state.setTileBrush);
  const setPaletteDragSelect = useEditorStore(state => state.setPaletteDragSelect);
  const setPalettePanning = useEditorStore(state => state.setPalettePanning);
  
  return {
    panPalette,
    zoomPalette,
    setTileBrush,
    setPaletteDragSelect,
    setPalettePanning
  };
};