from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin

class Movie(Base, BaseModelMixin):

    __tablename__ = 'Movie'

    tmdb_id = Column(Integer, primary_key=True)
    title = Column(String(100), unique=True, nullable=False, index=True)
    synopsis = Column(String(1000), unique=True, nullable=False)
    genres = Column(String(1000), unique=False, nullable=False, index=True)
    keywords = Column(String(1000), unique=False, nullable=False, index=True)
    directors = Column(String(100), unique=False, nullable=False, index=True)
    actors = Column(String(100), unique=False, nullable=False, index=True)
    poster = Column(String(100), unique=True, nullable=False)

    ### relations

    rates = relationship(
        'Rates',
        back_populates='movie'
    )