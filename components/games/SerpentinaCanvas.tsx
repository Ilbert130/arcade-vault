"use client";
import { createSerpentinaGame } from "@/lib/games/serpentina/engine";
import type { GameRenderProps } from "@/lib/games/platform/contract";
import { useGameCanvas } from "@/components/games/useGameCanvas";
export default function SerpentinaCanvas(props: GameRenderProps) {
  const canvasRef = useGameCanvas(createSerpentinaGame, props);
  return (
    <canvas
      ref={canvasRef}
      className="serpentina-canvas"
      aria-label="SERPENTINA: campo de juego"
    />
  );
}
