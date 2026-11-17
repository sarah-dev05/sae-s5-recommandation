import requests
import time
import json

#N'oubliez pas d'utiliser votre NOUVELLE clé API
API_KEY = "5022cda07533095d2c53f3ea57862807"
BASE_URL = "https://api.themoviedb.org/3/movie"

def recuperer_films_tmdb_seul():
    films_enrichis = []
    tmdb_ids = []

    print("1. Récupération d'une liste de films populaires...")
    # On récupère les IDs des films sur les 3 premières pages (60 films)
    # Vous pourrez augmenter range(1, 4) vers range(1, 50) plus tard
    for page in range(1, 500):
        url_popular = f"{BASE_URL}/popular?api_key={API_KEY}&language=fr-FR&page={page}"
        reponse = requests.get(url_popular)
        
        if reponse.status_code == 200:
            donnees = reponse.json()
            for film in donnees.get("results", []):
                tmdb_ids.append(film["id"])
        else:
            print(f"Erreur lors de la récupération de la page {page}")
        
        time.sleep(0.05)

    print(f"\n2. Récupération des détails (acteurs, réalisateur, mots-clés) pour {len(tmdb_ids)} films...")
    
    for tmdb_id in tmdb_ids:
        # append_to_response permet d'avoir le casting et les thèmes
        url_details = f"{BASE_URL}/{tmdb_id}?api_key={API_KEY}&language=fr-FR&append_to_response=credits,keywords"
        
        try:
            reponse_details = requests.get(url_details)
            if reponse_details.status_code == 200:
                data = reponse_details.json()
                
                genres = [g['name'] for g in data.get('genres', [])]
                keywords = [k['name'] for k in data.get('keywords', {}).get('keywords', [])]
                
                crew = data.get('credits', {}).get('crew', [])
                director = next((member['name'] for member in crew if member['job'] == 'Director'), "Inconnu")
                
                cast = data.get('credits', {}).get('cast', [])
                top_acteurs = [acteur['name'] for acteur in cast[:3]]
                
                film_info = {
                    "tmdbId": tmdb_id,
                    "titre": data.get('title'),
                    "synopsis": data.get('overview'),
                    "genres": genres,
                    "mots_cles": keywords,
                    "realisateur": director,
                    "acteurs": top_acteurs,
                    "affiche": data.get('poster_path')
                }
                
                films_enrichis.append(film_info)
                print(f"Récupéré : {film_info['titre']}")
        except Exception as e:
            print(f"Erreur pour l'ID {tmdb_id} : {e}")
            
        # Pause anti-blocage (Rate Limiting)
        time.sleep(0.05) 

    # 3. Sauvegarde finale dans un fichier JSON
    with open("tmdb_seul.json", "w", encoding="utf-8") as f:
        json.dump(films_enrichis, f, ensure_ascii=False, indent=4)
        
    print(f"\nTerminé ! {len(films_enrichis)} films complets sauvegardés dans 'tmdb_seul.json'.")

if __name__ == "__main__":
    recuperer_films_tmdb_seul()