import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatScoreDate,
  getGame,
  getGameStats,
  getLeaderboard,
} from "@/lib/games/queries";
export default async function GameDetailPage(props: PageProps<"/juegos/[id]">) {
  const { id } = await props.params;
  const game = await getGame(id);
  if (!game) notFound();
  const [stats, scores] = await Promise.all([
    getGameStats(id),
    getLeaderboard(id, 10),
  ]);
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
              <div className="v">{stats.plays.toLocaleString("es-ES")}</div>
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
                {stats.best === 0 ? "—" : stats.best.toLocaleString("es-ES")}
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
                <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
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
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
