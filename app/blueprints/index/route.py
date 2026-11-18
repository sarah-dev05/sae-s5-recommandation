from flask import request, jsonify, Blueprint
from app.services.MovieService import MovieService

index_bp = Blueprint('index', __name__, template_folder='templates')

movie_service = MovieService()

@index_bp.route('/', methods=['GET'])
def home():
    """Page d'accueil"""
    limite = request.args.get('limite', default=30, type=int)
    movies = movie_service.get_home_movies(limite)
    
    return jsonify(movies)

@index_bp.route('/search', methods=['GET'])
def search():
    """Page de recherche"""
    query = request.args.get('q', default='', type=str)
    
    if not query:
        return jsonify({"error": "Veuillez taper un titre de film"}), 400
        
    movies = movie_service.get_movies(query)
    return jsonify(movies)