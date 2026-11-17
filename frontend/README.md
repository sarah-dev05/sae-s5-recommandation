# Frontend — MUST (My Ultimate Screen Taste)

Site statique : HTML + CSS + JavaScript (modules ES), sans framework ni étape de build.
Le contrat avec le back est décrit dans [`docs/API.md`](../docs/API.md).

## Lancer le projet

Les modules ES ne marchent pas en ouvrant le fichier directement (`file://`) : il faut un petit serveur.

```bash
cd frontend
python3 -m http.server 5500
# puis ouvrir http://localhost:5500
```

Par défaut le front tourne **avec des données factices** (mock), sans back. Les polices viennent de Google Fonts (connexion internet nécessaire pour les avoir).

## Parcours utilisateur

1. **Accueil** (`index.html`) : un film mis en avant, une rangée « Films du moment », un bouton « Lancer une recommandation ».
2. **Film** (`film.html?id=…`) : fiche d'un film (accessible depuis l'accueil ou la recherche de la navbar). Le bouton « Trouver des films similaires » ouvre la sélection avec ce film déjà choisi.
3. **Sélection** (`selection.html`, `?ids=…` optionnel) : on choisit 3 à 5 films ; le bouton « Voir mes recommandations » s'active à partir de 3.
4. **Recommandations** (`reco.html?ids=…`) : films proches, avec un score et un dépliant « Pourquoi ? ». « Modifier ma sélection » ramène à la sélection avec les mêmes films.

La navbar (logo MUST, Accueil, Recommandation, recherche) et le footer sont présents sur toutes les pages.

## Rôle de chaque fichier

| Fichier | Rôle |
|---|---|
| `index.html` + `js/accueil.js` | Accueil : film mis en avant, bouton de recommandation, rangée « Films du moment » (20 premiers, défilement horizontal). |
| `selection.html` + `js/catalogue.js` | Recherche et sélection de 3 à 5 films (barre fixe en bas avec compteur). Lit `?ids=`. |
| `reco.html` + `js/reco.js` | Affiche la sélection, les recommandations et le « Pourquoi ? » (calculé côté front : genres, acteurs, mots-clés, réalisateur en commun). |
| `film.html` + `js/film.js` | Fiche film. Lit `?id=` ; états chargement / erreur / « Film introuvable ». |
| `js/navbar.js` | Construit la navbar (dans `<header id="navbar">`), la recherche déroulante (debounce 300 ms, 2 caractères minimum, 8 résultats, clavier) et le footer. Le nom du site (`NOM`, `SIGNIFICATION`) est défini en haut de ce fichier. |
| `js/api.js` | **Seul fichier qui parle au back** : `getMovies`, `getMoviesByIds`, `getPopular`, `getMovie`, `getRecommendations`, avec leur version mock au même format. |
| `js/utils.js` | Fonctions partagées : `parseList`, `posterUrl`, `createPoster`, `createChips`, `realisateur`, `el`. |
| `js/mock-data.js` | **Généré** (ne pas modifier à la main) : 150 films au format brut de `app/movie.db`. |
| `css/style.css` | Tous les styles, couleurs dans les variables de `:root`. |
| `tools/export_mock.py` | Régénère `js/mock-data.js` : `python frontend/tools/export_mock.py` depuis la racine du dépôt (lit `app/movie.db` en lecture seule et l'ordre de `app/data/tmdb_seul.json`). |

Les `<title>` des pages sont dans chaque fichier HTML (ils doivent exister avant l'exécution du JS).

## Passer du mock au vrai back

Tout se règle en haut de `js/api.js` :

```js
export const USE_MOCK = true;                 // false = appeler le vrai back
const API_BASE = "http://localhost:8000";     // adresse du serveur Flask
```

1. Mettre `USE_MOCK = false`.
2. Vérifier `API_BASE` (le back doit tourner et autoriser le CORS pour `http://localhost:5500`).
3. Les pages n'ont rien d'autre à changer : chaque fonction d'`api.js` renvoie le même format en mock et en vrai.

Routes attendues, formats JSON et codes d'erreur : [`docs/API.md`](../docs/API.md).

## Limites connues

- **Mock = 150 films** (les premiers de la liste TMDB `/movie/popular`), alors que la base en contient 9 828. La recherche en mock ne porte que sur ces 150 films.
- **Recommandations factices en mock** : 10 films non choisis avec un score décroissant inventé ; elles ne dépendent pas de la sélection (à part l'exclusion des films choisis). Le « Pourquoi ? » est lui calculé pour de vrai à partir des champs des films.
- **« Films du moment »** = l'ordre de la liste `/movie/popular` de TMDB au moment de l'import (`app/data/tmdb_seul.json`). Ce n'est **pas** une popularité mise à jour. Attention : cet ordre n'est pas conservé par un `SELECT` sur `movie.db` (les lignes sortent triées par `tmdb_id`) : voir `docs/API.md`, constat 10.
- La page film n'affiche que les champs présents en base : pas d'année, de durée ni de note.
- Pas de pagination : la page de sélection affiche tous les films renvoyés pour la recherche.
- Pas de tests automatisés.

## Fait / Reste à faire

**Fait**
- Navbar commune avec recherche (debounce, clavier, accessibilité), footer, wordmark MUST.
- Accueil, sélection (3 à 5 films), recommandations avec « Pourquoi ? », page film.
- Couche `api.js` mock / vrai back, données mock générées depuis la vraie base.
- Documentation de l'API pour le back.

**Reste à faire**
- 2e méthode de recommandation.
- Vue de comparaison des méthodes + dashboard (Chart.js).
- Métriques réelles (aujourd'hui aucune n'est calculée ni affichée).
- Branding / maquette (le dossier `maquette/` contient la maquette v1).
- Fiche film détaillée (année, durée, note : absents de la table `Movie` actuelle).
- Brancher le vrai back (voir `docs/API.md` : le back n'a pas encore de routes).

## Conventions

- **Jamais `innerHTML` avec des données** : on crée les éléments avec `createElement` (helper `el()`) et on met le texte avec `textContent`.
- **Couleurs et mesures dans les variables CSS** de `:root` (`--bg`, `--surface-1`, `--surface-2`, `--line-strong`, `--text`, `--text-muted`, `--accent`, `--on-accent`, `--radius`, `--gutter`) : pas de valeur de couleur en dur dans les règles.
- **Un fichier JS par page** (`accueil.js`, `catalogue.js`, `reco.js`, `film.js`) ; le code commun est dans `navbar.js`, `utils.js` et `api.js`. Chaque fichier JS de page importe `./navbar.js`.
- Seul `api.js` fait des requêtes réseau.
- Focus clavier visible (`:focus-visible`), liens et boutons natifs pour être utilisables au clavier.
- Code simple, commenté en français.
