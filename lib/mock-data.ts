export type Game = {
  id: string;
  title: string;
  cat: string;
  cover: string; // clase CSS para el fondo de portada
};

export type ActivityEntry = {
  player: string;
  game: string;
  score: number;
  time: string;
  color: "cyan" | "magenta" | "yellow" | "green";
};

export type TopPlayer = {
  rank: number;
  player: string;
  score: number;
};

export const GAMES: Game[] = [
  { id: "bloque-buster", title: "BLOQUE BUSTER", cat: "ARCADE", cover: "cover-bricks" },
  { id: "caida", title: "CAÍDA", cat: "PUZZLE", cover: "cover-tetro" },
  { id: "serpentina", title: "SERPENTINA", cat: "ARCADE", cover: "cover-snake" },
  { id: "gloton", title: "GLOTÓN", cat: "ARCADE", cover: "cover-glot" },
  { id: "invasores", title: "INVASORES", cat: "SHOOTER", cover: "cover-invaders" },
  { id: "rocas", title: "ROCAS", cat: "SHOOTER", cover: "cover-rocas" },
];

export const ACTIVITY: ActivityEntry[] = [
  { player: "NEONFOX", game: "Caída", score: 184220, time: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", game: "Glotón", score: 96400, time: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", game: "Invasores", score: 54190, time: "hace 8 min", color: "green" },
  { player: "VAULT_07", game: "Rocas", score: 41200, time: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", game: "Bloque Buster", score: 28450, time: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", game: "Serpentina", score: 7820, time: "hace 24 min", color: "green" },
  { player: "CYBER_LU", game: "Ranaria", score: 18900, time: "hace 31 min", color: "yellow" },
];

export const TOP_PLAYERS: TopPlayer[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];
