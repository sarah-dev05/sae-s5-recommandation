// Page recommandations : lit les ids dans l'URL, affiche les films choisis,
// puis les recommandations avec un "Pourquoi ?" calculé côté front.
import { getMoviesByIds, getRecommendations } from "./api.js";
import "./navbar.js";
import { parseList, createPoster, el, realisateur } from "./utils.js";

const statusEl = document.getElementById("status");
const chosenList = document.getElementById("chosen");
const recoList = document.getElementById("recos");

// reco.html?ids=12,45,89 -> [12, 45, 89] (on ignore ce qui n'est pas un nombre)
const ids = (new URLSearchParams(location.search).get("ids") || "")
  .split(",")
  .map(Number)
  .filter(Boolean);

// Le retour à l'accueil garde la sélection actuelle
document.getElementById("back").href = "selection.html?ids=" + ids.join(",");

// Éléments présents dans les deux listes (intersection avec un Set).
function enCommun(listeA, listeB) {
  const setB = new Set(listeB);
  return listeA.filter((x) => setB.has(x));
}

// Pour un film recommandé, liste ce qu'il partage avec chaque film choisi.
// Renvoie par ex. [{ titre: "Le Parrain", lignes: [["Genres", ["Drame", "Crime"]]] }]
function pourquoi(reco, choisis) {
  const resultat = [];
  for (const choisi of choisis) {
    const lignes = [];
    if (realisateur(reco) && realisateur(reco) === realisateur(choisi)) {
      lignes.push(["Réalisateur", [realisateur(reco)]]);
    }
    const champs = [["Acteurs", "actors"], ["Genres", "genres"], ["Mots-clés", "keywords"]];
    for (const [label, champ] of champs) {
      const communs = enCommun(parseList(reco[champ]), parseList(choisi[champ]));
      if (communs.length > 0) lignes.push([label, communs]);
    }
    if (lignes.length > 0) resultat.push({ titre: choisi.title, lignes });
  }
  return resultat;
}

// Vignette d'un film choisi : petite affiche + titre.
function createChosen(film) {
  const li = el("li", "chosen-item");
  li.append(createPoster(film), el("span", "chosen-title", film.title));
  return li;
}

// Bloc "Pourquoi ?" : <details>/<summary> est un dépliant natif du navigateur
// (clic, clavier et lecteur d'écran gérés sans JavaScript).
function createWhy(reco, choisis) {
  const details = el("details", "why");
  details.append(el("summary", "", "Pourquoi ?"));

  const raisons = pourquoi(reco, choisis);
  if (raisons.length === 0) {
    details.append(el("p", "muted", "Aucun élément en commun trouvé avec ta sélection."));
    return details;
  }
  for (const raison of raisons) {
    details.append(el("p", "why-film", "Avec « " + raison.titre + " »"));
    const ul = el("ul", "why-list");
    for (const [label, valeurs] of raison.lignes) {
      const li = el("li");
      li.append(el("span", "muted", label + " : "), valeurs.join(", "));
      ul.append(li);
    }
    details.append(ul);
  }
  return details;
}

// Carte d'une recommandation : affiche, titre, score, "Pourquoi ?".
function createReco(reco, choisis) {
  const li = el("li", "reco");
  const infos = el("div", "reco-infos");
  infos.append(
    el("h3", "reco-title", reco.title),
    el("p", "score", "Score : " + Number(reco.score).toFixed(2)),
    createWhy(reco, choisis)
  );
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
    const recos = reponse.results;
    statusEl.textContent = recos.length === 0 ? "Aucune recommandation trouvée pour cette sélection." : "";
    recoList.replaceChildren(...recos.map((reco) => createReco(reco, choisis)));
  } catch (erreur) {
    statusEl.textContent = "Impossible de charger les recommandations (" + erreur.message + "). Le serveur est-il lancé ?";
  }
}

init();
