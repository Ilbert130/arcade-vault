"use client";
import { useSyncExternalStore } from "react";
import { DEFAULT_SKIN, isSkinId } from "@/lib/games/platform/skins";
import type { SkinId } from "@/lib/games/platform/skins";
// ── Skin por juego (solo cosmética), recordada en localStorage ──────────────
const SKIN_EVENT = "av-skin-change";
const skinKey = (gameId: string) => `av-skin:${gameId}`;
// Respaldo en memoria si localStorage no está disponible (modo privado, cuota…).
const memorySkins: Record<string, SkinId> = {};
function readSkin(gameId: string): SkinId {
  const mem = memorySkins[gameId];
  if (mem) return mem;
  try {
    const stored = window.localStorage.getItem(skinKey(gameId));
    return isSkinId(stored) ? stored : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}
function writeSkin(gameId: string, skin: SkinId) {
  memorySkins[gameId] = skin;
  try {
    window.localStorage.setItem(skinKey(gameId), skin);
  } catch {
    // Sin persistencia: la elección dura lo que la pestaña.
  }
  window.dispatchEvent(new Event(SKIN_EVENT));
}
function subscribeSkin(onChange: () => void) {
  // Otra pestaña cambió la skin: manda localStorage, no la copia en memoria.
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("av-skin:"))
      delete memorySkins[e.key.slice("av-skin:".length)];
    onChange();
  };
  window.addEventListener(SKIN_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SKIN_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
export function useGameSkin(gameId: string) {
  // En el servidor (y en la hidratación) siempre CLÁSICO; luego, la guardada.
  const skin = useSyncExternalStore(
    subscribeSkin,
    () => readSkin(gameId),
    () => DEFAULT_SKIN,
  );
  const changeSkin = (next: SkinId) => writeSkin(gameId, next);
  return [skin, changeSkin] as const;
}
