// Seul fichier qui parle au back. Pour brancher le vrai serveur Flask :
// passer USE_MOCK à false. Les pages n'ont rien d'autre à changer, car chaque
// fonction renvoie le même format en mock et en vrai.
import { MOCK_MOVIES } from "./mock-data.js";

export const USE_MOCK = true;
const API_BASE = "http://localhost:8000";

// Met en minuscules et retire les accents : "Écran" -> "ecran".
// normalize("NFD") sépare la lettre de son accent, puis on supprime les accents.
function normaliser(texte) {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// fetch + vérification du code HTTP + lecture du JSON.
async function requete(chemin, options) {
  const reponse = await fetch(API_BASE + chemin, options);
  if (!reponse.ok) {
    const erreur = new Error("Erreur serveur " + reponse.status);
    erreur.status = reponse.status; // permet de reconnaître un 404 (voir getMovie)
    throw erreur;
  }
  return reponse.json();
}

// Recherche de films par titre. Renvoie un tableau de films.
export async function getMovies(search = "") {
  if (USE_MOCK) {
    const cherche = normaliser(search.trim());
    return MOCK_MOVIES.filter((film) => normaliser(film.title).includes(cherche));
  }
  return requete("/api/movies?search=" + encodeURIComponent(search));
}

// "Films du moment" : les `limit` premiers films, dans l'ordre de la liste /movie/popular
// de TMDB au moment de l'import (fichier app/data/tmdb_seul.json). Ce n'est PAS une
// popularité mise à jour, ni l'ordre de la base (un SELECT renvoie les lignes triées
// par tmdb_id, INTEGER PRIMARY KEY) : voir docs/API.md. Renvoie un tableau de films.
export async function getPopular(limit = 20) {
  if (USE_MOCK) return MOCK_MOVIES.slice(0, limit); // le mock est déjà dans cet ordre
  return requete("/api/movies/popular?limit=" + limit);
}

// Un film par son id (page film). Renvoie le film, ou null s'il n'existe pas (404).
export async function getMovie(id) {
  if (USE_MOCK) return MOCK_MOVIES.find((film) => film.tmdb_id === id) || null;
  try {
    return await requete("/api/movies/" + id);
  } catch (erreur) {
    if (erreur.status === 404) return null;
    throw erreur; // autre erreur (serveur éteint...) : la page l'affichera
  }
}

// Films choisis, retrouvés par leurs ids (page reco). Renvoie un tableau de films.
export async function getMoviesByIds(ids) {
  if (USE_MOCK) {
    return MOCK_MOVIES.filter((film) => ids.includes(film.tmdb_id));
  }
  return requete("/api/movies?ids=" + ids.join(","));
}

// Recommandations pour une liste d'ids. Renvoie { results: [film + score] }.
export async function getRecommendations(ids) {
  if (USE_MOCK) {
    // ponytail: recommandations FACTICES (10 films non choisis, score décroissant), remplacées par le vrai algo du back
    const autres = MOCK_MOVIES.filter((film) => !ids.includes(film.tmdb_id)).slice(0, 10);
    const results = autres.map((film, i) => ({ ...film, score: Number((0.95 - i * 0.05).toFixed(2)) }));
    return { results };
  }
  return requete("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tmdb_ids: ids }),
  });
}
