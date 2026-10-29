// ── Skins compartidas por todos los juegos (solo cosméticas) ──
export const SKIN_IDS = ["clasico", "neon", "retro"] as const;
export type SkinId = (typeof SKIN_IDS)[number];
export const DEFAULT_SKIN: SkinId = "clasico";
export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};
export const isSkinId = (v: unknown): v is SkinId =>
  SKIN_IDS.includes(v as SkinId);
