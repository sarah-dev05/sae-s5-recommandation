// Page d'accueil : film mis en avant, bouton "Lancer une recommandation"
// (dans le HTML) et rangée "Films du moment".
import "./navbar.js";
import { getPopular } from "./api.js";
import { parseList, createPoster, createChips, el } from "./utils.js";

// ATTENTION : "films du moment" = l'ordre de la liste /movie/popular de TMDB au moment
// de l'import (fichier app/data/tmdb_seul.json). Ce n'est PAS une popularité mise à jour.
// Ce n'est pas non plus l'ordre de la base : un SELECT renvoie les lignes triées par
// tmdb_id (INTEGER PRIMARY KEY), voir docs/API.md.
const NB_FILMS = 20;
const LONGUEUR_SYNOPSIS = 280;

const statusEl = document.getElementById("status");

// Début du synopsis, coupé à la fin d'un mot, avec "…" si on a raccourci.
function debutSynopsis(texte) {
  if (!texte || texte.length <= LONGUEUR_SYNOPSIS) return texte || "";
  return texte.slice(0, LONGUEUR_SYNOPSIS).replace(/\s+\S*$/, "") + "…";
}

// Lien vers la page d'un film.
function lienFilm(film) {
  return "film.html?id=" + film.tmdb_id;
}

// Grand bloc du film mis en avant : affiche à gauche, infos à droite.
function remplirHero(film) {
  const affiche = el("div", "hero-poster");
  affiche.append(createPoster(film, "w500")); // plus grande image que les cartes

  const bouton = el("a", "btn", "Voir le film");
  bouton.href = lienFilm(film);

  const infos = el("div", "hero-infos");
  infos.append(
    el("p", "muted", "Film mis en avant"),
    el("h1", "", film.title),
    createChips(parseList(film.genres)),
    el("p", "", debutSynopsis(film.synopsis)),
    bouton
  );
  document.getElementById("hero").replaceChildren(affiche, infos);
}

// Carte de la rangée : un lien (cliquable souris + clavier) avec affiche et titre.
function creerCarte(film) {
  const li = el("li", "rail-item");
  const a = el("a", "rail-card");
  a.href = lienFilm(film);
  a.append(createPoster(film), el("span", "card-title", film.title));
  li.append(a);
  return li;
}

async function init() {
  statusEl.textContent = "Chargement…";
  try {
    const films = await getPopular(NB_FILMS);
    if (films.length === 0) {
      statusEl.textContent = "Aucun film à afficher.";
      return;
    }
    statusEl.textContent = "";
    remplirHero(films[0]); // le 1er de la liste est mis en avant
    document.getElementById("rail").replaceChildren(...films.map(creerCarte));
  } catch (erreur) {
    statusEl.textContent = "Impossible de charger les films (" + erreur.message + "). Le serveur est-il lancé ?";
  }
}

init();
