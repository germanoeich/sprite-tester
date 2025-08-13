import { useEffect } from 'react';
import { useEditorStore } from '@/lib/state/store';

export function useKeyboardShortcuts() {
  const setMode = useEditorStore(state => state.setMode);
  const toggleGameResolution = useEditorStore(state => state.toggleGameResolution);
  const resetCamera = useEditorStore(state => state.resetCamera);
  const toggleGrid = useEditorStore(state => state.toggleGrid);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if input is focused
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case '1':
          setMode('select');
          break;
        case '2':
          setMode('place');
          break;
        case '3':
          setMode('erase');
          break;
        case 'g':
        case 'G':
          if (!e.ctrlKey && !e.metaKey) {
            toggleGameResolution();
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            resetCamera();
          }
          break;
        case 'h':
        case 'H':
          if (!e.ctrlKey && !e.metaKey) {
            toggleGrid();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}