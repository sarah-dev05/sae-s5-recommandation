// Petites fonctions partagées par les deux pages.

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";

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
export function posterUrl(chemin) {
  return chemin ? TMDB_IMG + chemin : null;
}

// Crée l'élément affiche : une <img>, ou un bloc gris (placeholder CSS) si pas d'affiche.
export function createPoster(film) {
  const url = posterUrl(film.poster);
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
