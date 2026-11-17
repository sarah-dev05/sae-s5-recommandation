"""Génère frontend/js/mock-data.js à partir de la vraie base app/movie.db.

Usage (depuis la racine du repo) : python frontend/tools/export_mock.py

- La base est ouverte en LECTURE SEULE (mode=ro) : on ne modifie rien dans app/.
- Les champs sont gardés au format brut de la base (genres, keywords, actors
  restent des chaînes JSON), pour que le front gère exactement ce que le back renverra.

Pourquoi lire aussi tmdb_seul.json ?
  Dans la table Movie, tmdb_id est un INTEGER PRIMARY KEY : SQLite s'en sert comme
  rowid et renvoie les lignes triées par tmdb_id, pas dans l'ordre d'insertion.
  Un simple "LIMIT 150" donnerait donc les plus petits ids (vieux films), pas les
  plus populaires. L'ordre de popularité n'existe que dans tmdb_seul.json, rempli
  page par page depuis /movie/popular de TMDB : on y lit l'ordre des ids, puis on
  va chercher les films dans la base.
"""
import json
import sqlite3
from pathlib import Path

NB_FILMS = 150
RACINE = Path(__file__).resolve().parents[2]
DB = RACINE / "app" / "movie.db"
JSON_TMDB = RACINE / "app" / "data" / "tmdb_seul.json"
SORTIE = RACINE / "frontend" / "js" / "mock-data.js"

CHAMPS = ["tmdb_id", "title", "synopsis", "genres", "keywords", "directors", "actors", "poster"]


def ids_par_popularite():
    """Ids TMDB dans l'ordre de /movie/popular, sans doublons."""
    with open(JSON_TMDB, encoding="utf-8") as f:
        films = json.load(f)
    # dict.fromkeys garde l'ordre et supprime les doublons (TMDB en renvoie entre deux pages)
    return list(dict.fromkeys(film["tmdbId"] for film in films))


def main():
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)  # lecture seule
    conn.row_factory = sqlite3.Row
    films = []
    for tmdb_id in ids_par_popularite():
        ligne = conn.execute(f"SELECT {', '.join(CHAMPS)} FROM Movie WHERE tmdb_id = ?", (tmdb_id,)).fetchone()
        if ligne is not None:
            films.append(dict(ligne))
        if len(films) == NB_FILMS:
            break
    conn.close()

    contenu = (
        "// Fichier GÉNÉRÉ par tools/export_mock.py : ne pas modifier à la main.\n"
        f"// {len(films)} films les plus populaires, au format brut de app/movie.db.\n"
        "export const MOCK_MOVIES = "
        + json.dumps(films, ensure_ascii=False, indent=2)
        + ";\n"
    )
    SORTIE.parent.mkdir(exist_ok=True)
    SORTIE.write_text(contenu, encoding="utf-8")
    print(f"{len(films)} films écrits dans {SORTIE.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
