import csv
import json

print("1. Chargement des données TMDB...")
# Ouverture du fichier JSON contenant tes films TMDB
with open('tmdb_seul.json', 'r', encoding='utf-8') as f:
    tmdb_data = json.load(f)

# Création d'un dictionnaire classique pour stocker {tmdbId: titre}
tmdb_dict = {}
for film in tmdb_data:
    identifiant_tmdb = film['tmdbId']
    titre_film = film['titre']
    tmdb_dict[identifiant_tmdb] = titre_film

print("2. Chargement de links.csv et liaison des identifiants...")
# Création d'un dictionnaire classique pour stocker les liens {movieId: infos_film}
movie_dict = {}
with open('links.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # On vérifie que la case contenant l'ID TMDB n'est pas vide
        if row['tmdbId'] != "": 
            # float() puis int() permet de gérer les nombres écrits "862.0" dans le CSV
            tmdb_id = int(float(row['tmdbId'])) 
            movie_id = int(row['movieId'])
            
            # Si le film TMDB lu dans le CSV fait partie de ceux qu'on a téléchargés
            if tmdb_id in tmdb_dict:
                # On sauvegarde ses infos dans notre nouveau dictionnaire
                movie_dict[movie_id] = {
                    "tmdbId": tmdb_id,
                    "titre": tmdb_dict[tmdb_id]
                }

print("3. Chargement de ratings.csv et croisement des notes...")
# Création d'une liste classique pour stocker notre résultat final
resultat_final = []
with open('ratings.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        movie_id = int(row['movieId'])
        
        # Si le film noté correspond à un film présent dans notre movie_dict
        if movie_id in movie_dict:
            # On récupère les infos stockées précédemment
            infos_film = movie_dict[movie_id]
            
            # On crée un nouveau dictionnaire pour cette note précise
            nouvelle_note = {
                "tmdbId": infos_film["tmdbId"],
                "titre": infos_film["titre"],
                "movieId": movie_id,
                "userId": int(row['userId']),
                "rating": float(row['rating'])
            }
            
            # On ajoute cette note à notre liste finale
            resultat_final.append(nouvelle_note)

print("4. Sauvegarde du fichier JSON...")
# On écrit la liste finale dans un nouveau fichier JSON
with open('resultat_films_notes.json', 'w', encoding='utf-8') as f:
    json.dump(resultat_final, f, ensure_ascii=False, indent=4)
    
print("🎉 Fusion terminée ! Le fichier resultat_films_notes.json a été créé.")