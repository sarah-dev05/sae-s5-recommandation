from sqlalchemy import Column, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import Base, BaseModelMixin

class Rates(Base, BaseModelMixin):

    __tablename__ = 'Rates'

    rating_id = Column(Integer, primary_key=True, autoincrement=True)
    rating = Column(Float, nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey('movies.tmdbId', ondelete='SET NULL'), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)

    ### relations

    movie = relationship(
        'Movie',
        back_populates='rates'
    )