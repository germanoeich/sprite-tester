'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { AutotileConfigCanvas } from '../editor/AutotileConfigCanvas';
import type { AutotileConfigTab, AutotileAssignmentTool } from '@/types';

const tabs: { value: AutotileConfigTab; label: string }[] = [
  { value: 'ground', label: 'Ground' },
  { value: 'wallTop', label: 'Wall Top' },
  { value: 'wallSide', label: 'Wall Side' },
  { value: 'groundSide', label: 'Ground Side' },
];

const tools: { value: AutotileAssignmentTool; label: string; description: string }[] = [
  { value: 'rect', label: 'Rect', description: '5x4 grid pattern' },
  { value: 'cross', label: 'Cross', description: '4x4 cross pattern' },
  { value: 'single', label: 'Single', description: 'Single tile' },
];

export const AutotileConfigPanel: FC = () => {
  const { isOpen, tilesetId, activeTab, assignmentTool } = useEditorStore(
    state => state.autotileConfigPanel
  );
  const closePanel = useEditorStore(state => state.closeAutotileConfigPanel);
  const setTab = useEditorStore(state => state.setAutotileConfigTab);
  const setTool = useEditorStore(state => state.setAutotileAssignmentTool);
  const assets = useEditorStore(state => state.assets);

  if (!isOpen || !tilesetId) return null;

  const tileset = assets.find(a => a.id === tilesetId);
  if (!tileset) return null;

  return (
    <div className="absolute inset-0 bg-[--panel] z-50 grid grid-rows-[auto_1fr] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2535] bg-[#121521]">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg">Configure Autotile</h2>
          <span className="text-sm text-[--muted]">{tileset.name}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Tab selector */}
          <div className="flex items-center bg-[#0c0f16] rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setTab(tab.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-[--muted] hover:text-white hover:bg-[#1f2535]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tool selector */}
          <div className="flex items-center gap-1 bg-[#0c0f16] rounded-lg p-1">
            {tools.map(tool => (
              <button
                key={tool.value}
                onClick={() => setTool(tool.value)}
                title={tool.description}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  assignmentTool === tool.value
                    ? 'bg-green-600 text-white'
                    : 'text-[--muted] hover:text-white hover:bg-[#1f2535]'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>

          {/* Done button */}
          <button
            onClick={closePanel}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Instructions bar */}
      <div className="px-4 py-2 bg-[#0c0f16] border-b border-[#1f2535] text-sm text-[--muted]">
        {assignmentTool === 'rect' && (
          <span>Click on the tileset to set the origin of the 5x4 rect pattern (corners + edges + full tiles)</span>
        )}
        {assignmentTool === 'cross' && (
          <span>Click on the tileset to set the origin of the 4x4 cross pattern (bridges + inner corners)</span>
        )}
        {assignmentTool === 'single' && (
          <span>Click on individual tiles to assign them. Use this for corrections or custom single tiles.</span>
        )}
      </div>

      {/* Main content: tileset preview with assignment overlay */}
      <div className="relative overflow-hidden bg-[#0c0f16]">
        <AutotileConfigCanvas
          tilesetId={tilesetId}
          category={activeTab}
          tool={assignmentTool}
        />
      </div>
    </div>
  );
};
