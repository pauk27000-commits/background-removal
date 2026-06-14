import http.server
import socketserver
import webbrowser
import threading
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CrossOriginIsolatedHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Включаем заголовки кросс-доменной изоляции для поддержки SharedArrayBuffer.
        # Это позволяет ONNX Runtime запускать многопоточную обработку WebAssembly.
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    global PORT
    # Настройка сервера
    handler = CrossOriginIsolatedHTTPRequestHandler
    
    # Позволяем повторно использовать адрес порта
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print(f"\n[OK] Локальный сервер запущен по адресу: http://localhost:{PORT}")
            print("Для остановки сервера нажмите Ctrl+C в этом окне.")
            print(f"Обслуживание файлов из директории: {DIRECTORY}\n")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048: # Порт уже занят
            print(f"[!] Порт {PORT} уже занят. Попытка запустить на следующем порту...")
            PORT += 1
            start_server()
        else:
            print(f"[ERROR] Не удалось запустить сервер: {e}")

if __name__ == "__main__":
    # Запуск сервера в отдельном потоке, чтобы открыть браузер после запуска
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Даем серверу немного времени на инициализацию перед открытием браузера
    import time
    time.sleep(1)
    
    url = f"http://localhost:{PORT}"
    print(f"[INFO] Открываем браузер: {url}")
    webbrowser.open(url)
    
    try:
        # Держим основной поток активным, пока сервер работает
        while server_thread.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Сервер остановлен пользователем.")
        sys.exit(0)
