import type { ActivityEntry } from "@/lib/placeholder/home-data";
import { TOP_PLAYERS } from "@/lib/placeholder/home-data";
import { formatRank, formatScore } from "@/lib/format";
// Actividad en vivo y top del día: aún con datos de ejemplo (lib/placeholder), no Supabase.
export default function HomeActivity({
  activity,
  goSalon,
}: {
  activity: ActivityEntry[];
  goSalon: () => void;
}) {
  return (
    <section className="home-section reveal">
      <div className="section-head">
        <div className="kicker pixel neon-yellow">{"// 03"}</div>
        <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
        <div className="section-rule"></div>
      </div>
      <div className="activity-grid">
        <div className="activity-card">
          <div className="ac-head">
            <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
          </div>
          <div className="ticker">
            {activity.map((r, i) => (
              <div
                key={i}
                className="tick-row"
                style={{ animationDelay: i * 60 + "ms" }}
              >
                <span className={"tk-p neon-" + r.color}>{r.player}</span>
                <span className="tk-mid">▸ {r.game}</span>
                <span className="tk-s">+{formatScore(r.score)}</span>
                <span className="tk-t">{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-card">
          <div className="ac-head">
            <div className="ac-title pixel neon-magenta">
              ▸ TOP JUGADORES · HOY
            </div>
            <button className="lb-link" onClick={goSalon}>
              VER SALÓN →
            </button>
          </div>
          <div className="top-list">
            {TOP_PLAYERS.map((r, i) => (
              <div
                key={i}
                className={
                  "top-row" +
                  (i === 0
                    ? " top1"
                    : i === 1
                      ? " top2"
                      : i === 2
                        ? " top3"
                        : "")
                }
              >
                <span className="tp-rk">#{formatRank(r.rank)}</span>
                <span className="tp-bar">
                  <span
                    className="tp-fill"
                    style={{ width: 100 - i * 16 + "%" }}
                  ></span>
                </span>
                <span className="tp-p">{r.player}</span>
                <span className="tp-s">{formatScore(r.score)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
