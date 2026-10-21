# Memoria de mobile-porter

## Referencia de layout (al 2026-10-20, commit 72aa0e7 / SPEC 12)

- Mando: `components/games/TouchPad.tsx` (Pointer Events, repetición 170/50 ms), tipos en `lib/games/touch.ts`, `touch` obligatorio en `components/games/registry.tsx`, `inputRef` + `releaseAll()` en `components/GamePlayer.tsx`.
- CSS en `app/globals.css`, bloque `/* ===== mando táctil (spec 12) ===== */` al final:
  - `@media (pointer: coarse)`: mando visible (tableta: bajo el CRT), `.crt-controls` oculto.
  - `(pointer: coarse) and (max-width: 720px), (pointer: coarse) and (max-height: 560px)`: reproductor a `100dvh`, footer y `.crt-bottom` ocultos, HUD en una fila, `.skin-switch` compacto.
  - Vertical `(max-width: 720px) and (orientation: portrait)`: `.player-stage` `container-type: size`, `--pad-min: 150px`, `--key: clamp(40px, min(100cqh/3.3, (100cqw-16px)/4.75), 96px)` (`/3.3` sin A/B).
  - Horizontal `(orientation: landscape) and (max-height: 560px)`: rejilla cruceta | CRT | A/B con `display: contents`, `--key: clamp(40px, min(15dvh, …), 68px)`, CRT `min(100%, (100vw-324px)*0.75)` de alto.
  - Estrecho `(max-width: 480px), (max-height: 480px)`: oculta JUGADOR, HUD en iconos.
- Nav: pliegue por etapas en 1200 / 1060 / 480 px.
- `app/layout.tsx`: `suppressHydrationWarning` en `<html>`. `next.config.ts`: `allowedDevOrigins` `10.0.0.16`, `172.26.16.1`.

## Estado por página/juego

| Página / juego        | m-xs | m-md | l-md | tab | escritorio | Fecha | Notas                                      |
| --------------------- | ---- | ---- | ---- | --- | ---------- | ----- | ------------------------------------------ |
| `rocas` jugar         | ?    | ?    | ?    | ?   | ?          | —     | SPEC 12 implementado, sin auditar aún      |
| `caida` jugar         | ?    | ?    | ?    | ?   | ?          | —     | idem                                       |
| `bloque-buster` jugar | ?    | ?    | ?    | ?   | ?          | —     | idem                                       |
| `serpentina` jugar    | ?    | ?    | ?    | ?   | ?          | —     | idem                                       |
| `/` Home              | ?    | ?    | ?    | ?   | ?          | —     | fuera de SPEC 12; nunca revisada en móvil  |
| `/biblioteca`         | ?    | ?    | ?    | ?   | ?          | —     | idem                                       |
| `/salon`              | ?    | ?    | ?    | ?   | ?          | —     | idem                                       |
| `/juegos/<id>`        | ?    | ?    | ?    | ?   | ?          | —     | idem                                       |
| `/about`, `/auth`     | ?    | ?    | ?    | ?   | ?          | —     | revisar `font-size` ≥ 16px en inputs (iOS) |

## Problemas abiertos

(ninguno registrado todavía)

## Decisiones y preferencias del usuario

- SPEC 12: mando solo por `pointer: coarse`; sin gestos, fullscreen, vibración ni `user-scalable=no`; EMPEZAR/PAUSA siguen en los botones de `GamePlayer`.
- El usuario quiere que se vea bien tanto en la web (escritorio) como en el móvil.
