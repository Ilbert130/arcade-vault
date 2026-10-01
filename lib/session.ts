export function saveScore(entry: {
  game: string;
  score: number;
  name: string;
}): void {
  try {
    const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem("av_scores", JSON.stringify(all));
  } catch {
    // localStorage unavailable — ignore
  }
}
