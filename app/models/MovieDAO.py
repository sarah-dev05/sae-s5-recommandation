from sqlalchemy.orm import sessionmaker
from app.models.base import get_engine
from app.models.Movie import Movie

engine = get_engine()
Sessionlocal = sessionmaker(bind=engine)

class MovieDao:

    def get_movie_by_id(self, tmdb_id):
        with Sessionlocal() as session:
            movie = session.get(Movie, tmdb_id)

            if movie is None :
                return None

            return movie.to_dict()

    def get_all_movies(self):
        with Sessionlocal() as session :
            movies = session.query(Movie).all()

            resultats = []
            for movie in movies:
                resultats.append(movie.to_dict())
            return resultats

    def get_multiple_movie_by_ids(self, ids) : # [12, 45, 89] type de parametre attendu

        if not ids :
            return []
            
        with Sessionlocal() as session :
            movies = session.query(Movie).filter(Movie.tmdb_id.in_(ids)
            ).all()

        resultats = []
        for movie in movies:
            resultats.append(movie.to_dict())
        return resultats