@echo off
REM Cambiar directorio a la ubicación del backend y ejecutar el servidor
start "" cmd /c "cd /d \"C:\Users\DAVID\OneDrive - IUE\Desktop\PROGRAMACIÓN\JAVASCRIPT\Notaria 15\notaria15\backend\" && python app.py"

REM Pausar un momento para asegurar que el servidor backend esté completamente iniciado
timeout /t 5 /nobreak > nul

REM Abrir el navegador predeterminado en la URL de Vercel
start "" https://notaria15.vercel.app
