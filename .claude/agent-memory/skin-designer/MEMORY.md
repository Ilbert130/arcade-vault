# Memoria de skin-designer

## Infraestructura (al 2026-10-18)

- Contrato **implementado**: `lib/games/skins.ts` (SKIN_IDS/SkinId/DEFAULT_SKIN/SKIN_LABELS/isSkinId), `skin: SkinId` en `GameRenderProps` (`components/games/registry.tsx`).
- Selector `SkinSwitch` en `components/GamePlayer.tsx` (ASPECTO: CLÁSICO · NEÓN · RETRO), `useSyncExternalStore` + `localStorage` `av-skin:<gameId>`, no roba foco; estilos `.skin-switch`/`.skin-opt`/`.skin-led` al final de `app/globals.css`. Visible en todos los juegos; los canvas sin soporte ignoran la prop.
- Juegos sin skins aún usan su `PALETTE` en `constants.ts` (base de `clasico`).

## Estado por juego

| Juego           | clasico | neon | retro | Familia retro    | Fecha      | Notas                                                                                                                                                                                                                        |
| --------------- | ------- | ---- | ----- | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rocas`         | ✅      | ✅   | ✅    | fósforo verde    | 2026-10-18 | Vectorial; neon glow 22 + núcleo blanco + rejilla magenta; retro `#0b1a0b`/`#39ff14`/`#b6ffb0`, balas cuadradas.                                                                                                             |
| `caida`         | ❌      | ❌   | ❌    | —                | 2026-10-18 | `COLORS` por pieza; bloques planos sin glow; glow solo en borde y cifras de paneles; 2 rgba literales (tinte tablero, franja blanca).                                                                                        |
| `bloque-buster` | ✅      | ✅   | ✅    | CGA 8-bit        | 2026-10-18 | clasico = spritesheet intacto; neon/retro vectoriales (sin tintar PNG). Neon: bloques prerenderizados offscreen por skin+color+dpr, glow 20, rejilla magenta. Retro: 7 tipos = color CGA + patrón (liso/puntos/rayas/marco). |
| `serpentina`    | ✅      | ✅   | ✅    | Game Boy 4 tonos | 2026-10-18 | Neon: anillos huecos sin puente (pendiente decisión usuario) + cabeza cian; retro bloques cuadrados, frutas tintadas `#0f380f` pixeladas.                                                                                    |

| `ranaria` | ✅ | ✅ | ✅ | ámbar (+2 tonos intermedios `#2b1800`/`#6b3d00`) | 2026-10-22 | Frogger, `lib/games/ranaria/skins.ts` (claves de la antigua PALETTE + `glow`, `outline`, `square`, `frogOutline`, `turtleRing`). Neon: glow 18 por entidad (save/restore), contorno blanco fino, rana con contorno blanco. Retro: formas cuadradas, tortugas cuadradas, tortuga sumergida = borde punteado, troncos con contorno. Sin build ni prueba en navegador. |

## Paletas aprobadas / rechazadas

(ninguna todavía; rocas, serpentina y bloque-buster pendientes de revisión del usuario)

## Familias retro usadas

- rocas: fósforo verde · serpentina: Game Boy · bloque-buster: CGA · ranaria: ámbar → para caida ya no queda ámbar: usar otra (p. ej. fósforo blanco/azul o CGA con patrón por pieza).

## Preferencias del usuario

- Toda skin debe existir en 3 variantes mínimas: `clasico` (default), `neon`, `retro`; tomar como referencia el estilo de los juegos ya creados.
