import { getMovies } from "./api.js";
import { el, createPoster } from "./utils.js";


const NOM = "MUST";

const header = document.getElementById("navbar");

// Page courante : "index.html" (ou "" quand l'URL finit par "/"), "selection.html"...
const page = location.pathname.split("/").pop() || "index.html";


function lien(texte, href, pages) {
  const a = el("a", "nav-link", texte);
  a.href = href;
  if (pages.includes(page)) a.setAttribute("aria-current", "page");
  return a;
}

const logo = el("a", "nav-logo", NOM);
logo.href = "index.html";

const liens = el("nav", "nav-links");
liens.setAttribute("aria-label", "Navigation principale");
liens.append(
  lien("Accueil", "index.html", ["index.html"]),
  lien("Recommandation", "selection.html", ["selection.html", "reco.html"])
);

// Barre de recherche : champ + liste déroulante de résultats.
const recherche = el("form", "nav-search");
recherche.setAttribute("role", "search");
const label = el("label", "visually-hidden", "Rechercher un film");
label.htmlFor = "nav-search";
const champ = el("input");
champ.id = "nav-search";
champ.type = "search";
champ.placeholder = "Rechercher un film…";
champ.autocomplete = "off";
// Attributs ARIA du modèle "combobox" : un lecteur d'écran annonce la liste et l'option active.
champ.setAttribute("role", "combobox");
champ.setAttribute("aria-expanded", "false");
champ.setAttribute("aria-controls", "nav-results");
champ.setAttribute("aria-autocomplete", "list");

const liste = el("ul", "nav-results");
liste.id = "nav-results";
liste.setAttribute("role", "listbox");
liste.hidden = true;

recherche.append(label, champ, liste);
recherche.addEventListener("submit", (e) => e.preventDefault()); // pas de rechargement de page

header.className = "navbar";
header.append(el("div", "navbar-inner")); // conteneur centré
header.firstChild.append(logo, liens, recherche);

// ---------- Recherche ----------
const MAX_RESULTATS = 8;
const MIN_CARACTERES = 2;

let resultats = []; // films affichés dans la liste
let actif = -1;     // index de l'option surlignée au clavier (-1 = aucune)
let numero = 0;     // numéro de la dernière recherche (pour ignorer les réponses trop tardives)
let timer;

function ouvrir() {
  liste.hidden = false;
  champ.setAttribute("aria-expanded", "true");
}

function fermer() {
  numero++; // une réponse encore en route sera ignorée
  clearTimeout(timer);
  liste.hidden = true;
  champ.setAttribute("aria-expanded", "false");
  champ.removeAttribute("aria-activedescendant");
  actif = -1;
}

// Affiche un message ("Recherche…", "Aucun film trouvé") à la place des résultats.
function message(texte) {
  resultats = [];
  actif = -1;
  const li = el("li", "nav-results-msg", texte);
  li.setAttribute("role", "presentation");
  liste.replaceChildren(li);
  ouvrir();
}

function aller(film) {
  location.href = "film.html?id=" + film.tmdb_id;
}

// Une ligne de résultat : petite affiche + titre.
function creerOption(film, i) {
  const li = el("li", "nav-result");
  li.id = "nav-opt-" + i;
  li.setAttribute("role", "option");
  li.setAttribute("aria-selected", "false");
  const affiche = el("span", "nav-result-poster");
  affiche.append(createPoster(film));
  li.append(affiche, el("span", "", film.title));
  li.addEventListener("click", () => aller(film));
  return li;
}

// Surligne l'option i (en bouclant aux extrémités).
function choisirOption(i) {
  const options = liste.children;
  if (actif >= 0) options[actif].setAttribute("aria-selected", "false");
  actif = (i + options.length) % options.length;
  options[actif].setAttribute("aria-selected", "true");
  options[actif].scrollIntoView({ block: "nearest" });
  champ.setAttribute("aria-activedescendant", options[actif].id);
}

async function chercher(texte) {
  const mien = ++numero;
  message("Recherche…");
  try {
    const films = await getMovies(texte);
    if (mien !== numero) return;
    if (films.length === 0) return message("Aucun film trouvé");
    resultats = films.slice(0, MAX_RESULTATS);
    liste.replaceChildren(...resultats.map(creerOption));
  } catch {
    if (mien === numero) message("Recherche impossible (serveur injoignable ?)");
  }
}

// Debounce : on attend 300 ms sans frappe avant de chercher.
champ.addEventListener("input", () => {
  clearTimeout(timer);
  const texte = champ.value.trim();
  if (texte.length < MIN_CARACTERES) return fermer();
  timer = setTimeout(() => chercher(texte), 300);
});

champ.addEventListener("keydown", (e) => {
  if (e.key === "Escape") return fermer();
  if (liste.hidden || resultats.length === 0) return; // rien à naviguer
  if (e.key === "ArrowDown") { e.preventDefault(); choisirOption(actif + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); choisirOption(actif - 1); }
  else if (e.key === "Enter") { e.preventDefault(); aller(resultats[Math.max(actif, 0)]); } // sans sélection : 1er résultat
});

// Clic en dehors de la recherche : on ferme la liste.
document.addEventListener("click", (e) => {
  if (!recherche.contains(e.target)) fermer();
});
