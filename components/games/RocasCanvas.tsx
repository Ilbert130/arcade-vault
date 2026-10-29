"use client";
import { createRocasGame } from "@/lib/games/rocas/engine";
import type { GameRenderProps } from "@/lib/games/platform/contract";
import { useGameCanvas } from "@/components/games/useGameCanvas";
export default function RocasCanvas(props: GameRenderProps) {
  const canvasRef = useGameCanvas(createRocasGame, props);
  return (
    <canvas
      ref={canvasRef}
      className="rocas-canvas"
      aria-label="ROCAS: campo de asteroides"
    />
  );
}
