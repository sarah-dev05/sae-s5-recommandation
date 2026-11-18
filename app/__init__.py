import os
from flask import Flask


def create_app():
	app = Flask(__name__, static_url_path='/static')

	app.config['DATABASE_PATH'] = os.path.join(app.root_path, 'movie.db')
	app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + app.config['DATABASE_PATH']
	app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

	app.config["SESSION_COOKIE_SECURE"] = False

	from app.blueprints import (
		index_bp,
		recommandation_bp
	)

	app.register_blueprint(index_bp)
	app.register_blueprint(recommandation_bp, url_prefix='/recommandation')

	return app