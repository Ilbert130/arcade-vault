import Link from "next/link";
import type { Game, GameStats, LeaderboardRow } from "@/lib/catalog/types";
import {
  formatBest,
  formatRank,
  formatScore,
  formatScoreDate,
} from "@/lib/format";
export default function GameDetail({
  game,
  stats,
  scores,
}: {
  game: Game;
  stats: GameStats;
  scores: LeaderboardRow[];
}) {
  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={"cover-bg " + game.cover}></div>
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{formatScore(stats.plays)}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {formatBest(stats.best)}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link className="btn xl pulse" href={`/juegos/${game.id}/jugar`}>
              ▶ JUGAR AHORA
            </Link>
            <Link className="btn ghost lg" href="/">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>
      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores.length === 0 ? (
            <div className="lb-empty">
              <div className="lb-empty-title">AÚN NO HAY MARCAS</div>
              <Link className="btn yellow" href={`/juegos/${game.id}/jugar`}>
                ¡SÉ EL PRIMERO!
              </Link>
            </div>
          ) : (
            scores.map((r, i) => (
              <div
                key={r.username}
                className={
                  "lb-row" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
              >
                <div className="rk">#{formatRank(r.rank)}</div>
                <div className="pl">
                  {r.username}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {formatScoreDate(r.achievedAt)}
                  </div>
                </div>
                <div className="sc">{formatScore(r.score)}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
