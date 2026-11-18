
// Statistiques du dashboard

import { getMoviesByIds, getPopular } from "./api.js";
import "./navbar.js";
import { parseList, el } from "./utils.js";

const statusEl = document.getElementById("status");
const genresChart = document.getElementById("genres-chart");
const filmsList = document.getElementById("films-list");

// Récupérer les identifiants des films dans l'URL
const params = new URLSearchParams(location.search);

const ids = [...new Set(
  (params.get("ids") || "")
    .split(",")
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
)].slice(0, 5);

// Conserver les films choisis lors du retour à la sélection
const back = document.getElementById("back");

back.href = "selection.html" +
  (ids.length ? "?ids=" + ids.join(",") : "");

// Calcul et affichage des genres
function afficherGenres(films) {

  const occurrences = new Map();

  for (const film of films) {

    const genres = new Set(parseList(film.genres));

    for (const genre of genres) {

      const nombre = occurrences.get(genre) || 0;
      occurrences.set(genre, nombre + 1);

    }
  }

  // Trier les genres du plus fréquent au moins fréquent
  const classement = [...occurrences.entries()]
    .sort((a, b) => b[1] - a[1]);

  document.getElementById("total-genres").textContent =
    occurrences.size;

  document.getElementById("genre-dominant").textContent =
    classement.length ? classement[0][0] : "Non renseigné";

  // Cas où aucun genre n'est disponible
  if (classement.length === 0) {
    genresChart.replaceChildren(
      el("p", "muted", "Aucun genre disponible.")
    );
    return;
  }

  // Construire les barres du graphique
  const lignes = classement.slice(0, 6).map(([genre, nombre]) => {

    const ligne = el("div", "dashboard-genre");
    const etiquette = el("div", "dashboard-genre-label");

    etiquette.append(
      el("span", "", genre),
      el("span", "", nombre + " / " + films.length)
    );

    const piste = el("div", "dashboard-track");
    const barre = el("div", "dashboard-fill");

    const pourcentage = (nombre / films.length) * 100;
    barre.style.width = pourcentage + "%";

    piste.append(barre);
    ligne.append(etiquette, piste);

    return ligne;
  });

  genresChart.replaceChildren(...lignes);
}

// Charger les films et afficher les statistiques
async function chargerDashboard() {

  try {

    // Sans identifiants, afficher 3 films de démonstration
    const demo = ids.length === 0;

    const films = demo
      ? await getPopular(3)
      : await getMoviesByIds(ids);

    if (films.length === 0) {
      statusEl.textContent =
        "Aucun film trouvé. Retourne à la sélection pour commencer.";
      return;
    }

    // Message selon le mode utilisé
    statusEl.textContent = demo
      ? "Mode démonstration : statistiques sur trois films du catalogue."
      : "Statistiques calculées à partir de ta sélection.";

    // Afficher le nombre de films
    document.getElementById("total-films").textContent =
      films.length;

    // Afficher les titres des films
    const elements = films.map((film) =>
      el("li", "", film.title)
    );

    filmsList.replaceChildren(...elements);

    // Afficher les statistiques des genres
    afficherGenres(films);

  } catch (erreur) {

    statusEl.textContent =
      "Impossible de charger les films : " + erreur.message;

  }
}

chargerDashboard();
