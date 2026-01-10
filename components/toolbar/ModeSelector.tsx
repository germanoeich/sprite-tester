'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { EditorMode } from '@/types';
import { cn } from '@/lib/utils/cn';

const modes: { value: EditorMode; label: string; key: string }[] = [
  { value: 'select', label: 'Select (1)', key: '1' },
  { value: 'place', label: 'Place (2)', key: '2' },
  { value: 'erase', label: 'Erase (3)', key: '3' },
  { value: 'text', label: 'Text (4)', key: '4' },
  { value: 'arrow', label: 'Arrow (5)', key: '5' },
  { value: 'ground', label: 'Ground (6)', key: '6' },
  { value: 'walls', label: 'Walls (7)', key: '7' },
];

export const ModeSelector: FC = () => {
  const mode = useEditorStore(state => state.mode);
  const setMode = useEditorStore(state => state.setMode);

  return (
    <div className="flex gap-1 bg-[--panel] p-1 rounded-[10px] border border-[#232a3d]">
      {modes.map(({ value, label, key }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-md transition-all relative',
            mode === value
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400'
              : 'text-[--muted] hover:text-[--text] hover:bg-[rgba(255,255,255,0.05)]'
          )}
          title={`${label} (${key})`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};