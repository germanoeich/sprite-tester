'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Asset } from '@/types';
import { assetManager } from '@/lib/utils/assetManager';

interface AnimatedSpritePreviewProps {
  asset: Asset;
  className?: string;
}

export const AnimatedSpritePreview: FC<AnimatedSpritePreviewProps> = ({ asset, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = assetManager.getImage(asset.id);
    if (!img) return;

    if (asset.type === 'tileset') {
      // For tilesets, just draw the whole image
      canvas.width = 44;
      canvas.height = 44;
      ctx.imageSmoothingEnabled = false;
      const scale = Math.min(44 / img.width, 44 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (44 - w) / 2, (44 - h) / 2, w, h);
      return;
    }

    // For sprites, animate through frames
    const meta = asset.meta as any;
    const frameW = meta.frameW || 16;
    const frameH = meta.frameH || 16;
    const cols = meta.cols || 1;
    const rows = meta.rows || 1;
    const frameDur = meta.frameDur || 100;
    const loop = meta.loop ?? true;
    const totalFrames = cols * rows;

    // Set canvas size to fit frame
    canvas.width = 44;
    canvas.height = 44;
    ctx.imageSmoothingEnabled = false;

    const animate = (time: number) => {
      const elapsed = time - lastTimeRef.current;
      
      if (elapsed >= frameDur) {
        lastTimeRef.current = time;
        
        // Update frame
        if (loop) {
          currentFrameRef.current = (currentFrameRef.current + 1) % totalFrames;
        } else {
          currentFrameRef.current = Math.min(currentFrameRef.current + 1, totalFrames - 1);
        }

        // Clear and draw current frame
        ctx.clearRect(0, 0, 44, 44);
        
        const frameIndex = currentFrameRef.current;
        const col = frameIndex % cols;
        const row = Math.floor(frameIndex / cols);
        
        const scale = Math.min(44 / frameW, 44 / frameH);
        const w = frameW * scale;
        const h = frameH * scale;
        
        ctx.drawImage(
          img,
          col * frameW, row * frameH, frameW, frameH,
          (44 - w) / 2, (44 - h) / 2, w, h
        );
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    if (totalFrames > 1) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Single frame sprite
      ctx.clearRect(0, 0, 44, 44);
      const scale = Math.min(44 / frameW, 44 / frameH);
      const w = frameW * scale;
      const h = frameH * scale;
      ctx.drawImage(
        img,
        0, 0, frameW, frameH,
        (44 - w) / 2, (44 - h) / 2, w, h
      );
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [asset]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};