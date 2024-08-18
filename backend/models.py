from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(50))
    escritura = db.Column(db.Integer)
    radicado = db.Column(db.String(50))
    protocolista_id = db.Column(db.Integer, db.ForeignKey('protocolist.id'), nullable=False)
    observaciones = db.Column(db.String(255))

    protocolista = db.relationship('Protocolist', backref=db.backref('cases', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha,
            'escritura': self.escritura,
            'radicado': self.radicado,
            'protocolista': self.protocolista.nombre,
            'observaciones': self.observaciones
        }
        
class CaseFinished(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(50))
    escritura = db.Column(db.Integer)
    radicado = db.Column(db.String(50))
    protocolista = db.Column(db.String(50))
    observaciones = db.Column(db.String(255))

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha,
            'escritura': self.escritura,
            'radicado': self.radicado,
            'protocolista': self.protocolista,
            'observaciones': self.observaciones
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
    first_name1 = db.Column(db.String(50), nullable=False)
    first_name2 = db.Column(db.String(50))
    last_name1 = db.Column(db.String(50), nullable=False)
    last_name2 = db.Column(db.String(50))
    phone_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(50), unique=True, nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'first_name1': self.first_name1,
            'first_name2': self.first_name2,
            'last_name1': self.last_name1,
            'last_name2': self.last_name2,
            'phone_number': self.phone_number,
            'email': self.email,
            'birth_date': self.birth_date,
            'username': self.username
        }
        
        
