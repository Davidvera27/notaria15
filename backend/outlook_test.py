import win32com.client as win32

try:
    # Crear instancia de Outlook
    outlook = win32.Dispatch('Outlook.Application')
    mail = outlook.CreateItem(0)

    # Configurar el correo
    mail.To = 'destinatario@ejemplo.com'  # Reemplaza con un correo electrónico válido
    mail.Subject = 'Prueba Outlook'
    mail.Body = 'Este es un correo de prueba'

    # Enviar el correo
    mail.Send()
    print("Correo enviado via Outlook")
except Exception as e:
    print(f"Error al enviar correo via Outlook: {e}")
