# API attendue par le front (à implémenter côté back)

Document rédigé à partir du code de `frontend/js/api.js` (appels), `frontend/js/*.js` (utilisation des réponses)
et `app/` (état du back). Rien ici n'est supposé : chaque exemple reprend le format du mock
(`frontend/js/mock-data.js`, généré depuis `app/movie.db`).

- Base : `API_BASE = "http://localhost:8000"` (constante en haut de `frontend/js/api.js` ; `main.py` lance Flask sur `localhost:8000`).
- Tous les appels sont faits avec `fetch`. Les réponses doivent être du **JSON**.
- Le front n'envoie aucun en-tête d'authentification ni cookie.

## Objet « film »

Format renvoyé par toutes les routes. Ce sont les colonnes de la table `Movie` de `app/movie.db`, avec les mêmes noms :

```json
{
  "tmdb_id": 584586,
  "title": "0.0MHz",
  "synopsis": "Les membres d'un groupe de recherche mystérieux appelé 0.0MHz expérimentent l'horreur dans une maison hantée.",
  "genres": "[\"Horreur\"]",
  "keywords": "[\"based on comic\", \"based on webcomic or webtoon\"]",
  "directors": "You Sun-dong",
  "actors": "[\"정원창\", \"최윤영\", \"신주환\"]",
  "poster": "/9usnHrtzl6CejBTr8JTvQtxTLAS.jpg"
}
```

| Champ | Type attendu | Ce que fait le front |
|---|---|---|
| `tmdb_id` | **nombre** JSON (pas une chaîne) | Comparé avec `===` à des nombres (sélection, mock `getMovie`) : une chaîne `"584586"` casserait la sélection. Nom exact : `tmdb_id` (pas `tmdbId`). |
| `title` | chaîne | Affiché partout. |
| `synopsis` | chaîne (peut être vide) | Vide : le front n'affiche pas de synopsis. |
| `genres`, `keywords`, `actors` | **tableau** de chaînes **ou** chaîne JSON de tableau | Lus par `parseList()` (`utils.js`) : un tableau est pris tel quel, une chaîne est passée à `JSON.parse`. Vide, `null`, non-chaîne ou JSON invalide → liste vide (rien n'est affiché, pas d'erreur). La base stocke aujourd'hui des chaînes JSON. |
| `directors` | chaîne | `""` ou `"Inconnu"` → traité comme absent (réalisateur masqué). 24 films de la base valent `"Inconnu"`. |
| `poster` | chemin TMDB (`"/abc.jpg"`) ou vide | Le front construit `https://image.tmdb.org/t/p/w342<poster>` (cartes) ou `/w500<poster>` (grandes affiches). Vide / `null` → bloc gris « Pas d'affiche ». 8 films de la base ont un poster vide. |

Le front n'affiche ni année, ni durée, ni note : ces champs ne sont pas dans la table `Movie`.
Des champs supplémentaires dans le JSON sont ignorés.

## Routes

### 1. `GET /api/movies?search=<texte>` — recherche par titre

Utilisée par la page de sélection (`catalogue.js`, au chargement avec `search=` vide, puis à chaque recherche) et par la recherche de la navbar (`navbar.js`, à partir de 2 caractères, après 300 ms sans frappe).

- Paramètre : `search` (chaîne, URL-encodée ; peut être vide).
- Comportement attendu (celui du mock) : films dont le **titre contient** le texte, **sans tenir compte de la casse ni des accents** (« ecran » trouve « Écran »). Texte vide : tous les films.
- Pas de paramètre de pagination ou de limite côté front : la sélection affiche tout ce qui est renvoyé ; la navbar garde les 8 premiers.

```
GET http://localhost:8000/api/movies?search=model
```
```json
[
  {
    "tmdb_id": 1792170,
    "title": "Model Citizen",
    "synopsis": "Un homme sort du coma et découvre que son bien-être est désormais placé sous la responsabilité d’un avatar numérique mis à sa disposition par le gouvernement.",
    "genres": "[\"Crime\", \"Science-Fiction\", \"Thriller\"]",
    "keywords": "[]",
    "directors": "Tag Mendillo",
    "actors": "[\"Aaron Eckhart\", \"Emmanuelle Chriqui\", \"Paul Braunstein\"]",
    "poster": "/7SE0LBwgqiqZzkm9gKVbBAbcNQL.jpg"
  }
]
```
Réponse : **tableau** de films (`[]` si rien ne correspond : le front affiche « Aucun film trouvé »).

### 2. `GET /api/movies?ids=<id,id,...>` — films par identifiants

Utilisée par `reco.js` pour afficher « Ta sélection ».

- Paramètre : `ids`, `tmdb_id` séparés par des virgules (3 à 5 en pratique, mais le front ne limite pas ce qu'il envoie).
- Réponse : tableau des films trouvés (un id inconnu est simplement absent ; l'ordre n'est pas utilisé par le front).

```
GET http://localhost:8000/api/movies?ids=1792170,584586
```
```json
[
  { "tmdb_id": 1792170, "title": "Model Citizen", "…": "(champs de l'objet film)" },
  { "tmdb_id": 584586, "title": "0.0MHz", "…": "(champs de l'objet film)" }
]
```
(Les `…` abrègent l'exemple ; la vraie réponse contient tous les champs de l'objet film.)

Cette route et la précédente partagent le chemin `/api/movies` : `ids` présent → recherche par ids, sinon `search`.

### 3. `GET /api/movies/popular?limit=<n>` — « films du moment »

Utilisée par l'accueil (`accueil.js`) avec `limit=20` : le 1er film est mis en avant, les 20 forment la rangée.

- Paramètre : `limit` (entier, 20 par défaut côté front).
- Réponse : tableau de `limit` films **dans l'ordre à afficher**. Le front ne trie pas.
- À savoir (voir « Constats ») : l'ordre « populaire » n'est pas celui d'un `SELECT` sur la table `Movie`.

```
GET http://localhost:8000/api/movies/popular?limit=2
```
```json
[
  { "tmdb_id": 687163, "title": "Projet Dernière Chance", "…": "(champs de l'objet film)" },
  { "tmdb_id": 1423191, "title": "Resident Evil", "…": "(champs de l'objet film)" }
]
```
Les deux premiers films du mock (`MOCK_MOVIES.slice(0, limit)`).

### 4. `GET /api/movies/<id>` — un film

Utilisée par la page film (`film.js`, `film.html?id=<id>`). Le front n'appelle la route que si l'id est composé uniquement de chiffres.

```
GET http://localhost:8000/api/movies/584586
```
Réponse : **un objet film** (pas un tableau).

- **404** : le front affiche « Film introuvable » (c'est le seul code traité à part).
- Autre code non-2xx ou serveur injoignable : message « Impossible de charger le film (Erreur serveur <code>) ».

`/api/movies/popular` doit être déclarée avant (ou distinguée de) `/api/movies/<int:id>`.

### 5. `POST /api/recommend` — recommandations

Utilisée par `reco.js` pour une sélection de 3 à 5 films.

```
POST http://localhost:8000/api/recommend
Content-Type: application/json

{ "tmdb_ids": [1792170, 584586, 687163] }
```
Corps : `tmdb_ids`, tableau de nombres.

Réponse attendue : un **objet** avec `results`, un tableau de films **plus un champ `score`** (nombre, affiché avec 2 décimales : « Score : 0.95 »). Le front affiche les résultats dans l'ordre reçu : le tri par score décroissant est à faire côté back.

```json
{
  "results": [
    {
      "tmdb_id": 1423191,
      "title": "Resident Evil",
      "synopsis": "Bryan, un coursier médical, est en train d'effectuer une livraison lorsqu'une épidémie soudaine se déclare, le forçant à lutter pour sa survie.",
      "genres": "[\"Horreur\", \"Science-Fiction\", \"Aventure\"]",
      "keywords": "[\"isolation\", \"infection\", \"outbreak\", \"survival\", \"zombie\", \"virus\"]",
      "directors": "Zach Cregger",
      "actors": "[\"Austin Abrams\", \"Paul Walter Hauser\", \"Kali Reis\"]",
      "poster": "/pICoWjcKSet6sA3yzxOkP8ChwYI.jpg",
      "score": 0.95
    }
  ]
}
```
(Film du mock, `keywords` raccourci pour la lecture ; un résultat = un objet film complet + `score`.)

- Chaque résultat **doit contenir** `genres`, `keywords`, `actors`, `directors` : le front calcule lui-même le bloc « Pourquoi ? » en comparant ces champs avec ceux des films choisis.
- Le mock renvoie 10 résultats (les films non choisis, score 0.95 puis −0.05 par film) ; le front accepte n'importe quel nombre. `results: []` affiche « Aucune recommandation trouvée ».
- Erreur HTTP (non-2xx) ou serveur injoignable : « Impossible de charger les recommandations (…) ».

## Gestion des erreurs côté front

`requete()` (`api.js`) lève une erreur « Erreur serveur <code> » pour tout code non-2xx, puis la page affiche le message
« … Le serveur est-il lancé ? ». Seul le **404 de `GET /api/movies/<id>`** est interprété (« Film introuvable »).
Le front ne lit pas le corps des réponses d'erreur.

## Pourquoi CORS est nécessaire

### Le constat
Le sujet impose un frontend et un backend « totalement séparés ». Concrètement :
- le front (HTML/CSS/JS) est servi par un serveur de fichiers statiques, ex. `python3 -m http.server 5500` ;
- le back Flask tourne sur `http://localhost:8000` et ne renvoie que du JSON.

Ce sont deux programmes, donc deux ports différents.

### La règle du navigateur
Pour un navigateur, une « origine » = protocole + hôte + **port**.
`http://localhost:5500` et `http://localhost:8000` sont donc deux origines différentes,
**même sur la même machine**.

Par sécurité (*same-origin policy*), le navigateur bloque par défaut la lecture
d'une réponse venant d'une autre origine. Sans réglage, chaque `fetch` du front échoue avec :
`blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.

Ce blocage se produit sur toutes les machines : la nôtre, celle des autres membres, celle du prof en démo.

### La solution
C'est le **serveur** qui autorise une origine, via l'en-tête `Access-Control-Allow-Origin`.
Le front ne peut pas contourner ce blocage. Avec Flask, l'extension `flask-cors` s'en charge :

    pip install flask-cors

    from flask_cors import CORS
    CORS(app, origins=[r"http://localhost:\d+", r"http://127\.0\.0\.1:\d+"])

L'expression régulière autorise n'importe quel port en local, donc ça marche quel que soit
le port utilisé pour lancer le front. En cas de mise en ligne, il faudra remplacer cette règle par l'adresse réelle du front.

### Pourquoi on ne passe pas par Jinja
Avec Jinja, Flask génère le HTML et tout est sur la même origine (pas de CORS),
mais front et back redeviennent couplés, ce qui va à l'encontre du sujet.
CORS est la conséquence directe du découplage demandé.

Référence : https://developer.mozilla.org/fr/docs/Web/HTTP/CORS

## Constats sur le backend actuel (`app/`, `main.py`)

Vérifiés dans le code ; les points marqués (exécuté) ont aussi été testés avec SQLAlchemy installé dans un environnement temporaire,
sans modifier le dépôt. Aucune action n'est présupposée : ce sont des constats.

1. **`app/__init__.py` est vide** (0 octet) alors que `main.py` fait `from app import create_app`. (exécuté) `python main.py` → `ImportError: cannot import name 'create_app' from 'app'`.
2. **Aucune route, aucun blueprint, aucun service** : `app/blueprints/`, `app/services/`, `app/static/`, `app/templates/` ne contiennent qu'un `__init__.py` vide. Aucune occurrence de Flask, `route`, `Blueprint` ou `cors` dans les fichiers Python du dépôt.
3. **Dépendances non déclarées** : aucun `requirements.txt` / `pyproject.toml` versionné. Flask, flask-cors et SQLAlchemy ne sont pas installés dans l'environnement Python local testé.
4. **Nom de table différent** : `app/models/Movie.py` déclare `__tablename__ = 'movies'` ; `app/movie.db` (créée par `app/peuplement_creation_bdd.py`) contient la table `Movie`. Idem pour `rates` (modèle) / `Rates` (base). (exécuté) `get_movie_by_id(2)` → `OperationalError: no such table: movies`.
5. **Nom de colonne différent** : le modèle déclare `tmdbId` (et `ForeignKey('movies.tmdbId')` dans `Rates.py`) ; la base a `tmdb_id`. Le front attend `tmdb_id` ; `to_dict()` (`base.py`) renvoie les noms de colonnes du modèle, donc `tmdbId`.
6. **`MovieDAO.get_multiple_movie_by_ids`** filtre sur `Movie.tmdb_id`, attribut qui n'existe pas dans le modèle (`tmdbId`). (exécuté) → `AttributeError: type object 'Movie' has no attribute 'tmdb_id'`.
7. **Relation `Rates` non résolue** : `Movie.py` référence `relationship('Rates')` mais `MovieDAO.py` n'importe que `Movie`. (exécuté) Sans import préalable de `Rates`, la première requête échoue avec `InvalidRequestError: … expression 'Rates' failed to locate a name`.
8. **Contraintes du modèle absentes de la base** : le modèle déclare `unique=True` sur `title`, `synopsis`, `poster` et `nullable=False` partout ; la table créée n'a ni UNIQUE ni NOT NULL. Les données ne respecteraient pas le modèle : 208 titres présents plusieurs fois, 1 synopsis non vide présent plusieurs fois, 652 synopsis vides (chaîne vide), 8 posters vides. Longueurs déclarées (`String(100)` pour `actors`/`directors`, `String(1000)` pour `keywords`) : `keywords` atteint 1546 caractères en base (SQLite n'applique pas ces limites).
9. **Le DAO couvre 3 opérations** (`get_movie_by_id`, `get_all_movies`, `get_multiple_movie_by_ids`). Il n'y a rien pour la recherche par titre, les films « populaires » ni la recommandation.
10. **L'ordre « populaire » n'est pas conservé dans `movie.db`** : `peuplement_creation_bdd.py` insère les films dans l'ordre de `app/data/tmdb_seul.json` (liste TMDB `/movie/popular`), mais `tmdb_id` est un `INTEGER PRIMARY KEY` (alias du rowid SQLite) : un `SELECT` renvoie les lignes triées par `tmdb_id` (les 5 premières : 2, 5, 11, 12, 13). Le 1er film du JSON est 687163. L'ordre n'existe que dans `tmdb_seul.json` ; c'est de là que `frontend/tools/export_mock.py` le lit pour produire le mock (150 films). La base contient 9 828 films pour 9 980 entrées dans le JSON (`INSERT OR IGNORE` ignore les doublons d'id).
11. **Tables** : `Movie` (9 828 lignes) et `Rates` (87 339 lignes). Les notes ne sont utilisées par aucune route ni par le front.

## Points à décider côté back

- **Ordre de `/api/movies/popular`** (constat 10) : pour renvoyer le bon ordre, il faut **stocker un rang de popularité** (par exemple une colonne `popularity_rank` remplie à l'import depuis l'ordre de `tmdb_seul.json`). Sans cela, le back ne peut pas reproduire l'ordre du mock : un `SELECT` sur `Movie` renvoie les lignes triées par `tmdb_id`.
- Recherche sans texte (`search=` vide) : le front l'appelle au chargement de la page de sélection et affiche tout ; avec 9 828 films, une limite côté back serait à prévoir (le front ne la gère pas aujourd'hui).
- Casse/accents dans la recherche : le mock les ignore (`normalize("NFD")`) ; le comportement du back est à aligner.
