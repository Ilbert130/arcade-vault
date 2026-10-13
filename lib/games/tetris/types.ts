export type TetrisHud = {
  score: number;
  lines: number;
  level: number;
};
export type TetrisCallbacks = {
  /** Se llama solo cuando cambia score, lines o level (no en cada frame). */
  onHud: (hud: TetrisHud) => void;
  /** Se llama una vez cuando la pieza nueva colisiona al aparecer. */
  onGameOver: (finalScore: number) => void;
};
export type TetrisGame = {
  start: () => void; // inicia la partida desde cero y el bucle rAF
  pause: () => void; // congela update (sigue dibujando el último frame)
  resume: () => void; // continúa; reinicia el reloj de dt
  reset: () => void; // estado inicial (score 0, lines 0, level 1) sin arrancar
  destroy: () => void; // cancela rAF y elimina listeners de teclado
};
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
