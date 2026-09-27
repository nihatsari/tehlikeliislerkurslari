# Otomatik 18 Kurs Uretici ve Sablon Entegrasyon Betigi (Strict UTF-8 No BOM)
# Kullanim: powershell -ExecutionPolicy Bypass -File tools/generate-courses.ps1

$scriptDir = $PSScriptRoot
$templatePath = Join-Path $scriptDir "..\kurslar\kurs-sablonu.html"
$jsonPath = Join-Path $scriptDir "courses-data.json"
$kurslarDir = Join-Path $scriptDir "..\kurslar"

if (!(Test-Path $templatePath)) {
    Write-Error "Master sablon bulunamadi: $templatePath"
    exit 1
}

if (!(Test-Path $jsonPath)) {
    Write-Error "Kurs JSON verisi bulunamadi: $jsonPath"
    exit 1
}

# UTF-8 Encoding Nesnesi (BOM'suz)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Master Sablonu ve JSON verisini UTF-8 olarak oku
$templateContent = [System.IO.File]::ReadAllText($templatePath, [System.Text.Encoding]::UTF8)
$jsonRaw = [System.IO.File]::ReadAllText($jsonPath, [System.Text.Encoding]::UTF8)
$courses = ConvertFrom-Json $jsonRaw

Write-Host "Toplam uretilecek kurs sayisi: $($courses.Count)" -ForegroundColor Cyan

$generatedCount = 0
foreach ($c in $courses) {
    $content = $templateContent
    $content = $content.Replace("{{KURS_BASLIGI}}", $c.Baslik)
    $content = $content.Replace("{{KURS_TAM_ADI}}", $c.TamAdi)
    $content = $content.Replace("{{KURS_ADI}}", $c.Adi)
    $content = $content.Replace("{{KURS_KISA_ADI}}", $c.KisaAdi)
    $content = $content.Replace("{{KURS_SLUG}}", $c.Slug)
    $content = $content.Replace("{{SEKTOR_ADI}}", $c.Sektor)
    $content = $content.Replace("{{KURS_KEYWORDS}}", $c.Keywords)
    $content = $content.Replace("{{KURS_SPOT_ACIKLAMA}}", $c.Spot)
    $content = $content.Replace("{{MEZUN_SAYISI}}", $c.Mezun)
    $content = $content.Replace("{{MESLEK_TANIMI_METNI}}", $c.MeslekTanimi)
    $content = $content.Replace("{{MODUL_1_BASLIK}}", $c.Modul1)
    $content = $content.Replace("{{MODUL_2_BASLIK}}", $c.Modul2)
    $content = $content.Replace("{{MODUL_3_BASLIK}}", $c.Modul3)
    $content = $content.Replace("{{MODUL_4_BASLIK}}", $c.Modul4)

    $mod1Html = ($c.Modul1Maddeler | ForEach-Object { "                    <li>$_</li>" }) -join "`n"
    $mod2Html = ($c.Modul2Maddeler | ForEach-Object { "                    <li>$_</li>" }) -join "`n"
    $mod3Html = ($c.Modul3Maddeler | ForEach-Object { "                    <li>$_</li>" }) -join "`n"
    $mod4Html = ($c.Modul4Maddeler | ForEach-Object { "                    <li>$_</li>" }) -join "`n"

    $content = $content.Replace("{{MODUL_1_MADDELER}}", $mod1Html)
    $content = $content.Replace("{{MODUL_2_MADDELER}}", $mod2Html)
    $content = $content.Replace("{{MODUL_3_MADDELER}}", $mod3Html)
    $content = $content.Replace("{{MODUL_4_MADDELER}}", $mod4Html)
    $content = $content.Replace("{{KURS_YORUMLARI_HTML}}", $c.YorumlarHtml)

    $targetFile = Join-Path $kurslarDir "$($c.Slug).html"
    [System.IO.File]::WriteAllText($targetFile, $content, $utf8NoBom)
    Write-Host "   [URETILDI - UTF8 TEMIZ]: $($c.Slug).html" -ForegroundColor Green
    $generatedCount++
}

Write-Host "Tebrikler! Toplam $generatedCount adet yeni kurs sayfasi saf UTF-8 olarak uretildi." -ForegroundColor Yellow
