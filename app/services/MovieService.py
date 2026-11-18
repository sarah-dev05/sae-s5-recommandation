from app.models.MovieDAO import MovieDao

class MovieService:
    def __init__(self):
        self.movie_dao = MovieDao()

    def get_home_movies(self, limite=30):
        return self.movie_dao.get_initial_movies(limite)

    def get_movies(self, texte_recherche):
        return self.movie_dao.search_movies_by_title(texte_recherche)

    def get_selected_movies(self, liste_ids):
        return self.movie_dao.get_multiple_movie_by_ids(liste_ids)