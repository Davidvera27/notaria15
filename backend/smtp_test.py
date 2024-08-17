import smtplib
from email.mime.text import MIMEText

# Configuración del mensaje
msg = MIMEText("Este es un correo de prueba")
msg['Subject'] = 'Prueba SMTP'
msg['From'] = 'rentasnot15med@hotmail.com'
msg['To'] = 'destinatario@ejemplo.com'  # Reemplaza con un correo electrónico válido

# Enviar correo usando SMTP
try:
    with smtplib.SMTP('smtp-mail.outlook.com', 587) as server:
        server.starttls()
        server.login('rentasnot15med@hotmail.com', 'N0t4Ri4152o2a**')  # Reemplaza con la contraseña correcta
        server.send_message(msg)
    print("Correo enviado via SMTP")
except Exception as e:
    print(f"Error al enviar correo via SMTP: {e}")
