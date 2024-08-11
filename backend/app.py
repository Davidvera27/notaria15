from flask import Flask
from flask_cors import CORS
from flask_caching import Cache
from models import db
from config import Config
from routes.cases import cases_bp
from routes.protocolists import protocolists_bp
from routes.user_profiles import user_profiles_bp
from routes.extract_data import extract_data_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config.from_object(Config)

db.init_app(app)

# Registro de Blueprints para las rutas
app.register_blueprint(cases_bp)
app.register_blueprint(protocolists_bp)
app.register_blueprint(user_profiles_bp)
app.register_blueprint(extract_data_bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
