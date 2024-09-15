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
    role = db.Column(db.String(50), nullable=False)  # Nuevo campo para el rol

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'email': self.email,
            'birth_date': self.birth_date,
            'username': self.username,
            'created_at': self.created_at,
            'role': self.role  # Devolver también el rol
        }

class Contabilidad(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    protocolista = db.Column(db.String(50))
    factura_no = db.Column(db.String(50))
    esc = db.Column(db.String(50))
    fact_canceladas = db.Column(db.Numeric(10, 2))
    fact_sin_cancelar = db.Column(db.Numeric(10, 2))
    total_fact_sin_cancelar = db.Column(db.Numeric(10, 2))
    total_fact_canceladas = db.Column(db.Numeric(10, 2))
    fecha = db.Column(db.Date)
    rentas_pse = db.Column(db.Numeric(10, 2))
    rentas_efectivo = db.Column(db.Numeric(10, 2))
    registro_pse = db.Column(db.Numeric(10, 2))
    registro_efectivo = db.Column(db.Numeric(10, 2))
    total_r_yr = db.Column(db.Numeric(10, 2))
    devolucion = db.Column(db.Numeric(10, 2))
    excedentes = db.Column(db.Numeric(10, 2))
    total_rentas_registro = db.Column(db.Numeric(10, 2))
    observaciones = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'protocolista': self.protocolista,
            'factura_no': self.factura_no,
            'esc': self.esc,
            'fact_canceladas': str(self.fact_canceladas),
            'fact_sin_cancelar': str(self.fact_sin_cancelar),
            'total_fact_sin_cancelar': str(self.total_fact_sin_cancelar),
            'total_fact_canceladas': str(self.total_fact_canceladas),
            'fecha': self.fecha.isoformat(),
            'rentas_pse': str(self.rentas_pse),
            'rentas_efectivo': str(self.rentas_efectivo),
            'registro_pse': str(self.registro_pse),
            'registro_efectivo': str(self.registro_efectivo),
            'total_r_yr': str(self.total_r_yr),
            'devolucion': str(self.devolucion),
            'excedentes': str(self.excedentes),
            'total_rentas_registro': str(self.total_rentas_registro),
            'observaciones': self.observaciones
        }