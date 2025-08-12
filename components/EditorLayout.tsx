'use client';

import { FC } from 'react';
import { Toolbar } from './toolbar/Toolbar';
import { AssetsPanel } from './panels/AssetsPanel';
import { PalettePanel } from './panels/PalettePanel';
import { LayersPanel } from './panels/LayersPanel';
import { InspectorPanel } from './panels/InspectorPanel';
import { EditorCanvas } from './editor/EditorCanvas';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export const EditorLayout: FC = () => {
  useKeyboardShortcuts();
  
  return (
    <div className="h-screen grid grid-rows-[52px_1fr]">
      <Toolbar />
      
      <div className="grid grid-cols-[300px_1fr_320px] h-full">
        {/* Left Sidebar */}
        <aside className="bg-[--panel] border-r border-[#1f2535] overflow-hidden grid grid-rows-[auto_200px_1fr]">
          <AssetsPanel />
          <PalettePanel />
        </aside>
        
        {/* Main Canvas Area */}
        <main className="relative bg-[--bg] overflow-hidden">
          <EditorCanvas />
        </main>
        
        {/* Right Sidebar */}
        <aside className="bg-[--panel] border-l border-[#1f2535] overflow-hidden grid grid-rows-[auto_1fr]">
          <LayersPanel />
          <InspectorPanel />
        </aside>
      </div>
    </div>
  );
};