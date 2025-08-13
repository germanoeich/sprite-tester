'use client';

import { FC } from 'react';
import { useEditorStore } from '@/lib/state/store';
import { cn } from '@/lib/utils/cn';

export const GameResControl: FC = () => {
  const gameResolution = useEditorStore(state => state.gameResolution);
  const toggleGameResolution = useEditorStore(state => state.toggleGameResolution);
  const setGameResolution = useEditorStore(state => state.setGameResolution);

  return (
    <div className={cn(
      "group bg-[--panel] px-2 py-1.5 rounded-[10px] border border-[#232a3d] flex gap-1.5 items-center transition-all",
      gameResolution.enabled && "bg-[rgba(122,162,255,0.15)] border-[--accent]"
    )}>
      <label className="text-[--muted] text-xs">Game Res</label>
      <input 
        type="checkbox" 
        checked={gameResolution.enabled}
        onChange={toggleGameResolution}
        className="translate-y-[1px]"
      />
      <input
        type="number"
        value={gameResolution.width}
        onChange={(e) => setGameResolution(parseInt(e.target.value) || 480, gameResolution.height)}
        disabled={!gameResolution.enabled}
        className="w-[48px] bg-[--panel-2] border border-[#2a334d] text-[--text] px-1 py-1 rounded text-xs disabled:opacity-50"
      />
      <span className="text-[--muted] text-xs">×</span>
      <input
        type="number"
        value={gameResolution.height}
        onChange={(e) => setGameResolution(gameResolution.width, parseInt(e.target.value) || 270)}
        disabled={!gameResolution.enabled}
        className="w-[48px] bg-[--panel-2] border border-[#2a334d] text-[--text] px-1 py-1 rounded text-xs disabled:opacity-50"
      />
    </div>
  );
};