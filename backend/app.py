from flask import Flask
from flask_cors import CORS
from flask_caching import Cache
from flask_mail import Mail
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from models import db
from config import Config
from routes.cases import cases_bp
from routes.protocolists import protocolists_bp
from routes.user_profiles import user_profiles_bp
from routes.extract_data import extract_data_bp
from routes.user_data import user_data_bp
from routes.radicados import radicados_bp
from routes.finished_cases import finished_cases_bp
from routes.report import report_bp
from routes.contabilidad import contabilidad_bp  # Asegúrate de importar el blueprint de contabilidad
from flask_socketio import SocketIO

app = Flask(__name__)
mail = Mail(app)
app.config.from_object(Config)

# Generate a secure SECRET_KEY if not defined
if not app.config.get('SECRET_KEY'):
    import os
    app.config['SECRET_KEY'] = os.urandom(24).hex()

socketio = SocketIO(app, cors_allowed_origins="*")

# Set CORS policy
cors = CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

db.init_app(app)

# Flask-Migrate integration
migrate = Migrate(app, db)

# Registering blueprints for routes
app.register_blueprint(cases_bp)
app.register_blueprint(user_data_bp)
app.register_blueprint(protocolists_bp)
app.register_blueprint(user_profiles_bp)
app.register_blueprint(extract_data_bp)
app.register_blueprint(radicados_bp)
app.register_blueprint(finished_cases_bp, url_prefix='/api')
app.register_blueprint(report_bp)
app.register_blueprint(contabilidad_bp, url_prefix='/api')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, port=5000)
