// Page film : film.html?id=123. N'affiche que les champs présents en base
// (affiche, titre, genres, synopsis, réalisateur, acteurs, mots-clés).
import "./navbar.js";
import { getMovie } from "./api.js";
import { parseList, createPoster, createChips, el, realisateur } from "./utils.js";

const statusEl = document.getElementById("status");

// Un titre + une liste de pastilles, seulement s'il y a quelque chose à montrer.
function sectionPastilles(titre, liste) {
  if (liste.length === 0) return [];
  return [el("h2", "", titre), createChips(liste)];
}

function afficher(film) {
  document.title = film.title + " — MUST";

  const infos = el("div", "film-infos");
  infos.append(el("h1", "", film.title), createChips(parseList(film.genres)));
  if (film.synopsis) infos.append(el("p", "", film.synopsis));
  if (realisateur(film)) infos.append(el("h2", "", "Réalisateur"), el("p", "", realisateur(film)));
  infos.append(
    ...sectionPastilles("Acteurs", parseList(film.actors)),
    ...sectionPastilles("Mots-clés", parseList(film.keywords))
  );

  // Ouvre la sélection avec ce film déjà choisi (selection.html lit ?ids=)
  const bouton = el("a", "btn", "Trouver des films similaires");
  bouton.href = "selection.html?ids=" + film.tmdb_id;
  infos.append(bouton);

  const affiche = el("div", "film-poster");
  affiche.append(createPoster(film, "w500"));
  document.getElementById("film").replaceChildren(affiche, infos);
}

async function init() {
  // id valide = uniquement des chiffres ("12" oui ; "abc", "12abc", "-3", "" non)
  const id = new URLSearchParams(location.search).get("id");
  if (!/^\d+$/.test(id || "")) {
    statusEl.textContent = "Film introuvable.";
    return;
  }
  statusEl.textContent = "Chargement…";
  try {
    const film = await getMovie(Number(id));
    if (!film) {
      statusEl.textContent = "Film introuvable.";
      return;
    }
    statusEl.textContent = "";
    afficher(film);
  } catch (erreur) {
    statusEl.textContent = "Impossible de charger le film (" + erreur.message + "). Le serveur est-il lancé ?";
  }
}

init();
