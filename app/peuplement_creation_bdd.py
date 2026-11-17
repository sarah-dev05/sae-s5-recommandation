import sqlite3
import json
import os

DB_FILE = "movie.db"

# Cette ligne trouve le chemin exact du dossier où se trouve ce script
chemin_script = os.path.dirname(os.path.abspath(__file__))

# os.path.join permet de coller le chemin du dossier et le nom du fichier passé en paramètre
DOSSIER_DATA = os.path.join(chemin_script, "data")

# On indique le lieu où doit apparaître le fichier .db
DB_FILE = os.path.join(chemin_script, "movie.db")

def get_db_connection():
    # On se connecte au fichier 
    conn = sqlite3.connect(DB_FILE)
    return conn

def initialiser_bdd():  
    # On se connecte
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # On crée les tables si elles n'existent pas
    script_creation = """
    
        ---Nous mettons cette table en commentaire car pour le moment nous n'en avons pas besoin
        ---CREATE TABLE IF NOT EXISTS User (
            ---user_id INTEGER PRIMARY KEY
        ---);


        CREATE TABLE IF NOT EXISTS Movie (
            tmdb_id INTEGER PRIMARY KEY,
            title TEXT,
            synopsis TEXT,
            genres TEXT,
            keywords TEXT,
            directors TEXT,
            actors TEXT,
            poster TEXT
        );


        CREATE TABLE IF NOT EXISTS Rates (
            rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
            rating REAL,
            movie_id INTEGER,
            user_id INTEGER,
            FOREIGN KEY (movie_id) REFERENCES Movie(tmdb_id)
        );
    """
    cursor.executescript(script_creation)
    conn.commit()
    
    # On ferme la connexion
    conn.close()
    print("Insert fait !")

def importer_movie():
    print("Import des films")
    try:
            # On se connecte
            conn = get_db_connection()
            cursor = conn.cursor()

            # On met le chemin vers le fichier dans une variable
            chemin_fichier = os.path.join(DOSSIER_DATA, "tmdb_seul.json") # os.path.join permet de coller le chemin du dossier et le nom du fichier passé en paramètre
            
            # On ouvre et on lit le JSON
            with open(chemin_fichier, 'r', encoding='utf-8') as f:
                data_json = json.load(f)

            # On utilise OR IGNORE pour ne pas planter si l'ID existe déjà 
            sql = "INSERT OR IGNORE INTO MOVIE (tmdb_id, title, synopsis, genres, keywords, directors, actors, poster) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            
            nb_ligne = 0
            for movie in data_json:
                # On récupère les valeurs du JSON qu'on a besoin pour remplir la table DEPARTEMENT
                valeurs = (
                    movie['tmdbId'], 
                    movie['titre'],
                    movie['synopsis'],
                    json.dumps(movie.get("genres", []), ensure_ascii=False),
                    json.dumps(movie.get("mots_cles", []), ensure_ascii=False),
                    movie['realisateur'],
                    json.dumps(movie.get("acteurs", []), ensure_ascii=False),
                    movie['affiche'],
                )
                
                # On exécute l'insertion avec les valeurs qu'on a récupéré
                cursor.execute(sql, valeurs)
                nb_ligne += 1

            conn.commit()
            print(f" Importation réussi : {nb_ligne} films ont été importés !")

            # On ferme la connexion
            cursor.close()
            conn.close()

        # On gère les potentielles erreurs
    except Exception as e:
            print(f"Une erreur est survenue : {e}")


def importer_rates ():
    print("Import les notes")
    try:
            # On se connecte
            conn = get_db_connection()
            cursor = conn.cursor()
     
            # On met le chemin vers le fichier dans une variable
            chemin_fichier = os.path.join(DOSSIER_DATA, "resultat_films_notes.json") # os.path.join permet de coller le chemin du dossier et le nom du fichier passé en paramètre
                 
            # On ouvre et on lit le JSON
            with open(chemin_fichier, 'r', encoding='utf-8') as f:
                data_json = json.load(f)
     
            # On utilise OR IGNORE pour ne pas planter si l'ID existe déjà 
            sql = "INSERT OR IGNORE INTO RATES (rating, movie_id, user_id) VALUES (?, ?, ?)"
                 
            nb_ligne = 0
            for rate in data_json:
                # On récupère les valeurs du JSON qu'on a besoin pour remplir la table DEPARTEMENT
                valeurs = (
                rate['rating'], 
                rate['tmdbId'],
                rate['userId'],
                )
                     
                # On exécute l'insertion avec les valeurs qu'on a récupéré
                cursor.execute(sql, valeurs)
                nb_ligne += 1
     
            conn.commit()
            print(f" Importation réussi : {nb_ligne} notes ont été importés !")
     
            # On ferme la connexion
            cursor.close()
            conn.close()
     
        # On gère les potentielles erreurs
    except Exception as e:
                 print(f"Une erreur est survenue : {e}")

if __name__ == "__main__":
        print("DEMARRAGE DE L'IMPORTATION ")
        
        # On lance les fonctions dans l'ordre
        try:
            # On crée les tables
            initialiser_bdd()
            
            #On lance les importations des films
            importer_movie()       
            

            #On lance les importations des notes
            importer_rates()

            print("TOUT A ETE IMPORTE AVEC SUCCES DANS 'movie.db' !")

        #On gère les potentielles erreurs   
        except Exception as e:
            print(f"\n Le programme s'est arrêté à cause d'une erreur : {e}")

