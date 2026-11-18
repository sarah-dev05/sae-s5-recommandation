import numpy as np
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.MovieDAO import MovieDao

nltk.download('stopwords', quiet=True)

class RecommendationService:
    def __init__(self):
        self.movie_dao = MovieDao()
        self.movies = []
        self.cosine_sim = None
        self._preparer_modele()

    def _preparer_modele(self):
        self.movies = self.movie_dao.get_all_movies()
        if not self.movies:
            return

        textes = []
        for movie in self.movies:
            synopsis = movie.get('synopsis') or ''
            genres = movie.get('genres') or ''
            keywords = movie.get('keywords') or ''
            
            texte_combine = f"{synopsis} {genres} {keywords}"
            textes.append(texte_combine)

        mots_francais = stopwords.words('french')
        
        vectorizer = TfidfVectorizer(stop_words=mots_francais) 
        
        matrice_tfidf = vectorizer.fit_transform(textes)
        self.cosine_sim = cosine_similarity(matrice_tfidf)
        
    
    def get_recommendations(self, liste_ids_aimes, limite=10):

        if self.cosine_sim is None or not self.movies or not liste_ids_aimes:
            return []

        index_aimes = []
        for i, movie in enumerate(self.movies):
            if movie['tmdb_id'] in liste_ids_aimes:
                index_aimes.append(i)
        
        if not index_aimes:
            return []

        lignes_similarites = self.cosine_sim[index_aimes]
        
        scores_moyens = np.mean(lignes_similarites, axis=0)

        scores_similarite = list(enumerate(scores_moyens))
        scores_tries = sorted(scores_similarite, key=lambda x: x[1], reverse=True)

        films_recommandes = []
        for index, score in scores_tries:
            if index not in index_aimes:
                movie_data = self.movies[index].copy()
                movie_data['score'] = round(score * 100, 2)
                films_recommandes.append(movie_data)
            
            if len(films_recommandes) >= limite:
                break

        return films_recommandes