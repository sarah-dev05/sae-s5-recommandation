import csv
import json

with open('tmdb_seul.json', 'r', encoding='utf-8') as f:
    tmdb_data = json.load(f)

tmdb_dict = {}
for film in tmdb_data:
    identifiant_tmdb = film['tmdbId']
    titre_film = film['titre']
    tmdb_dict[identifiant_tmdb] = titre_film

movie_dict = {}
with open('links.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['tmdbId'] != "": 
            tmdb_id = int(float(row['tmdbId'])) 
            movie_id = int(row['movieId'])
            
            if tmdb_id in tmdb_dict:
                movie_dict[movie_id] = {
                    "tmdbId": tmdb_id,
                    "titre": tmdb_dict[tmdb_id]
                }

resultat_final = []
with open('ratings.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        movie_id = int(row['movieId'])
        
        if movie_id in movie_dict:
            infos_film = movie_dict[movie_id]
            
            nouvelle_note = {
                "tmdbId": infos_film["tmdbId"],
                "titre": infos_film["titre"],
                "movieId": movie_id,
                "userId": int(row['userId']),
                "rating": float(row['rating'])
            }
            
            resultat_final.append(nouvelle_note)

with open('resultat_films_notes.json', 'w', encoding='utf-8') as f:
    json.dump(resultat_final, f, ensure_ascii=False, indent=4)
    
print("Le fichier resultat_films_notes.json a été créé.")