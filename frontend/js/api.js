// Seul fichier qui parle au back. USE_MOCK = true : données factices, sans serveur ;
// USE_MOCK = false : vrai back Flask. Les pages n'ont rien d'autre à changer, car
// chaque fonction renvoie le même format en mock et en vrai.
//
// Routes réelles du back utilisées (voir docs/API.md) :
//   GET  /?limite=N          -> getPopular
//   GET  /search?q=texte     -> getMovies (400 si q est vide, donc on passe par getPopular)
//   POST /recommandation/    -> getRecommendations, body {"selected_ids": [...]}
// Le back n'a PAS de route "un film par id" ni "plusieurs films par ids" :
// getMovie et getMoviesByIds sont donc servis par un cache (sessionStorage) rempli
// avec les films déjà reçus. À remplacer par de vrais appels quand ces routes existeront.
import { MOCK_MOVIES } from "./mock-data.js";

export const USE_MOCK = false;
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

// ---- Cache des films ----
// Pourquoi sessionStorage : chaque page (accueil, sélection, reco, film) est un fichier
// HTML séparé, donc une variable JS est perdue à chaque changement de page.
// sessionStorage survit aux changements de page, mais pas à la fermeture de l'onglet.
// Son quota est d'environ 5 Mo : on garde au plus 500 films (les plus récents).
const CLE_CACHE = "filmsCache";
const MAX_FILMS = 500;

// Lit la liste des films mémorisés, du plus ancien au plus récent.
// On stocke un TABLEAU et non un objet { id: film } : en JavaScript, les clés
// numériques d'un objet sont triées par valeur, on perdrait l'ordre d'insertion.
function lireListe() {
  try {
    const liste = JSON.parse(sessionStorage.getItem(CLE_CACHE));
    return Array.isArray(liste) ? liste : [];
  } catch {
    return []; // JSON invalide ou sessionStorage indisponible : on repart d'un cache vide
  }
}

// Renvoie le cache sous la forme { [tmdb_id]: film }.
function lireCache() {
  const cache = {};
  for (const film of lireListe()) cache[film.tmdb_id] = film;
  return cache;
}

// Ajoute des films au cache. Un film déjà présent est remis en dernier (le plus récent).
// Au-delà de MAX_FILMS, on supprime les plus anciens.
function memoriser(films) {
  if (!Array.isArray(films)) return;
  try {
    const parId = new Map(lireListe().map((film) => [film.tmdb_id, film]));
    for (const film of films) {
      parId.delete(film.tmdb_id); // pour le replacer à la fin
      parId.set(film.tmdb_id, film);
    }
    const liste = [...parId.values()].slice(-MAX_FILMS);
    sessionStorage.setItem(CLE_CACHE, JSON.stringify(liste));
  } catch {
    // quota dépassé ou stockage bloqué : on ignore, le site marche sans cache
  }
}

// Recherche de films par titre. Renvoie un tableau de films.
export async function getMovies(search = "") {
  if (USE_MOCK) {
    const cherche = normaliser(search.trim());
    return MOCK_MOVIES.filter((film) => normaliser(film.title).includes(cherche));
  }
  // Le back renvoie 400 si q est vide : recherche vide = films du moment
  if (search.trim() === "") return getPopular(30);
  const films = await requete("/search?q=" + encodeURIComponent(search));
  memoriser(films);
  return films;
}

// "Films du moment" : les `limit` premiers films, dans l'ordre de la liste /movie/popular
// de TMDB au moment de l'import (fichier app/data/tmdb_seul.json). Ce n'est PAS une
// popularité mise à jour, ni l'ordre de la base (un SELECT renvoie les lignes triées
// par tmdb_id, INTEGER PRIMARY KEY) : voir docs/API.md. Renvoie un tableau de films.
export async function getPopular(limit = 20) {
  if (USE_MOCK) return MOCK_MOVIES.slice(0, limit); // le mock est déjà dans cet ordre
  const films = await requete("/?limite=" + limit);
  memoriser(films);
  return films;
}

// Un film par son id (page film). Renvoie le film, ou null s'il est inconnu.
export async function getMovie(id) {
  if (USE_MOCK) return MOCK_MOVIES.find((film) => film.tmdb_id === id) || null;
  // Pas de route back : on cherche dans le cache (null si le film n'a jamais été reçu)
  return lireCache()[id] || null;
}

// Films choisis, retrouvés par leurs ids (page reco). Renvoie un tableau de films.
export async function getMoviesByIds(ids) {
  if (USE_MOCK) {
    return MOCK_MOVIES.filter((film) => ids.includes(film.tmdb_id));
  }
  // Pas de route back : on retrouve les films dans le cache, ceux qui manquent sont ignorés
  const cache = lireCache();
  return ids.map((id) => cache[id]).filter(Boolean);
}

// Recommandations pour une liste d'ids. Renvoie { results: [film + score] }.
export async function getRecommendations(ids) {
  if (USE_MOCK) {
    // ponytail: recommandations FACTICES (10 films non choisis, score décroissant), remplacées par le vrai algo du back
    const autres = MOCK_MOVIES.filter((film) => !ids.includes(film.tmdb_id)).slice(0, 10);
    const results = autres.map((film, i) => ({ ...film, score: Number((0.95 - i * 0.05).toFixed(2)) }));
    return { results };
  }
  // Le back renvoie un tableau brut ; on l'enveloppe pour que reco.js reste inchangé
  const liste = await requete("/recommandation/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selected_ids: ids }),
  });
  memoriser(liste);
  return { results: liste };
}
