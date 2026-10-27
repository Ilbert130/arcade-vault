# Veredicto — game jam "fondo del mar"

**Fecha:** 2026-10-27
**Propuestas:** [A](propuesta-a.md) · [B](propuesta-b.md) · [C](propuesta-c.md)

## Las tres propuestas

| Prop. | id          | Título    | Cat    | Color   | Mecánica núcleo                                                                                   |
| ----- | ----------- | --------- | ------ | ------- | ------------------------------------------------------------------------------------------------- |
| A     | `anzuelo`   | ANZUELO   | ARCADE | magenta | Anzuelo que desciende enganchando peces (cadena ≤ 6), esquiva medusas/minas y cobra al subir.      |
| B     | `lonja`     | LONJA     | PUZZLE | cyan    | Cinta de peces que se apilan en 4 nasas; 3+ iguales seguidos en el tope se cobran, con cascadas.  |
| C     | `batiscafo` | BATISCAFO | VERSUS | magenta | Duelo submarino vs CPU con flotabilidad por lastre (inercia), torpedos y arrecife central.         |

## Puntuación (rúbrica, nota × peso)

| Criterio (peso)             | A        | B        | C        |
| --------------------------- | -------- | -------- | -------- |
| Encaje con el tema (2)      | 4 → 8    | 4 → 8    | 5 → 10   |
| Diversión / rejugable (2)   | 4 → 8    | 3 → 6    | 4 → 8    |
| Puntuación (1.5)            | 4 → 6    | 4 → 6    | 4 → 6    |
| Viabilidad técnica (1.5)    | 5 → 7.5  | 5 → 7.5  | 3 → 4.5  |
| Controles (1)               | 5 → 5    | 5 → 5    | 4 → 4    |
| Equilibrio del catálogo (1) | 3 → 3    | 3 → 3    | 5 → 5    |
| Esfuerzo (1)                | 4 → 4    | 4 → 4    | 2 → 2    |
| Identidad (0.5)             | 4 → 2    | 4 → 2    | 4 → 2    |
| Calidad del spec (1.5)      | 4 → 6    | 4 → 6    | 4 → 6    |
| **Total (/60)**             | **49.5** | **47.5** | **47.5** |

Sin vetos: ids libres, HUD ⊂ `score/lives/level`, sin red.

## Ganador: ANZUELO (`anzuelo`)

Mejor equilibrio entre viabilidad, controles y rejugabilidad: bucle de riesgo/recompensa claro ("una inmersión más"), puntuación que premia la habilidad (multiplicador por peces, profundidad, redada) y un motor pequeño sin IA ni assets. El tema está en la mecánica (profundidad, pesca, medusas).

**Spec:** `specs/13-anzuelo.md` · **Correcciones al copiar:** aclarado que ↓ acelera el descenso (decía "sube"). `sort_order = 21` no choca con B (32) ni C (9); comprobar contra la BD al migrar.

## Por qué no las otras

- **B — LONJA:** sólida y fácil, pero PUZZLE ya tiene `caida`, comparte color cyan con `bloque-buster` y el bucle (apilar en pilas) es menos emocionante.
- **C — BATISCAFO:** la más original y la única VERSUS (mejor equilibrio de catálogo y encaje), pero la IA y la física con inercia elevan riesgo y esfuerzo. Ganaría en una jam que priorice llenar VERSUS; sería la segunda opción.

## Siguiente paso

`/add-game anzuelo`
