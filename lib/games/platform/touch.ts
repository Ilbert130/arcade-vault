// ── Mando táctil compartido por todos los juegos (cruceta + A/B) ──
export type TouchSlot = "up" | "down" | "left" | "right" | "a" | "b";
export type TouchButton<A extends string = string> = {
  slot: TouchSlot;
  action: A; // acción del motor que dispara
  label: string; // texto corto bajo/sobre el botón, p. ej. "ROTAR"
  repeat?: boolean; // true: repite press() mientras se mantiene
};
export type TouchLayout = TouchButton[];
// Lo que GamePlayer/TouchPad ve de un motor.
export type GameInput = {
  press(action: string): void;
  release(action: string): void;
  releaseAll(): void;
};
// Tipa las acciones contra la unión del motor: una acción mal escrita falla en tsc.
export const touchLayout = <A extends string>(
  buttons: TouchButton<A>[],
): TouchLayout => buttons;
