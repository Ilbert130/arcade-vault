# Memoria de game-performance-booster

Sembrada el 2026-10-27 con los resultados del spec 14 (`specs/14-performance-efectos-crt.md`). Medido en `npm run dev`, ruido ≈ ±2 fps. Aún no se ha invocado al agente.

## Infraestructura vigente (spec 14)

- `GamePlayer` pone `data-player` en `<html>`; `app/styles/background.css` apaga bajo `html[data-player]` la rejilla animada `.av-bg::before` y oculta `.av-bg::after` y `.av-noise`.
- `.crt-screen::after` sin `mix-blend-mode`.
- HUD en refs + `paintHud` (`textContent` solo si cambia); `handleHud`/`handleGameOver` con `useCallback`; los 5 Canvas usan "callbacks en refs".
- Cuello de botella original: la GPU (7–14 ms/frame), no Paint/Raster (≈0.6 ms).

## Cifras por juego y skin (fps esc. antes → después | fps móvil CPU ×4 antes → después)

| juego         | skin              | escritorio                               | móvil CPU ×4                  | estado                              | notas                                                                                                                                                                                                   |
| ------------- | ----------------- | ---------------------------------------- | ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rocas         | clasico           | 56.4 → 59.9                              | 59.6 → 59.9                   | ✅                                  | glow 10. Auditoría 2026-10-27 (carga concurrente): esc 59.9 p95 16.8 GPU 6.4 ms; móvil 50.8 p95 33.4 GPU 6.4                                                                                            |
| rocas         | neon              | 54.8 → 59.9                              | 55.3 → 59.8                   | ✅                                  | glow 22. Auditoría 2026-10-27: esc 59.8 p95 16.8 GPU 6.0 ms; móvil 50.6 p95 33.4 GPU 11.8                                                                                                               |
| rocas         | retro             | 59.9 → 59.9                              | —                             | ✅                                  | glow 0. Auditoría 2026-10-27: esc 59.9 p95 16.8 GPU 1.8; móvil 59.1 p95 16.8                                                                                                                            |
| caida         | única (sin skins) | 59.6 → 59.9 (re-medido 2026-10-27: 59.7) | 52.1 → 59.8 (re-medido: 57.2) | ✅                                  | `GLOW = 8` fijo; p95 16.9 esc. / 17.0 móvil; GPU 0.53 / 0.24 ms; Paint+Raster ≤0.02 ms; 2 commits React en 6 s; re-medición en `next start` con carga concurrente (dev server dio 500 por worker caído) |
| bloque-buster | clasico           | 58.3 → 59.9                              | 55.9 → 58.3                   | ✅                                  | glow 0; auditoría 2026-10-27: esc. 58.3 p95 16.8, móvil 52.6-55.6 p95 33 (carga concurrente)                                                                                                            |
| bloque-buster | neon              | 59.9 → 59.9                              | 55.4 → 59.4                   | ⚠️                                  | glow 20; auditoría 2026-10-27: esc. 59.9; móvil 33-42.7 (GPU 6-7 ms, ruidoso, concurrente)                                                                                                              |
| bloque-buster | retro             | 57.6 → 59.9                              | —                             | ✅                                  | glow 0; auditoría 2026-10-27: esc. 59.9; móvil 59.9                                                                                                                                                     |
| serpentina    | clasico           | 59.3 (p95 16.8)                          | 55.1 (p95 33.3)               | ✅                                  | auditado 2026-10-27, carga concurrente; glow 12; GPU 1.4/2.9 ms                                                                                                                                         |
| serpentina    | neon              | 59.8 (p95 16.8)                          | 56.9 (p95 17.0)               | ✅                                  | auditado 2026-10-27; glow 26 (+fruta 18); GPU 1.8/1.4 ms                                                                                                                                                |
| serpentina    | retro             | 59.9 (p95 16.9)                          | 58.1 (p95 16.9)               | ✅                                  | auditado 2026-10-27; glow 0; GPU 0.4/0.8 ms                                                                                                                                                             |
| ranaria       | clasico           | 59.9 (p95 16.8)                          | 58.0 (p95 16.8)               | ✅                                  | auditado 2026-10-27 (build prod, carga concurrente); glow 0; GPU 1.7/1.5 ms                                                                                                                             |
| ranaria       | neon              | 49.8 (p95 66.6)                          | 43.1 (p95 83.5)               | ⚠️ esc. ≥45 ok; móvil <45, p95 alto | glow 18 por entidad; GPU 4.5/7.6 ms (spec 14 daba 44.2/14.7: ruido o mejora, sin cambios de código)                                                                                                     |
| ranaria       | retro             | 59.8 (p95 16.8)                          | 59.0 (p95 16.8)               | ✅                                  | auditado 2026-10-27; glow 0; GPU 1.2/1.4 ms                                                                                                                                                             |

## Riesgos abiertos

- **RANARIA `neon`**: 44.2 fps escritorio (0.8 por debajo del objetivo de 45) y 14.7 fps móvil. Las capas de página no lo arreglan. Pendiente un spec de glow (límite de `shadowBlur` o glow prerenderizado en offscreen); decisión del usuario sobre cuánto aspecto ceder.
- **CAÍDA sin skins** (`lib/games/caida/` sin `skins.ts`): se mide solo su aspecto único; las skins las crea `skin-designer`.
- Medido solo en emulación: falta prueba en móvil real y con sesión iniciada.

## Método de medición

- Funcionó: script `playwright-core` + Chrome estable (`headless: false`, `bringToFront`) con traza CDP y `Emulation.setCPUThrottlingRate` ×4; el script vive fuera del repo.
- No funcionó: Chrome DevTools MCP (no conectó en el spec 14); extensión Claude-in-Chrome (pestaña limitada a ~1–4 fps).
- 2026-10-27: MCP (playwright y chrome-devtools) no conectó. `npm run dev` con 5 agentes en paralelo se cae ("Jest worker ... exceeded retry limit"): se midió con copia del repo en scratchpad + `next build --webpack` (Turbopack rechaza el junction de node_modules) + `next start -p 3107`. El scratchpad es compartido entre agentes: usar subcarpeta propia (`rana/`).
- Con `ChromeDevTools MCP` disponible, probarlo primero y anotar aquí si conecta.

## Preferencias del usuario

- Medir antes y después con presupuesto numérico; sin contador de FPS ni telemetría en producción.
- No cambiar el diseño de las skins ni el glow dentro de un spec de capas de página.

## Auditoría serpentina (2026-10-27, solo auditoría, 5 agentes en paralelo)

- Medido con `next start -p 3101` (el dev :3000 devolvía 500 en `/jugar`: "Jest worker ... exceeding retry limit"; build `.next` previo) + playwright-core en scratchpad. Paint+Raster ≈ 0 ms/frame.
- Pendiente menor (sin spec, no urgente): `syncResolution` en `lib/games/serpentina/engine.ts:202` no acota el dpr; en neon el `shadowBlur` 26 se aplica por segmento (coste crece con la longitud de la serpiente).

## Notas de la auditoría de bloque-buster (2026-10-27, carga concurrente)

- El dev server de :3000 devolvía 500 en `/juegos/*/jugar` (Jest worker caído). Se midió con copia del repo en el scratchpad, `next build --webpack` (Turbopack rechaza el junction de node_modules) y `next start -p 3010`.
- Script en el scratchpad de la sesión (`perf/measure.mjs`, con contador de commits). 0 renders durante la partida (commits=1 por skin, salvo 0 en una).
- Móvil `neon` es sensible al ruido: 33 fps (con stall de 2.4 s) y 42.7 fps en el repaso. Repetir en máquina sin carga.

## Notas de la auditoría de rocas (2026-10-27, solo auditoría)

- dpr sin acotar (`rocas/engine.ts:253`), rejilla de `neon` repintada por frame (`:319`), sin caché de fondo; riesgo bajo, sin spec propuesto (cumple presupuesto).
- Entorno: el dev server de :3000 devolvía 500 (Jest worker) con 5 agentes concurrentes; se midió contra un `next start` ajeno (:3107). El scratchpad es compartido: usar nombres de script propios (`rocas-measure.js`), otro agente sobrescribió `m.js`.
