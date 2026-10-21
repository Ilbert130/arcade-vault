# Veredicto — game jam "Invasores"

**Fecha:** 2026-10-18
**Propuestas:** [A](propuesta-a.md) · [B](propuesta-b.md) · [C](propuesta-c.md)

## Las tres propuestas

| Prop. | id          | Título    | Cat     | Color   | Mecánica núcleo                                                                                      |
| ----- | ----------- | --------- | ------- | ------- | ---------------------------------------------------------------------------------------------------- |
| A     | `invasores` | INVASORES | SHOOTER | green   | Cañón contra formación 5×11 que acelera; multiplicador de racha (×5), cápsulas atrapables y nodriza. |
| B     | `formacion` | FORMACIÓN | PUZZLE  | cyan    | Intercambiar invasores vecinos para alinear 3+ de la misma especie mientras la flota desciende.      |
| C     | `nodriza`   | NODRIZA   | VERSUS  | magenta | Invasión al revés: el jugador mueve la flota, bombardea y se lanza en picado contra un cañón CPU.    |

## Puntuación (rúbrica, nota × peso)

| Criterio (peso)             | A        | B       | C       |
| --------------------------- | -------- | ------- | ------- |
| Encaje con el tema (2)      | 5 → 10   | 4 → 8   | 5 → 10  |
| Diversión / rejugable (2)   | 5 → 10   | 4 → 8   | 4 → 8   |
| Puntuación (1.5)            | 5 → 7.5  | 5 → 7.5 | 4 → 6   |
| Viabilidad técnica (1.5)    | 5 → 7.5  | 4 → 6   | 3 → 4.5 |
| Controles (1)               | 5 → 5    | 4 → 4   | 5 → 5   |
| Equilibrio del catálogo (1) | 2 → 2    | 3 → 3   | 5 → 5   |
| Esfuerzo (1)                | 4 → 4    | 3 → 3   | 3 → 3   |
| Identidad (0.5)             | 4 → 2    | 5 → 2.5 | 5 → 2.5 |
| Calidad del spec (1.5)      | 5 → 7.5  | 4 → 6   | 4 → 6   |
| **Total (/60)**             | **55.5** | **48**  | **50**  |

Vetos: ninguno. A reutiliza `invasores`, que ya estaba en el catálogo con `playable = false`. El organizador lo autorizó de forma expresa porque el usuario quiere implementar ese juego, así que la migración es un `update` y no hay colisión de id. B y C usan ids nuevos y `sort_order` distintos (9 y 11).

## Ganador: INVASORES (`invasores`)

Es el juego que el usuario pidió y el spec más completo y verificable de los tres. Tiene constantes concretas para la formación, los disparos, los escudos, la nodriza y las cápsulas, y trata riesgos reales como el túnel de disparos rápidos y el Espacio compartido con la página. La racha con multiplicador separa bien el leaderboard entre jugadores medios y expertos sin salir del HUD genérico. Es el de menos esfuerzo: la fila, la portada y el `sort_order` ya existen, así que solo hace falta el motor y un `update playable`. Su punto débil es el equilibrio del catálogo (SHOOTER y green ya tienen un juego jugable cada uno).

**Spec:** `specs/11-invasores.md` · **Correcciones al copiar:** se quitó de "Riesgos identificados" la nota sobre la creación de la carpeta de la jam, porque no es un riesgo del juego.

## Por qué no las otras

- **Prop. C — NODRIZA:** es la idea más original y llena VERSUS, que no tiene ningún juego jugable. Pierde por la IA del cañón (esquivar y apuntar), que es arriesgada de equilibrar. Es un buen candidato para una jam centrada en VERSUS o como siguiente juego después de INVASORES.
- **Prop. B — FORMACIÓN:** es un match-3 bien atado al tema, pero queda como segundo PUZZLE junto a CAÍDA y tiene muchas animaciones encadenadas. Ganaría en una jam de puzzles.

## Siguiente paso

`/add-game invasores` (o `/spec-impl 11`)
