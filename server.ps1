# Mini server locale per Windows: serve l'app solo a questo PC (127.0.0.1).
# Non serve installare nulla: usa PowerShell, gia presente in Windows.
# Il motore di analisi (WebAssembly) non si carica aprendo index.html con doppio click.
param([int]$Port = 8765)

$root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json'; '.webmanifest' = 'application/manifest+json'
  '.wasm' = 'application/wasm'; '.task' = 'application/octet-stream'; '.png' = 'image/png'; '.svg' = 'image/svg+xml'
  '.md' = 'text/plain; charset=utf-8'
}

# TcpListener sulla sola interfaccia di loopback: nessun permesso di amministratore, nessun accesso dalla rete
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try { $listener.Start() } catch {
  Write-Host "La porta $Port e gia in uso: probabilmente l'app e gia avviata."
  Start-Sleep -Seconds 3
  exit
}
Write-Host ''
Write-Host '  Valutazione Posturale e attiva su http://127.0.0.1:8765/'
Write-Host '  Lascia aperta questa finestra mentre lavori: chiudila quando hai finito.'
Write-Host ''

function Send($stream, [int]$code, [string]$text, [string]$type, [byte[]]$body, [bool]$head) {
  $len = 0
  if ($body) { $len = $body.Length }
  $h = "HTTP/1.1 $code $text`r`nContent-Type: $type`r`nContent-Length: $len`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $hb = [System.Text.Encoding]::ASCII.GetBytes($h)
  $stream.Write($hb, 0, $hb.Length)
  if ($body -and -not $head) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $line = $reader.ReadLine()
    while ($true) { $h = $reader.ReadLine(); if ($h -eq $null -or $h -eq '') { break } }
    if (-not ($line -match '^(GET|HEAD) (\S+)')) { Send $stream 405 'Method Not Allowed' 'text/plain' $null $false; continue }
    $head = $matches[1] -eq 'HEAD'
    $path = [Uri]::UnescapeDataString(($matches[2] -split '\?')[0])
    if ($path.EndsWith('/')) { $path += 'index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart('/') -replace '/', '\')))
    if (-not $file.StartsWith($root) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      Send $stream 404 'Not Found' 'text/plain' ([System.Text.Encoding]::ASCII.GetBytes('404')) $head
      continue
    }
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $type = $mime[$ext]
    if (-not $type) { $type = 'application/octet-stream' }
    Send $stream 200 'OK' $type ([System.IO.File]::ReadAllBytes($file)) $head
  } catch {
  } finally {
    $client.Close()
  }
}
