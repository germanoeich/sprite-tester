'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';

export const PPUControl: FC = () => {
  const ppu = useEditorStore(state => state.ppu);
  const setPPU = useEditorStore(state => state.setPPU);

  return (
    <div className="group bg-[--panel] px-2 py-1.5 rounded-[10px] border border-[#232a3d] flex gap-1.5 items-center">
      <label className="text-[--muted] text-xs">PPU</label>
      <input
        type="number"
        value={ppu}
        onChange={(e) => setPPU(parseInt(e.target.value) || 1)}
        min={1}
        max={64}
        className="w-[72px] bg-[--panel-2] border border-[#2a334d] text-[--text] px-2 py-1.5 rounded-lg text-xs"
      />
    </div>
  );
};