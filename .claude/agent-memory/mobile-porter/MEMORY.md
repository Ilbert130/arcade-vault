# Memoria de mobile-porter

## Referencia de layout (al 2026-10-20, rama spec-13-gamepad-mk2, sin commitear)

- Mando: `components/games/TouchPad.tsx` (Pointer Events, repetición 170/50 ms, prop `skin` → `data-skin`), tipos en `lib/games/touch.ts`, `touch` obligatorio en `components/games/registry.tsx`, `inputRef` + `releaseAll()` en `components/GamePlayer.tsx`.
- MK-II (spec 13): silueta fija 4 teclas + hub/gema + B,A; slots sin acción = `InertButton` (`data-inert`, `aria-disabled`, sin handlers); serigrafía `.touch-silk` solo con texto en A/B con acción; flechas SVG.
- CSS en `app/globals.css`, bloque `/* ===== mando táctil: Gamepad MK-II (specs 12 y 13) ===== */` (~l.3141):
  - Paletas `--pad-*` en `.touch-pad` (clasico) y `[data-skin="neon"|"retro"]`; `--pad-glow` multiplica glows (0 en retro); `--ab = --key × 1.35`.
  - `@media (pointer: coarse)`: carcasa única (tableta), `.crt-controls` oculto.
  - Móvil `(coarse) and (max-width:720px), (coarse) and (max-height:560px)`: 100dvh, footer/`.crt-bottom` ocultos, HUD 1 fila.
  - Vertical: `--pad-min:150px`, `--key: clamp(40px, min(100cqh/3.3, (100cqw-8px)/6.5), 96px)`.
  - Horizontal `(landscape) and (max-height:560px)`: rejilla `1fr|auto|1fr`, `.player-stage`/`.touch-pad` `display:contents`, `.touch-shell` pinta medias carcasas; `--key: clamp(40px, min(15dvh, (100vw-52px-(100dvh-104px)*4/3)/7.5-2px), 68px)`; CRT `min(100%, (100vw-368px)*0.75)`.
  - Estrecho `(max-width:480px),(max-height:480px)`: JUGADOR oculto, HUD en iconos.
- Nav: pliegue en 1200 / 1060 / 480 px. `app/layout.tsx`: `suppressHydrationWarning`. `next.config.ts`: `allowedDevOrigins` `10.0.0.16`, `172.26.16.1`.

## Medidas de referencia (auditoría 2026-10-20)

- 390×844: key 50.7 px, A/B 68.4 px, CRT 371×281, pad 371×395 (sobra alto: key limitada por ancho), sin scroll.
- 844×390: key 52.8 px, A/B 71.2, CRT 374×281 (4:3) al centro, shell cruceta 198×198 izq., shell A/B 197×115 der., sin solapes ni scroll.
- 820×1180: key 62 px (fijo), carcasa única 772×257 bajo CRT; página hace scroll (1272) por el footer, mando entero visible.
- 1280×800 sin táctil: `.touch-pad` none, `.crt-controls`/`.crt-bottom` visibles.

## Estado por página/juego

| Página / juego        | m-xs | m-md | l-md | tab | escritorio | Fecha      | Notas                                      |
| --------------------- | ---- | ---- | ---- | --- | ---------- | ---------- | ------------------------------------------ |
| `rocas` jugar         | ?    | ✅   | ✅   | ✅  | ✅         | 2026-10-20 | spec 13 OK, 3 skins                        |
| `caida` jugar         | ?    | ✅   | ✅   | ✅  | ✅         | 2026-10-20 | idem; puntero real verificado              |
| `bloque-buster` jugar | ?    | ✅   | ✅   | ✅  | ✅         | 2026-10-20 | idem; ▲▼/A/B inertes                       |
| `serpentina` jugar    | ?    | ✅   | ✅   | ✅  | ✅         | 2026-10-20 | idem; A/B inertes                          |
| `/` Home              | ?    | ?    | ?    | ?   | ?          | —          | nunca revisada en móvil                    |
| `/biblioteca`         | ?    | ?    | ?    | ?   | ?          | —          | idem                                       |
| `/salon`              | ?    | ?    | ?    | ?   | ?          | —          | idem                                       |
| `/juegos/<id>`        | ?    | ?    | ?    | ?   | ?          | —          | idem                                       |
| `/about`, `/auth`     | ?    | ?    | ?    | ?   | ?          | —          | revisar `font-size` ≥ 16px en inputs (iOS) |

Pendiente: m-xs (320×568), m-sm, m-lg, l-sm (667×375), d-narr y páginas no-juego.

## Problemas abiertos (menores)

- `components/Nav.tsx:123` `.av-mobile-panel` cerrado queda fuera de pantalla con `translateX` pero sin `inert`/`aria-hidden`/`visibility:hidden`: sigue en el árbol a11y y es tabulable. No causa scroll. No propuesto como spec.
- Anillo discontinuo de A/B pulsado (`.touch-btn-ring`, inset −11 %) cruza la serigrafía `.touch-silk` debajo (visible en 390 y 844). Cosmético.
- Vertical 390×844: carcasa única mucho más alta que la cruceta (395 vs 158 px): hueco vacío arriba/abajo. Cosmético.
- Retro: A/B inertes en `--pad-key-ink` claro sobre carcasa beige a opacidad .32: muy tenues (aceptable como "apagado").
- Tableta: el reproductor no es 100dvh (por diseño de SPEC 12), la página hace scroll por el footer.

## Decisiones y preferencias del usuario

- SPEC 12: mando solo por `pointer: coarse`; sin gestos, fullscreen, vibración ni `user-scalable=no`; EMPEZAR/PAUSA siguen en los botones de `GamePlayer`.
- SPEC 13: silueta fija con slots inertes (no ocultarlos); paletas del mando comunes, no por juego; B cyan.
- El usuario quiere que se vea bien tanto en la web (escritorio) como en el móvil.

## Técnicas de auditoría que funcionan

- Pointer sintético: stub temporal de `setPointerCapture/hasPointerCapture/releasePointerCapture` en `Element.prototype` (si no, lanza con pointerId falso). Verificar además con `click` del MCP + MutationObserver sobre `data-pressed`.
- Tras cambiar skin espera ≥ 400 ms (transiciones de 140 ms en border/box-shadow falsean `getComputedStyle`).
- Bloque Buster acaba en game over en segundos si no se mueve la pala: usar Caída para pruebas largas.
