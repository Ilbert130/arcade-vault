import type { SkinId } from "@/lib/games/platform/skins";
export type CaidaHud = {
  score: number;
  lines: number;
  level: number;
};
export type CaidaCallbacks = {
  /** Se llama solo cuando cambia score, lines o level (no en cada frame). */
  onHud: (hud: CaidaHud) => void;
  /** Se llama una vez cuando la pieza nueva colisiona al aparecer. */
  onGameOver: (finalScore: number) => void;
};
export type CaidaGame = {
  start: () => void; // inicia la partida desde cero y el bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial (score 0, lines 0, level 1) sin arrancar
  destroy: () => void; // cancela rAF y elimina listeners de teclado
  setSkin: (id: SkinId) => void; // cambia la skin (solo cosmética) y redibuja el frame actual
  press: (action: string) => void; // = keydown de la acción; desconocidas se ignoran
  release: (action: string) => void; // = keyup de la acción
  releaseAll: () => void; // suelta todas las acciones mantenidas
};
/** Acciones de entrada del motor (teclado y mando táctil). */
export type CaidaAction =
  "moveLeft" | "moveRight" | "softDrop" | "rotate" | "hardDrop";
/** Matriz de celdas: 0 = vacío, 1–8 = índice de color/pieza (I, O, T, S, Z, J, L, N). */
export type Matrix = number[][];
/** Tablero ROWS×COLS con las celdas ya fijadas. */
export type Board = Matrix;
export type Piece = {
  type: number; // 1–8
  shape: Matrix;
  x: number; // columna de la esquina superior izquierda de `shape`
  y: number; // fila de la esquina superior izquierda de `shape`
};
