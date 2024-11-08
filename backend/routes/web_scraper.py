# notaria15/backend/routes/web_scraper.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from flask import Blueprint, request, jsonify

# Configurar las credenciales
LOGIN_URL = "https://mercurio.antioquia.gov.co/mercurio/logueoPqr.jsp?codIndice=00011&idAsunto=GTR001"
USERNAME = "notaria15med"
PASSWORD = "MERCURIO"

# Crear un Blueprint para las rutas de scraping
scraper_bp = Blueprint('scraper', __name__)

@scraper_bp.route('/api/start_scraping', methods=['POST'])
def start_scraping():
    # Validar y obtener el radicado del cuerpo de la solicitud
    radicado = request.json.get('radicado')
    if not radicado:
        return jsonify({'error': 'El radicado es requerido'}), 400

    # Configuración de Selenium y apertura del navegador en modo headless
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Ejecuta el navegador sin interfaz
    driver = webdriver.Chrome(options=options)

    try:
        # Acceder a la página de inicio de sesión
        driver.get(LOGIN_URL)

        # Esperar hasta que los campos de usuario y contraseña estén presentes
        wait = WebDriverWait(driver, 10)
        usuario_input = wait.until(EC.presence_of_element_located((By.NAME, "usuario")))
        contrasena_input = wait.until(EC.presence_of_element_located((By.NAME, "contrasena")))

        # Limpiar los campos y luego ingresar las credenciales
        usuario_input.clear()
        contrasena_input.clear()
        usuario_input.send_keys(USERNAME)
        contrasena_input.send_keys(PASSWORD)

        # Hacer clic en el botón "Verificar Datos"
        verificar_button = driver.find_element(By.XPATH, "//input[@value='Verificar Datos']")
        verificar_button.click()

        # Esperar hasta que se cargue la página siguiente después del inicio de sesión
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "operacion")))

        # Acceder directamente a la URL específica del radicado
        consulta_url = f"https://mercurio.antioquia.gov.co/mercurio/servlet/ControllerMercurio?command=anexos&tipoOperacion=abrirLista&idDocumento={radicado}&tipDocumento=R&now=Date()&ventanaEmergente=S&origen=NTR"
        driver.get(consulta_url)

        # Extraer los datos de los anexos
        anexos = []
        rows = driver.find_elements(By.CSS_SELECTOR, 'tr')
        for row in rows:
            columns = row.find_elements(By.TAG_NAME, 'td')
            if len(columns) > 1:
                anexo = {
                    'numero_anexo': columns[1].text.strip(),
                    'titulo': columns[2].text.strip(),
                    'descripcion': columns[3].text.strip(),
                    'fecha': columns[4].text.strip(),
                    'estado': columns[5].text.strip()
                }
                anexos.append(anexo)

        # Retornar los anexos en la respuesta
        return jsonify({'anexos': anexos})
    except TimeoutException:
        return jsonify({'error': 'Error: No se pudo completar la operación en el tiempo estimado'}), 500
    finally:
        # Cerrar el navegador
        driver.quit()
