# game-jam

Resultados de las game jams de Arcade Vault, generados por el skill `/game-jam <tema>`.

Cada jam crea una carpeta `<YYYY-MM-DD>-<tema-slug>/` con:

- `propuesta-a.md` — ángulo A (acción arcade)
- `propuesta-b.md` — ángulo B (puzzle / estrategia)
- `propuesta-c.md` — ángulo C (wildcard / versus)
- `veredicto.md` — puntuación con la rúbrica, ganador y motivos

Cada propuesta tiene un pitch y, tras la línea `<!-- SPEC -->`, un spec completo. El spec ganador se copia a `specs/NN-<id>.md` y se implementa con `/add-game <id>`.

## Piezas

| Pieza                             | Ruta                                                   |
| --------------------------------- | ------------------------------------------------------ |
| Orquestador y juez (skill)        | `.claude/skills/game-jam/SKILL.md`                     |
| Ángulos de los diseñadores        | `.claude/skills/game-jam/references/angulos.md`        |
| Rúbrica del juez                  | `.claude/skills/game-jam/references/rubrica.md`        |
| Plantilla del veredicto           | `.claude/skills/game-jam/assets/veredicto-template.md` |
| Agente diseñador (×3 en paralelo) | `.claude/agents/game-jam/game-jam-designer.md`         |
