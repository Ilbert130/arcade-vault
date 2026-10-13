import Link from "next/link";
import { formatScoreDate } from "@/lib/games/queries";
import type { Game, LeaderboardRow } from "@/lib/games/types";
const fmt = (n: number) => n.toLocaleString("es-ES");
const rankLabel = (n: number) => String(n).padStart(2, "0");
const PODIUM = [
  { index: 1, cls: "silver" },
  { index: 0, cls: "gold" },
  { index: 2, cls: "bronze" },
] as const;
export default function HallOfFame({
  games,
  game,
  rows,
  you,
}: {
  games: Game[];
  game: Game | null;
  rows: LeaderboardRow[];
  // undefined = sin sesión; null = con sesión y sin marca en este juego.
  you: LeaderboardRow | null | undefined;
}) {
  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>
      <div className="hall-tabs">
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/salon?juego=${g.id}`}
            className={"chip" + (game?.id === g.id ? " active" : "")}
            aria-current={game?.id === g.id ? "page" : undefined}
            scroll={false}
          >
            {g.title}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="hall-empty">
          <div className="hall-empty-title">
            AÚN NO HAY MARCAS{game ? ` EN ${game.title}` : ""}
          </div>
        </div>
      ) : (
        <>
          <div className="podium">
            {PODIUM.map(({ index, cls }) => {
              const r = rows[index];
              if (!r) return null;
              const gold = cls === "gold";
              return (
                <div key={cls} className={"podium-slot " + cls}>
                  {gold && (
                    <div
                      className="pixel"
                      style={{
                        fontSize: 9,
                        color: "var(--gold)",
                        letterSpacing: "0.18em",
                      }}
                    >
                      CAMPEÓN
                    </div>
                  )}
                  <div
                    className="rank-num"
                    style={gold ? { fontSize: 36, marginTop: 4 } : undefined}
                  >
                    {rankLabel(r.rank)}
                  </div>
                  <div className="name">{r.username}</div>
                  <div
                    className="score"
                    style={gold ? { fontSize: 20 } : undefined}
                  >
                    {fmt(r.score)}
                  </div>
                  <div className="date">{formatScoreDate(r.achievedAt)}</div>
                </div>
              );
            })}
          </div>
          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.username}
                className={
                  "tr" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{rankLabel(r.rank)}</div>
                <div className="pl">{r.username}</div>
                <div className="sc">{fmt(r.score)}</div>
                <div className="dt">{formatScoreDate(r.achievedAt)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {game && you !== undefined && (
        <div className="hall-table hall-you">
          {you ? (
            <>
              <div className="tr you-label">
                ▸ TU MEJOR MARCA EN {game.title}
              </div>
              <div className="tr you">
                <div className="rk" style={{ color: "var(--yellow)" }}>
                  #{rankLabel(you.rank)}
                </div>
                <div className="pl" style={{ color: "var(--yellow)" }}>
                  {you.username}
                </div>
                <div
                  className="sc"
                  style={{
                    color: "var(--yellow)",
                    textShadow: "0 0 6px rgba(245,255,0,0.5)",
                  }}
                >
                  {fmt(you.score)}
                </div>
                <div className="dt">{formatScoreDate(you.achievedAt)}</div>
              </div>
            </>
          ) : (
            <div className="tr you-label">
              AÚN NO TIENES MARCA EN {game.title}
            </div>
          )}
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/biblioteca" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
