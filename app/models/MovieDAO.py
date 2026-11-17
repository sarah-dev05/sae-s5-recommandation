    from sqlalchemy.orm import sessionmaker
    from app.models.base import get_engine
    from app.models.Movie import Movie

    engine = get_engine()
    Sessionlocal = sessionmaker(bind=engine)

    class MovieDao:

        @staticmethod
        def get_movie_by_id(tmdb_id):
            with Sessionlocal() as session:
                movie = session.get(Movie, tmdb_id)

                if movie is None :
                    return None

                return movie.to_dict()

        @staticmethod
        def get_all_movies():
            with Sessionlocal() as session :
                movies = session.query(Movie).all()

                return[ movie.to_dict()
                    for movie in movies
                    ]

        @staticmethod
        def get_multiple_movie_by_ids(ids) : # [12, 45, 89] type de parametre attendu

            if not ids :
                return []
            
            with Sessionlocal() as session :
                movies = session.query(Movie).filter(Movie.tmdb_id.in_(ids)
                ).all()

                return [
                    movie.to_dict()
                    for movie in movies
                ]
