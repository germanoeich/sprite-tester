'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { EditorMode } from '@/types';
import { cn } from '@/lib/utils/cn';

const modes: { value: EditorMode; label: string; key: string }[] = [
  { value: 'select', label: 'Select', key: '1' },
  { value: 'tile', label: 'Tile', key: '2' },
  { value: 'placeSprite', label: 'Place', key: '3' },
  { value: 'erase', label: 'Erase', key: '4' },
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
            'px-3 py-1 text-xs font-semibold rounded-md transition-all',
            mode === value
              ? 'bg-[--accent] text-white'
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