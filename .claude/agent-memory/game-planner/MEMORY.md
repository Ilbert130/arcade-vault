# Memoria de game-planner

## Estado del catálogo (al 2026-10-16)

- Jugables: `rocas` (SHOOTER, yellow), `caida` (PUZZLE, magenta), `bloque-buster` (ARCADE, cyan), `serpentina` (ARCADE, green).
- En catálogo, aún no jugables (candidatos naturales, solo requieren `update playable`): `gloton` (ARCADE, yellow), `invasores` (SHOOTER, green), `ranaria` (ARCADE, green), `duelo-pixel` (VERSUS, cyan).
- Categoría sin ningún jugable: VERSUS.
- `references/started-games/` solo tiene asteroids, tetris y arkanoid, todos ya portados: cualquier juego nuevo va desde cero.

## Registro de sugerencias

Estados: `propuesto` · `aceptado` · `rechazado` · `implementado`

| Fecha      | id               | Título         | Cat     | Estado    | Motivo / notas                                                                                                                                              |
| ---------- | ---------------- | -------------- | ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-16 | `duelo-pixel`    | DUELO PIXEL    | VERSUS  | propuesto | Recomendación principal: llena VERSUS (0 jugables), Pong solo vs CPU con score por devoluciones/goles, 3 vidas, nivel cada 3 goles. Desde cero, sin assets. |
| 2026-10-16 | `invasores`      | INVASORES      | SHOOTER | propuesto | Alternativa 1: score muy natural, pero SHOOTER ya tiene `rocas`. Desde cero.                                                                                |
| 2026-10-18 | `invasores`      | INVASORES      | SHOOTER | aceptado  | Ganador game-jam 'Invasores' → specs/11-invasores.md (racha ×5, cápsulas, nodriza; update playable).                                                        |
| 2026-10-16 | `gloton`         | GLOTÓN         | ARCADE  | propuesto | Alternativa 2: gran atractivo, pero esfuerzo alto (laberinto + IA de 4 fantasmas) y ARCADE ya tiene 2.                                                      |
| 2026-10-16 | `ciempies`       | CIEMPIÉS       | SHOOTER | propuesto | Lote de 20 (top SHOOTER, nota 5, esfuerzo 3). Centipede; riesgo: división de segmentos. Insert + cover nueva.                                               |
| 2026-10-16 | `ultima-defensa` | ÚLTIMA DEFENSA | SHOOTER | propuesto | Lote de 20 (nota 4, esfuerzo 3). Missile Command; riesgo: mira con teclado.                                                                                 |
| 2026-10-16 | `rio-de-fuego`   | RÍO DE FUEGO   | SHOOTER | propuesto | Lote de 20 (nota 4, esfuerzo 4). River Raid; riesgo: río procedural, combustible fuera del HUD genérico.                                                    |
| 2026-10-16 | `asedio`         | ASEDIO         | SHOOTER | propuesto | Lote de 20 (nota 3, esfuerzo 3). Robotron; riesgo: ghosting con 8 teclas.                                                                                   |
| 2026-10-16 | `enjambre`       | ENJAMBRE       | SHOOTER | propuesto | Lote de 20 (nota 3, esfuerzo 4). Galaga; solapa con `invasores`, elegir solo uno.                                                                           |
| 2026-10-16 | `burbujas`       | BURBUJAS       | PUZZLE  | propuesto | Lote de 20 (top PUZZLE, nota 5, esfuerzo 3). Puzzle Bobble; riesgo: snap hexagonal.                                                                         |
| 2026-10-16 | `pilares`        | PILARES        | PUZZLE  | propuesto | Lote de 20 (nota 4, esfuerzo 2). Columns; se parece a `caida`.                                                                                              |
| 2026-10-16 | `fusion`         | FUSIÓN         | PUZZLE  | propuesto | Lote de 20 (nota 4, esfuerzo 1). 2048; poco "arcade" sin reloj.                                                                                             |
| 2026-10-16 | `gemas`          | GEMAS          | PUZZLE  | propuesto | Lote de 20 (nota 4, esfuerzo 3). Bejeweled contrarreloj; selección por teclado menos inmediata.                                                             |
| 2026-10-16 | `tuberias`       | TUBERÍAS       | PUZZLE  | propuesto | Lote de 20 (nota 3, esfuerzo 4). Pipe Mania; reglas poco obvias sin tutorial.                                                                               |
| 2026-10-16 | `ranaria`        | RANARIA        | ARCADE  | propuesto | Lote de 20 (top ARCADE, nota 4.5, esfuerzo 3). Frogger; ya sembrado, solo `update playable`.                                                                |
| 2026-10-16 | `alunizaje`      | ALUNIZAJE      | ARCADE  | propuesto | Lote de 20 (nota 4, esfuerzo 2). Lunar Lander; riesgo: tolerancias de aterrizaje.                                                                           |
| 2026-10-16 | `caverna`        | CAVERNA        | ARCADE  | propuesto | Lote de 20 (nota 4, esfuerzo 1). Helicóptero en cueva, un botón; poca profundidad.                                                                          |
| 2026-10-16 | `piramide`       | PIRÁMIDE       | ARCADE  | propuesto | Lote de 20 (nota 3.5, esfuerzo 3). Q*bert; mapeo de diagonales con teclado.                                                                                 |
| 2026-10-16 | `andamios`       | ANDAMIOS       | ARCADE  | propuesto | Lote de 20 (nota 3, esfuerzo 4). Donkey Kong; IP muy reconocible, rampas y escaleras.                                                                       |
| 2026-10-16 | `estela`         | ESTELA         | VERSUS  | propuesto | Lote de 20 (top VERSUS, nota 5, esfuerzo 2). Ciclos de luz vs CPU; motor tipo `serpentina`; riesgo: equilibrio de IA.                                       |
| 2026-10-16 | `blindados`      | BLINDADOS      | VERSUS  | propuesto | Lote de 20 (nota 4, esfuerzo 3). Combat (tanques); IA con BFS.                                                                                              |
| 2026-10-16 | `volea`          | VOLEA          | VERSUS  | propuesto | Lote de 20 (nota 4, esfuerzo 3). Slime Volleyball; física de pelota.                                                                                        |
| 2026-10-16 | `dinamita`       | DINAMITA       | VERSUS  | propuesto | Lote de 20 (nota 3, esfuerzo 4). Bomberman batalla; IA que esquive explosiones.                                                                             |
| 2026-10-16 | `punos`          | PUÑOS          | VERSUS  | propuesto | Lote de 20 (nota 3, esfuerzo 3). Boxing Atari; poca profundidad. Descartado HOCKEY NEÓN por solapar con `duelo-pixel`.                                      |
| 2026-10-18 | `formacion`      | FORMACIÓN      | PUZZLE  | propuesto | game-jam 'Invasores' (prop. B). Match-3 por intercambio con flota que desciende; 48/60.                                                                     |
| 2026-10-18 | `nodriza`        | NODRIZA        | VERSUS  | propuesto | game-jam 'Invasores' (prop. C). Invasión al revés vs cañón CPU; llenaría VERSUS; 50/60, riesgo IA.                                                          |
| 2026-10-27 | `anzuelo`        | ANZUELO        | ARCADE  | aceptado  | Ganador game-jam 'fondo del mar' → specs/16-anzuelo.md (pesca de riesgo, 49.5/60).                                                                          |
| 2026-10-27 | `lonja`          | LONJA          | PUZZLE  | propuesto | game-jam 'fondo del mar' (prop. B). Clasificar peces en 4 nasas con cinta que desborda; 47.5/60.                                                            |
| 2026-10-27 | `batiscafo`      | BATISCAFO      | VERSUS  | propuesto | game-jam 'fondo del mar' (prop. C). Duelo submarino vs CPU por flotabilidad; llenaría VERSUS; 47.5/60, riesgo IA/inercia. Segunda opción.                    |

## Preferencias del usuario

(vacío)
