# Устанавливаем кодировку консоли в UTF-8 для корректного вывода русского текста
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Port = 8000
$Address = "http://localhost:$Port/"

# Создаем HTTP-слушатель
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($Address)

try {
    $listener.Start()
    Write-Host "[OK] Локальный сервер запущен по адресу: $Address" -ForegroundColor Green
    Write-Host "Для остановки сервера закройте это окно или нажмите Ctrl+C." -ForegroundColor Yellow
    Write-Host "Файлы обслуживаются из папки: $PSScriptRoot`n" -ForegroundColor Gray

    # Автоматически открываем браузер
    Start-Process $Address

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Добавляем заголовки кросс-доменной изоляции (для многопоточного WASM/ONNX)
        $response.Headers.Add("Cross-Origin-Opener-Policy", "same-origin")
        $response.Headers.Add("Cross-Origin-Embedder-Policy", "require-corp")
        $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")

        # Очищаем путь запроса
        $urlPath = $request.Url.AbsolutePath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }

        # Формируем физический путь к файлу
        $filePath = Join-Path $PSScriptRoot $urlPath.TrimStart('/')

        if (Test-Path $filePath -PathType Leaf) {
            # Определяем MIME-тип
            $contentType = "application/octet-stream"
            if ($filePath.EndsWith(".html")) {
                $contentType = "text/html; charset=utf-8"
            } elseif ($filePath.EndsWith(".css")) {
                $contentType = "text/css; charset=utf-8"
            } elseif ($filePath.EndsWith(".js")) {
                $contentType = "application/javascript; charset=utf-8"
            } elseif ($filePath.EndsWith(".png")) {
                $contentType = "image/png"
            } elseif ($filePath.EndsWith(".jpg") -or $filePath.EndsWith(".jpeg")) {
                $contentType = "image/jpeg"
            } elseif ($filePath.EndsWith(".svg")) {
                $contentType = "image/svg+xml"
            }

            $response.ContentType = $contentType
            
            # Читаем и отправляем файл
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            # Файл не найден (404)
            $response.StatusCode = 404
            $errorMessage = "404 - File Not Found"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }

        $response.Close()
    }
} catch {
    Write-Host "[ERROR] Произошла ошибка при запуске или работе сервера: $_" -ForegroundColor Red
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}
