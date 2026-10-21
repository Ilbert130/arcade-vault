"use client";
import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent, RefObject } from "react";
import type { GameStatus } from "@/components/games/registry";
import type { SkinId } from "@/lib/games/skins";
import type {
  GameInput,
  TouchButton,
  TouchLayout,
  TouchSlot,
} from "@/lib/games/touch";
// Repetición al mantener (botones con `repeat`): press inmediato, espera y luego cada intervalo.
export const REPEAT_DELAY_MS = 170;
export const REPEAT_INTERVAL_MS = 50;
type DpadSlot = "up" | "down" | "left" | "right";
type ActionSlot = "a" | "b";
const DPAD_SLOTS: DpadSlot[] = ["up", "left", "right", "down"];
// B a la izquierda, A a la derecha (como en el MK-II).
const ACTION_SLOTS: ActionSlot[] = ["b", "a"];
// Flechas en SVG (viewBox 24×24): nítidas y centradas en cualquier fuente y dispositivo.
const ARROWS: Record<DpadSlot, string> = {
  up: "M12 4 L20 16 L4 16 Z",
  down: "M4 8 L20 8 L12 20 Z",
  left: "M16 4 L16 20 L4 12 Z",
  right: "M8 4 L20 12 L8 20 Z",
};
const SLOT_NAMES: Record<TouchSlot, string> = {
  up: "ARRIBA",
  down: "ABAJO",
  left: "IZQUIERDA",
  right: "DERECHA",
  a: "A",
  b: "B",
};
const isActionSlot = (slot: TouchSlot): slot is ActionSlot =>
  slot === "a" || slot === "b";
type TouchPadProps = {
  layout: TouchLayout;
  status: GameStatus;
  inputRef: RefObject<GameInput | null>;
  skin: SkinId; // skin activa del reproductor: paleta del mando
};
// Silueta fija (cruceta completa + B/A): los slots sin entrada en el layout se pintan inertes.
export default function TouchPad({
  layout,
  status,
  inputRef,
  skin,
}: TouchPadProps) {
  const active = status === "playing";
  const bySlot = new Map(layout.map((b) => [b.slot, b]));
  const renderSlot = (slot: TouchSlot) => {
    const button = bySlot.get(slot);
    return button ? (
      <PadButton
        key={slot}
        button={button}
        active={active}
        inputRef={inputRef}
      />
    ) : (
      <InertButton key={slot} slot={slot} />
    );
  };
  return (
    <div
      className="touch-pad"
      data-skin={skin}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Medias carcasas: en horizontal cada una pinta la suya; si no, la pinta .touch-pad. */}
      <div className="touch-shell touch-shell--dpad">
        <div className="touch-dpad">
          {DPAD_SLOTS.map(renderSlot)}
          <span className="touch-dpad-hub" aria-hidden="true">
            <span className="touch-dpad-gem" />
          </span>
        </div>
      </div>
      <div className="touch-shell touch-shell--actions">
        <div className="touch-actions">
          {ACTION_SLOTS.map((slot) => (
            <div key={slot} className={`touch-ab touch-ab--${slot}`}>
              {renderSlot(slot)}
              {/* Serigrafía grabada en la carcasa: solo A/B con acción. */}
              <span className="touch-silk pixel" aria-hidden="true">
                {bySlot.get(slot)?.label ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// Cara de la tecla: flecha en la cruceta; anillo + letra en A/B.
function SlotFace({ slot }: { slot: TouchSlot }) {
  if (isActionSlot(slot))
    return (
      <>
        <span className="touch-btn-ring" aria-hidden="true" />
        <span className="touch-btn-letter pixel" aria-hidden="true">
          {SLOT_NAMES[slot]}
        </span>
      </>
    );
  return (
    <svg className="touch-btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ARROWS[slot]} fill="currentColor" />
    </svg>
  );
}
// Slot sin acción en este juego: mantiene la silueta, sin handlers ni inputRef.
function InertButton({ slot }: { slot: TouchSlot }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={`touch-btn touch-btn--${slot}`}
      aria-label={SLOT_NAMES[slot]}
      aria-disabled="true"
      data-inert=""
    >
      <SlotFace slot={slot} />
    </button>
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
      <SlotFace slot={slot} />
    </button>
  );
}
