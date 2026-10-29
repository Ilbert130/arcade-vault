"use client";
import { SKIN_IDS, SKIN_LABELS } from "@/lib/games/platform/skins";
import type { SkinId } from "@/lib/games/platform/skins";
export default function SkinSwitch({
  value,
  onChange,
}: {
  value: SkinId;
  onChange: (skin: SkinId) => void;
}) {
  return (
    <div className="skin-switch">
      <span className="skin-switch-label" id="skin-switch-label">
        ASPECTO
      </span>
      <div
        className="skin-switch-group"
        role="group"
        aria-labelledby="skin-switch-label"
      >
        {SKIN_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`skin-opt skin-${id}${value === id ? " on" : ""}`}
            aria-pressed={value === id}
            // Sin foco al pulsar con el ratón: el teclado sigue en el juego.
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              // Sin foco tras el clic para que Espacio no vuelva a activarlo.
              e.currentTarget.blur();
              onChange(id);
            }}
          >
            <span className="skin-led" aria-hidden="true" />
            {SKIN_LABELS[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
