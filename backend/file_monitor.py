import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import requests

class FileHandler(FileSystemEventHandler):
    def __init__(self, folder_to_monitor):
        self.folder_to_monitor = folder_to_monitor

    def on_modified(self, event):
        for filename in os.listdir(self.folder_to_monitor):
            if filename.endswith('.pdf'):
                file_path = os.path.join(self.folder_to_monitor, filename)
                response = requests.get(f'http://127.0.0.1:5000/extract-data')
                if response.status_code == 200:
                    print(f"Processed {filename}")

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
