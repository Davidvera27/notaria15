from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(50))
    escritura = db.Column(db.Integer)
    radicado = db.Column(db.String(50))
    protocolista_id = db.Column(db.Integer, db.ForeignKey('protocolist.id'), nullable=False)
    observaciones = db.Column(db.String(255))
    fecha_documento = db.Column(db.String(50))  # Nuevo campo

    protocolista = db.relationship('Protocolist', backref=db.backref('cases', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha,
            'escritura': self.escritura,
            'radicado': self.radicado,
            'protocolista': self.protocolista.nombre,
            'observaciones': self.observaciones,
            'fecha_documento': self.fecha_documento  # Añadir a la salida del diccionario
        }
        
class CaseFinished(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(50))
    escritura = db.Column(db.Integer)
    radicado = db.Column(db.String(50))
    protocolista = db.Column(db.String(50))
    observaciones = db.Column(db.String(255))
    fecha_documento = db.Column(db.String(50))  # Nuevo campo
    envios = db.Column(db.Integer, default=1)  # Nueva columna para contar los envíos

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha,
            'escritura': self.escritura,
            'radicado': self.radicado,
            'protocolista': self.protocolista,
            'observaciones': self.observaciones,
            'fecha_documento': self.fecha_documento,
            'envios': self.envios  # Añadir a la salida del diccionario
        }


class Protocolist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    correo_electronico = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'correo_electronico': self.correo_electronico,
            'numero_de_casos': len(self.cases)
        }

class Radicado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('case.id'), nullable=False)
    radicado = db.Column(db.String(50), nullable=False)
    fecha = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'radicado': self.radicado,
            'fecha': self.fecha
        }

class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'email': self.email,
            'birth_date': self.birth_date,
            'username': self.username,
            'created_at': self.created_at
        }
