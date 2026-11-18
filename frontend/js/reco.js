// Page recommandations : lit les ids dans l'URL, affiche les films choisis,
// puis les recommandations (affiche, titre, score, synopsis).
// Le bloc "Pourquoi ?" (enCommun, pourquoi, createWhy : éléments en commun avec les films
// choisis) a été retiré pour la v1. Dernier commit qui le contenait : 84d3e53
// -> le récupérer avec : git show 84d3e53:frontend/js/reco.js
import { getMoviesByIds, getRecommendations } from "./api.js";
import "./navbar.js";
import { createPoster, el } from "./utils.js";

const statusEl = document.getElementById("status");
const chosenList = document.getElementById("chosen");
const recoList = document.getElementById("recos");
const chosenBloc = chosenList.closest("section"); // bloc "Ta sélection" (titre + liste)

// reco.html?ids=12,45,89 -> [12, 45, 89] (on ignore ce qui n'est pas un nombre)
const ids = (new URLSearchParams(location.search).get("ids") || "")
  .split(",")
  .map(Number)
  .filter(Boolean);

// Le retour à l'accueil garde la sélection actuelle
document.getElementById("back").href = "selection.html?ids=" + ids.join(",");

// Vignette d'un film choisi : petite affiche + titre.
function createChosen(film) {
  const li = el("li", "chosen-item");
  li.append(createPoster(film), el("span", "chosen-title", film.title));
  return li;
}

// Carte d'une recommandation : affiche, titre, score, synopsis.
function createReco(reco) {
  const li = el("li", "reco");
  const infos = el("div", "reco-infos");
  infos.append(
    el("h3", "reco-title", reco.title),
    // Le score du back est déjà un pourcentage (ex. 34.5) -> "34,5 %"
    el("p", "score", "Score : " + Number(reco.score).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %")
  );
  if (reco.synopsis) {
    // Le CSS coupe le texte à 4 lignes ; le texte complet est dans title (infobulle au survol)
    const synopsis = el("p", "reco-synopsis", reco.synopsis);
    synopsis.title = reco.synopsis;
    infos.append(synopsis);
  } else {
    infos.append(el("p", "muted", "Pas de synopsis disponible."));
  }
  li.append(createPoster(reco), infos);
  return li;
}

async function init() {
  if (ids.length === 0) {
    statusEl.textContent = "Aucun film choisi. Retourne à la sélection pour en choisir.";
    return;
  }
  statusEl.textContent = "Chargement des recommandations…";
  try {
    // Les deux requêtes partent en même temps
    const [choisis, reponse] = await Promise.all([getMoviesByIds(ids), getRecommendations(ids)]);
    chosenList.replaceChildren(...choisis.map(createChosen));
    // Cache absent (ex. lien ouvert dans un nouvel onglet) : on masque le bloc "Ta sélection"
    chosenBloc.hidden = choisis.length === 0;
    const recos = reponse.results;
    statusEl.textContent = recos.length === 0 ? "Aucune recommandation trouvée pour cette sélection." : "";
    recoList.replaceChildren(...recos.map(createReco));
  } catch (erreur) {
    statusEl.textContent = "Impossible de charger les recommandations (" + erreur.message + "). Le serveur est-il lancé ?";
  }
}

init();
