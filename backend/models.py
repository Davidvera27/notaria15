from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Case(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.String(50))
    escritura = db.Column(db.Integer)
    radicado = db.Column(db.String(50))
    protocolista = db.Column(db.String(50))
    observaciones = db.Column(db.String(255))  # Nueva columna para observaciones

    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha,
            'escritura': self.escritura,
            'radicado': self.radicado,
            'protocolista': self.protocolista,
            'observaciones': self.observaciones  # Incluye observaciones en el diccionario
        }

class Protocolist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50))
    correo_electronico = db.Column(db.String(50))

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'correo_electronico': self.correo_electronico
        }
