export type SessionUser = { name: string };

export function getUser(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem("av_user") || "null");
  } catch {
    return null;
  }
}

export function setUser(user: SessionUser | null): void {
  if (user) {
    localStorage.setItem("av_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("av_user");
  }
}

export function saveScore(entry: { game: string; score: number; name: string }): void {
  try {
    const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem("av_scores", JSON.stringify(all));
  } catch {
    // localStorage unavailable — ignore
  }
}
