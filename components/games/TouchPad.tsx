"use client";
import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import type { GameStatus } from "@/components/games/registry";
import type {
  GameInput,
  TouchButton,
  TouchLayout,
  TouchSlot,
} from "@/lib/games/touch";
// Repetición al mantener (botones con `repeat`): press inmediato, espera y luego cada intervalo.
export const REPEAT_DELAY_MS = 170;
export const REPEAT_INTERVAL_MS = 50;
const DPAD_SLOTS: TouchSlot[] = ["up", "left", "right", "down"];
const ACTION_SLOTS: TouchSlot[] = ["b", "a"];
const GLYPHS: Record<TouchSlot, string> = {
  up: "▲",
  down: "▼",
  left: "◀",
  right: "▶",
  a: "A",
  b: "B",
};
const SLOT_NAMES: Record<TouchSlot, string> = {
  up: "ARRIBA",
  down: "ABAJO",
  left: "IZQUIERDA",
  right: "DERECHA",
  a: "A",
  b: "B",
};
type TouchPadProps = {
  layout: TouchLayout;
  status: GameStatus;
  inputRef: RefObject<GameInput | null>;
};
export default function TouchPad({ layout, status, inputRef }: TouchPadProps) {
  const active = status === "playing";
  const bySlot = new Map(layout.map((b) => [b.slot, b]));
  const renderSlots = (slots: TouchSlot[]) =>
    slots.flatMap((slot) => {
      const button = bySlot.get(slot);
      return button
        ? [
            <PadButton
              key={slot}
              button={button}
              active={active}
              inputRef={inputRef}
            />,
          ]
        : [];
    });
  const dpad = renderSlots(DPAD_SLOTS);
  const actions = renderSlots(ACTION_SLOTS);
  return (
    <div className="touch-pad" onContextMenu={(e) => e.preventDefault()}>
      {dpad.length > 0 && <div className="touch-dpad">{dpad}</div>}
      {actions.length > 0 && <div className="touch-actions">{actions}</div>}
    </div>
  );
}
type PadButtonProps = {
  button: TouchButton;
  active: boolean;
  inputRef: RefObject<GameInput | null>;
};
function PadButton({ button, active, inputRef }: PadButtonProps) {
  const { slot, action, label, repeat } = button;
  const elRef = useRef<HTMLButtonElement>(null);
  // Puntero que mantiene el botón (null = suelto) y temporizador de repetición.
  const pointerRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const clearTimer = () => {
    if (timerRef.current === null) return;
    // clearTimeout y clearInterval comparten la lista de ids.
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  // Suelta la acción; idempotente. El estado pulsado va en el DOM para no re-renderizar.
  const end = useCallback(() => {
    const pointerId = pointerRef.current;
    if (pointerId === null) return;
    pointerRef.current = null;
    clearTimer();
    inputRef.current?.release(action);
    const el = elRef.current;
    if (!el) return;
    delete el.dataset.pressed;
    if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
  }, [action, inputRef]);
  // Fuera de "playing" (pausa, fin, autopausa) y al desmontar no queda nada pulsado.
  useEffect(() => {
    if (!active) end();
  }, [active, end]);
  useEffect(() => end, [end]);
  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (!active || pointerRef.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerRef.current = e.pointerId;
    e.currentTarget.dataset.pressed = "";
    inputRef.current?.press(action);
    if (!repeat) return;
    timerRef.current = window.setTimeout(() => {
      inputRef.current?.press(action);
      timerRef.current = window.setInterval(
        () => inputRef.current?.press(action),
        REPEAT_INTERVAL_MS,
      );
    }, REPEAT_DELAY_MS);
  }
  function onPointerEnd(e: PointerEvent<HTMLButtonElement>) {
    if (e.pointerId === pointerRef.current) end();
  }
  // Con captura no hay pointerleave: deslizar el dedo fuera del botón suelta a mano.
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (e.pointerId !== pointerRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const inside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!inside) end();
  }
  return (
    <button
      ref={elRef}
      type="button"
      tabIndex={-1}
      className={`touch-btn touch-btn--${slot}`}
      aria-label={label ? `${SLOT_NAMES[slot]}: ${label}` : SLOT_NAMES[slot]}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      onPointerMove={onPointerMove}
    >
      <span className="touch-btn-glyph" aria-hidden="true">
        {GLYPHS[slot]}
      </span>
      {label && (
        <span className="touch-btn-label pixel" aria-hidden="true">
          {label}
        </span>
      )}
    </button>
  );
}
