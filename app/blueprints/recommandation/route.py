from flask import request, jsonify, Blueprint
from app.services.RecommandationService import RecommendationService

recommandations_bp = Blueprint('recommandation', __name__, template_folder='templates')
recommandation_service = RecommendationService()

@recommandations_bp.route('/', methods=['POST'])
def get_recommendations():
    """Page de résultats : génère les suggestions en fonction des films cochés"""
    data = request.get_json()
    
    if not data or 'selected_ids' not in data:
        return jsonify({"error": "Aucun film sélectionné"}), 400
        
    ids = data['selected_ids']
    recommandations = recommandation_service.get_recommendations(ids)
    
    return jsonify(recommandations)