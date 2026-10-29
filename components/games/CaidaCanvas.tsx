"use client";
import { createCaidaGame } from "@/lib/games/caida/engine";
import type { GameRenderProps } from "@/lib/games/platform/contract";
import { useGameCanvas } from "@/components/games/useGameCanvas";
export default function CaidaCanvas(props: GameRenderProps) {
  const canvasRef = useGameCanvas(createCaidaGame, props);
  return (
    <canvas
      ref={canvasRef}
      className="caida-canvas"
      aria-label="CAÍDA: tablero de piezas"
    />
  );
}
