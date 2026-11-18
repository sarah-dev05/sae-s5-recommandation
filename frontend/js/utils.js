// Petites fonctions partagées par toutes les pages.

const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/";

// genres, keywords et actors arrivent en chaîne JSON ('["Drame","Crime"]').
// On accepte aussi un vrai tableau, au cas où le back les parse un jour.
export function parseList(champ) {
  if (Array.isArray(champ)) return champ;
  if (typeof champ !== "string" || champ === "") return [];
  try {
    const liste = JSON.parse(champ);
    return Array.isArray(liste) ? liste : [];
  } catch {
    return []; // chaîne mal formée : on n'affiche rien plutôt que de planter
  }
}

// Chemin TMDB ("/abc.jpg") -> URL complète, ou null si le film n'a pas d'affiche.
// "taille" = largeur TMDB : w342 par défaut, w500 pour les grandes affiches.
export function posterUrl(chemin, taille = "w342") {
  return chemin ? TMDB_IMG_BASE + taille + chemin : null;
}

// Crée l'élément affiche : une <img>, ou un bloc gris (placeholder CSS) si pas d'affiche.
export function createPoster(film, taille) {
  const url = posterUrl(film.poster, taille);
  if (!url) {
    const vide = document.createElement("div");
    vide.className = "poster poster--empty";
    vide.textContent = "Pas d'affiche";
    return vide;
  }
  const img = document.createElement("img");
  img.className = "poster";
  img.src = url;
  img.alt = "Affiche de " + film.title;
  img.loading = "lazy"; // le navigateur ne charge l'image que quand elle approche de l'écran
  return img;
}

// Petit élément HTML avec du texte (évite de répéter createElement + textContent).
export function el(tag, className, texte) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (texte) e.textContent = texte;
  return e;
}

// Liste de petites pastilles (genres, mots-clés...) à partir d'un tableau de textes.
export function createChips(liste) {
  const ul = el("ul", "chips");
  for (const texte of liste) ul.append(el("li", "chip", texte));
  return ul;
}

// Le réalisateur vaut parfois "Inconnu" dans la base : on le traite comme absent ("").
export function realisateur(film) {
  return film.directors && film.directors !== "Inconnu" ? film.directors : "";
}
