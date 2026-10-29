// Formatos de puntuaciones, rangos y fechas compartidos por toda la UI (es-ES).
export const formatScore = (n: number) => n.toLocaleString("es-ES");
// 0 = sin marca todavía.
export const formatBest = (n: number) => (n === 0 ? "—" : formatScore(n));
// #01, #02… (también el nivel del HUD).
export const formatRank = (n: number) => String(n).padStart(2, "0");
// dd/mm/aaaa para las fechas de las marcas.
export function formatScoreDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
