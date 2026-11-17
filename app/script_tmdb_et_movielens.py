import pandas as pd
import json

# 1. Charger votre fichier JSON TMDB
with open('tmdb_seul.json', 'r', encoding='utf-8') as f:
    tmdb_data = json.load(f)

df_tmdb = pd.DataFrame(tmdb_data)[['tmdbId', 'titre']]

# 2. Charger links.csv (directement dans le même dossier)
df_links = pd.read_csv('links.csv')
df_links = df_links.dropna(subset=['tmdbId'])
df_links['tmdbId'] = df_links['tmdbId'].astype(int)

# 3. Première jointure
df_mapped = pd.merge(df_tmdb, df_links[['movieId', 'tmdbId']], on='tmdbId', how='inner')

# 4. Charger ratings.csv (directement dans le même dossier)
df_ratings = pd.read_csv('ratings.csv')

# 5. Seconde jointure
df_final = pd.merge(df_mapped, df_ratings[['movieId', 'userId', 'rating']], on='movieId', how='inner')

# 6. Exporter le résultat
df_final.to_json('resultat_films_notes.json', orient='records', force_ascii=False, indent=4)
print("Fusion terminée ! Le fichier resultat_films_notes.json a été créé.")