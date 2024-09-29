import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import requests

class FileHandler(FileSystemEventHandler):
    def __init__(self, folder_to_monitor):
        self.folder_to_monitor = folder_to_monitor

    # Método para manejar cuando se crea un nuevo archivo en la carpeta
    def on_created(self, event):
        if event.src_path.endswith('.pdf'):
            file_path = event.src_path
            # Hacer la petición al servidor para procesar el archivo PDF
            response = requests.post(f'http://127.0.0.1:5000/extract-data', json={'file_path': file_path})
            if response.status_code == 200:
                print(f"Processed {os.path.basename(file_path)}")
            else:
                print(f"Error processing {os.path.basename(file_path)}: {response.status_code}")

    # Método para manejar cuando se modifica un archivo en la carpeta
    def on_modified(self, event):
        for filename in os.listdir(self.folder_to_monitor):
            if filename.endswith('.pdf'):
                file_path = os.path.join(self.folder_to_monitor, filename)
                # Hacer la petición al servidor para procesar el archivo PDF
                response = requests.post(f'http://127.0.0.1:5000/extract-data', json={'file_path': file_path})
                if response.status_code == 200:
                    print(f"Processed {filename}")
                else:
                    print(f"Error processing {filename}: {response.status_code}")

if __name__ == "__main__":
    folder_to_monitor = "path/to/notaria15/backend/uploads"
    event_handler = FileHandler(folder_to_monitor)
    observer = Observer()
    observer.schedule(event_handler, folder_to_monitor, recursive=False)
    observer.start()
    print(f"Monitoring folder: {folder_to_monitor}")
    try:
        while True:
            time.sleep(10)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
