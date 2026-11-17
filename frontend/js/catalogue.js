// Page catalogue : recherche, affichage des films, sélection de 3 à 5 films.
import { getMovies, USE_MOCK } from "./api.js";
import { parseList, createPoster } from "./utils.js";

const MIN = 3;
const MAX = 5;

const searchInput = document.getElementById("search");
const statusEl = document.getElementById("status");
const grid = document.getElementById("grid");
const counter = document.getElementById("counter");
const barMessage = document.getElementById("bar-message");
const goButton = document.getElementById("go");

// Ids des films choisis. Si on revient de reco.html (?ids=...), on reprend la sélection.
const idsUrl = new URLSearchParams(location.search).get("ids");
let selection = idsUrl ? idsUrl.split(",").map(Number).filter(Boolean).slice(0, MAX) : [];

if (USE_MOCK) document.getElementById("mock-banner").hidden = false;

// Crée la carte d'un film. C'est un <button> : cliquable à la souris ET au clavier.
function createCard(film) {
  const li = document.createElement("li");
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.dataset.id = film.tmdb_id;
  // aria-pressed indique l'état "choisi" aux lecteurs d'écran ; le CSS s'en sert aussi pour le contour
  card.setAttribute("aria-pressed", selection.includes(film.tmdb_id));

  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = film.title;

  const genres = document.createElement("span");
  genres.className = "card-meta";
  genres.textContent = parseList(film.genres).join(" · ");

  card.append(createPoster(film), title, genres);
  card.addEventListener("click", () => toggle(film.tmdb_id, card));
  li.append(card);
  return li;
}

// Ajoute ou retire un film de la sélection.
function toggle(id, card) {
  if (selection.includes(id)) {
    selection = selection.filter((x) => x !== id);
  } else if (selection.length < MAX) {
    selection.push(id);
  } else {
    barMessage.textContent = "5 films maximum : retire-en un d'abord";
    return;
  }
  card.setAttribute("aria-pressed", selection.includes(id));
  updateBar();
}

// Met à jour le compteur et active le bouton à partir de 3 films.
function updateBar() {
  counter.textContent = selection.length + "/" + MAX;
  barMessage.textContent = selection.length < MIN ? "films sélectionnés (minimum " + MIN + ")" : "films sélectionnés";
  goButton.disabled = selection.length < MIN;
}

// Numéro de la dernière recherche lancée : si une ancienne réponse arrive
// après une plus récente (réseau lent), on l'ignore.
let derniereRecherche = 0;

async function search(texte) {
  const numero = ++derniereRecherche;
  statusEl.textContent = "Chargement…";
  grid.replaceChildren();
  try {
    const films = await getMovies(texte);
    if (numero !== derniereRecherche) return;
    statusEl.textContent = films.length === 0 ? "Aucun film ne correspond à « " + texte + " »." : "";
    grid.replaceChildren(...films.map(createCard));
  } catch (erreur) {
    if (numero !== derniereRecherche) return;
    statusEl.textContent = "Impossible de charger les films (" + erreur.message + "). Le serveur est-il lancé ?";
  }
}

// Debounce : on attend 300 ms sans frappe avant de lancer la recherche,
// pour ne pas envoyer une requête à chaque lettre tapée.
let timer;
searchInput.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(() => search(searchInput.value.trim()), 300);
});

goButton.addEventListener("click", () => {
  location.href = "reco.html?ids=" + selection.join(",");
});

updateBar();
search("");
