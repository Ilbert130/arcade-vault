# Rúbrica del juez

Puntúa cada propuesta de 1 a 5 por criterio. No te fíes de la autoevaluación del diseñador: verifícala contra el spec.

| Criterio                | Peso | Qué mirar                                                                                                         |
| ----------------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| Encaje con el tema      | 2    | El tema está en la mecánica, no solo en el decorado.                                                               |
| Diversión / rejugable   | 2    | Bucle claro, progresión, ganas de "una más".                                                                       |
| Puntuación              | 1.5  | Score entero que tenga sentido en el leaderboard y premie la habilidad.                                            |
| Viabilidad técnica      | 1.5  | Canvas 2D, contrato del motor, HUD ⊂ `score/lives/level/lines`, sin red. Sin piezas que el contrato no soporte.     |
| Controles               | 1    | Teclado simple, sin ghosting de muchas teclas.                                                                     |
| Equilibrio del catálogo | 1    | Categoría/color poco representados entre los jugables.                                                             |
| Esfuerzo (5 = poco)     | 1    | Dibujo procedural, pocas entidades, sin assets externos.                                                           |
| Identidad               | 0.5  | Nombre en español al estilo del catálogo, sin marcas registradas.                                                  |
| Calidad del spec        | 1.5  | Todas las secciones de `spec-template.md`, sin placeholders, reglas y constantes concretas, criterios verificables. |

Total = Σ(nota × peso). Máximo 60.

## Desempate y vetos

- **Veto**: una propuesta que necesite multijugador online, HUD fuera del contrato o un id ocupado no puede ganar hasta corregirse.
- Empate: gana la de mayor "Encaje con el tema"; si persiste, la de menor esfuerzo.
- Si el ganador tiene un defecto menor en el spec (placeholder, `sort_order` repetido), corrígelo al copiarlo a `specs/` y anótalo en el veredicto.
