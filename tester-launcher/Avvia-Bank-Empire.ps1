$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$Root=Split-Path -Parent $MyInvocation.MyCommand.Path
$App=Join-Path $Root 'Bank-Empire-0.8'
$Zip=Join-Path $Root 'be-download.zip'
$Temp=Join-Path $Root '_be-temp'
$RepoZip='https://github.com/samix-14/Bank-Empire./archive/refs/heads/0.8.zip'
$Server=$null
function Fail($m){Write-Host '';Write-Host $m -ForegroundColor Red;Read-Host 'Premi INVIO per chiudere';exit 1}
try {
 Write-Host 'BANK EMPIRE 0.8 - AVVIO TESTER' -ForegroundColor Cyan
 if(!(Test-Path (Join-Path $App 'index.html'))){
  Write-Host 'Scarico i file da GitHub...'
  Invoke-WebRequest -Uri $RepoZip -OutFile $Zip -UseBasicParsing
  if(!(Test-Path $Zip) -or (Get-Item $Zip).Length -lt 1000){Fail 'Download non valido. Controlla Internet.'}
  if(Test-Path $Temp){Remove-Item $Temp -Recurse -Force}
  Expand-Archive $Zip $Temp -Force
  $src=Get-ChildItem $Temp -Directory | Select-Object -First 1
  if(!$src -or !(Test-Path (Join-Path $src.FullName 'index.html'))){Fail 'Archivio GitHub non valido o index.html mancante.'}
  if(Test-Path $App){Remove-Item $App -Recurse -Force}
  Move-Item $src.FullName $App
  Remove-Item $Temp -Recurse -Force
  Remove-Item $Zip -Force -ErrorAction SilentlyContinue
 }
 foreach($f in @('index.html','style.css','script.js')){if(!(Test-Path (Join-Path $App $f))){Fail ('Manca '+$f+' nella cartella del progetto.')}}
 $Port=0
 for($p=3000;$p -le 3010;$p++){ $probe=$null; try{$probe=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$p);$probe.Start();$probe.Stop();$Port=$p;break}catch{if($probe){try{$probe.Stop()}catch{}}} }
 if($Port -eq 0){Fail 'Le porte 3000-3010 sono occupate. Chiudi altri server e riprova.'}
 $Server=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$Port);$Server.Start()
 $Site='http://localhost:'+$Port+'/'
 Write-Host '';Write-Host ('Sito avviato: '+$Site) -ForegroundColor Green
 Write-Host 'Lascia aperta questa finestra. Per fermare il server premi CTRL+C.' -ForegroundColor Yellow
 Start-Process $Site
 $Mime=@{'.html'='text/html; charset=utf-8';'.css'='text/css; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.json'='application/json; charset=utf-8';'.svg'='image/svg+xml';'.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.ico'='image/x-icon';'.txt'='text/plain; charset=utf-8';'.woff'='font/woff';'.woff2'='font/woff2'}
 while($true){
  $c=$null;$s=$null;$r=$null
  try{
   $c=$Server.AcceptTcpClient();$c.ReceiveTimeout=5000;$s=$c.GetStream()
   $r=[System.IO.StreamReader]::new($s,[System.Text.Encoding]::ASCII,$false,1024,$true)
   $line=$r.ReadLine();if([string]::IsNullOrWhiteSpace($line)){continue};$parts=$line.Split(' ');if($parts.Length -lt 2){continue}
   $method=$parts[0];$path=$parts[1].Split('?')[0]
   while($true){$h=$r.ReadLine();if($null -eq $h -or $h -eq ''){break}}
   $status='200 OK';$body=[byte[]]@();$type='text/plain; charset=utf-8'
   if($method -ne 'GET' -and $method -ne 'HEAD'){$status='405 Method Not Allowed';$body=[Text.Encoding]::UTF8.GetBytes('405 Method Not Allowed')}
   else{
    $rel=[Uri]::UnescapeDataString($path.TrimStart('/'));if([string]::IsNullOrWhiteSpace($rel)){$rel='index.html'}
    $rel=$rel.Replace('/',[IO.Path]::DirectorySeparatorChar);$full=[IO.Path]::GetFullPath((Join-Path $App $rel));$prefix=[IO.Path]::GetFullPath($App)+[IO.Path]::DirectorySeparatorChar
    if(!$full.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){$status='403 Forbidden';$body=[Text.Encoding]::UTF8.GetBytes('403 Forbidden')}
    elseif(Test-Path $full -PathType Leaf){$ext=[IO.Path]::GetExtension($full).ToLowerInvariant();if($Mime.ContainsKey($ext)){$type=$Mime[$ext]}else{$type='application/octet-stream'};$body=[IO.File]::ReadAllBytes($full)}
    else{$status='404 Not Found';$body=[Text.Encoding]::UTF8.GetBytes('404 Not Found')}
   }
   $head='HTTP/1.1 '+$status+"`r`nContent-Type: "+$type+"`r`nContent-Length: "+$body.Length+"`r`nConnection: close`r`nX-Content-Type-Options: nosniff`r`n`r`n"
   $hb=[Text.Encoding]::ASCII.GetBytes($head);$s.Write($hb,0,$hb.Length);if($method -ne 'HEAD' -and $body.Length -gt 0){$s.Write($body,0,$body.Length)};$s.Flush()
  }catch{}finally{if($r){$r.Dispose()};if($s){$s.Dispose()};if($c){$c.Close()}}
 }
}catch{Fail ('Errore: '+$_.Exception.Message+'. Controlla Internet e riprova.')}finally{if($Server){try{$Server.Stop()}catch{}}}