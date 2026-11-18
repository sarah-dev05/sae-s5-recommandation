# Frontend — MUST

Site statique : HTML + CSS + JavaScript (modules ES), sans framework ni étape de build.
Le contrat avec le back est décrit dans [`docs/API.md`](../docs/API.md).

## Lancer le projet

Les modules ES ne marchent pas en ouvrant le fichier directement (`file://`) : il faut un petit serveur.

```bash
cd frontend
python3 -m http.server 5500
# puis ouvrir http://localhost:5500
```

Par défaut le front appelle le **vrai back** (`USE_MOCK = false`, voir plus bas). Les polices viennent de Google Fonts (connexion internet nécessaire pour les avoir).

## Parcours utilisateur

1. **Accueil** (`index.html`) : un film mis en avant, une rangée « Films du moment », un bouton « Lancer une recommandation ».
2. **Film** (`film.html?id=…`) : fiche d'un film (accessible depuis l'accueil ou la recherche de la navbar). Le bouton « Trouver des films similaires » ouvre la sélection avec ce film déjà choisi. Le back n'a pas de route « un film par id » : la page lit le cache `sessionStorage` et affiche « Film introuvable » si l'URL est ouverte dans un nouvel onglet (cache vide).
3. **Sélection** (`selection.html`, `?ids=…` optionnel) : on choisit 3 à 5 films ; le bouton « Voir mes recommandations » s'active à partir de 3.
4. **Recommandations** (`reco.html?ids=…`) : films proches, avec affiche, titre, score en % et synopsis (4 lignes max, texte complet au survol). Le dépliant « Pourquoi ? » a été remplacé par le synopsis (ancien code : commit `84d3e53`). « Modifier ma sélection » ramène à la sélection avec les mêmes films.

La navbar (logo MUST, Accueil, Recommandation, recherche) est présente sur toutes les pages. Il n'y a plus de footer.

## Rôle de chaque fichier

| Fichier | Rôle |
|---|---|
| `index.html` + `js/accueil.js` | Accueil : film mis en avant, bouton de recommandation, rangée « Films du moment » (20 premiers, défilement horizontal). |
| `selection.html` + `js/catalogue.js` | Recherche et sélection de 3 à 5 films (barre fixe en bas avec compteur). Lit `?ids=`. |
| `reco.html` + `js/reco.js` | Affiche la sélection (masquée si le cache est vide), puis les recommandations : affiche, titre, score, synopsis. |
| `film.html` + `js/film.js` | Fiche film. Lit `?id=` ; états chargement / « Film introuvable » (film absent du cache). |
| `js/navbar.js` | Construit la navbar (dans `<header id="navbar">`), la recherche déroulante (debounce 300 ms, 2 caractères minimum, 8 résultats, clavier). Le nom du site (`NOM`) est défini en haut de ce fichier. |
| `js/api.js` | **Seul fichier qui parle au back** : `getMovies`, `getMoviesByIds`, `getPopular`, `getMovie`, `getRecommendations`, avec leur version mock au même format. |
| `js/utils.js` | Fonctions partagées : `parseList`, `posterUrl`, `createPoster`, `createChips`, `realisateur`, `el`. |
| `js/mock-data.js` | **Généré** (ne pas modifier à la main) : 150 films au format brut de `app/movie.db`. |
| `css/style.css` | Tous les styles, couleurs dans les variables de `:root`. |
| `tools/export_mock.py` | Régénère `js/mock-data.js` : `python frontend/tools/export_mock.py` depuis la racine du dépôt (lit `app/movie.db` en lecture seule et l'ordre de `app/data/tmdb_seul.json`). |

Les `<title>` des pages sont dans chaque fichier HTML (ils doivent exister avant l'exécution du JS).

## Mock ou vrai back

Tout se règle en haut de `js/api.js` :

```js
export const USE_MOCK = false;                // true = données factices, sans back
const API_BASE = "http://localhost:8000";     // adresse du serveur Flask
```

- **`USE_MOCK = false` (état actuel)** : le **back Flask doit tourner** (`python main.py`, port 8000) et autoriser le CORS pour `http://localhost:5500` (déjà fait dans `app/__init__.py`). Le front doit donc être servi sur le port 5500.
- `USE_MOCK = true` : plus besoin du back, les pages marchent avec `js/mock-data.js`.
- Les pages n'ont rien d'autre à changer : chaque fonction d'`api.js` renvoie le même format dans les deux modes.

Routes réellement utilisées : [`docs/API.md`](../docs/API.md), section « Routes réellement utilisées en v1 ».

### Cache des films (vrai back)

Le back n'a pas de route « un film par id » ni « films par ids ». `getMovie` et `getMoviesByIds` lisent donc un cache dans `sessionStorage` (clé `filmsCache`), rempli à chaque réponse du back (accueil, recherche, recos).

- **Limite : 500 films** (les plus anciens sont supprimés). Quota `sessionStorage` : environ 5 Mo.
- Le cache est **propre à l'onglet** : un lien `reco.html?ids=…` ouvert dans un nouvel onglet n'a pas de cache : les recommandations s'affichent mais le bloc « Ta sélection » est masqué.
- À supprimer quand le back aura ces routes.

## Limites connues

- **Mock = 150 films** (les premiers de la liste TMDB `/movie/popular`), alors que la base en contient 9 828. La recherche en mock ne porte que sur ces 150 films.
- **Recommandations factices en mock** : 10 films non choisis avec un score décroissant inventé ; elles ne dépendent pas de la sélection (à part l'exclusion des films choisis).
- **« Films du moment »** = l'ordre de la liste `/movie/popular` de TMDB au moment de l'import (`app/data/tmdb_seul.json`). Ce n'est **pas** une popularité mise à jour. Attention : cet ordre n'est pas conservé par un `SELECT` sur `movie.db` (les lignes sortent triées par `tmdb_id`) : voir `docs/API.md`, constat 10.
- La page film n'affiche que les champs présents en base : pas d'année, de durée ni de note.
- Pas de pagination : la page de sélection affiche tous les films renvoyés pour la recherche.
- Pas de tests automatisés.

## Fait / Reste à faire

**Fait**
- Navbar commune avec recherche (debounce, clavier, accessibilité), wordmark MUST.
- Accueil, sélection (3 à 5 films), recommandations avec synopsis, page film.
- Couche `api.js` mock / vrai back, données mock générées depuis la vraie base.
- Documentation de l'API pour le back.

**Reste à faire**
- 2e méthode de recommandation.
- Vue de comparaison des méthodes + dashboard (Chart.js).
- Métriques réelles (aujourd'hui aucune n'est calculée ni affichée).
- Branding / maquette (le dossier `maquette/` contient la maquette v1).
- Page film fiable hors cache (nécessite une route back « un film par id »), avec une fiche détaillée (année, durée, note : absents de la table `Movie` actuelle).
- Remplacer le cache par de vraies routes back (film par id, films par ids).

## Conventions

- **Jamais `innerHTML` avec des données** : on crée les éléments avec `createElement` (helper `el()`) et on met le texte avec `textContent`.
- **Couleurs et mesures dans les variables CSS** de `:root` (`--bg`, `--surface-1`, `--surface-2`, `--line-strong`, `--text`, `--text-muted`, `--accent`, `--on-accent`, `--radius`, `--gutter`) : pas de valeur de couleur en dur dans les règles.
- **Un fichier JS par page** (`accueil.js`, `catalogue.js`, `reco.js`, `film.js`) ; le code commun est dans `navbar.js`, `utils.js` et `api.js`. Chaque fichier JS de page importe `./navbar.js`.
- Seul `api.js` fait des requêtes réseau.
- Focus clavier visible (`:focus-visible`), liens et boutons natifs pour être utilisables au clavier.
- Code simple, commenté en français.
