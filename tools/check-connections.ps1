# Baglanti Denetleyici: Kurslarin index, wizard, sitemap ve uzman sayfalarina baglanma durumunu kontrol eder
$scriptDir = $PSScriptRoot
$rootDir = Join-Path $scriptDir ".."

$indexPath = Join-Path $rootDir "index.html"
$wizardPath = Join-Path $rootDir "assets\js\interactive-tools.js"
$sitemapPath = Join-Path $rootDir "sitemap.xml"
$uzmanPath = Join-Path $rootDir "uzmanlarimiz\nihat-sari.html"
$kurslarDir = Join-Path $rootDir "kurslar"

$index = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
$wizard = [System.IO.File]::ReadAllText($wizardPath, [System.Text.Encoding]::UTF8)
$sitemap = [System.IO.File]::ReadAllText($sitemapPath, [System.Text.Encoding]::UTF8)
$uzman = [System.IO.File]::ReadAllText($uzmanPath, [System.Text.Encoding]::UTF8)

$courseFiles = Get-ChildItem -Path $kurslarDir -Filter "*.html" | Where-Object { 
    $_.Name -notlike "*sablonu*" -and $_.Name -notlike "*-v2*" -and $_.Name -ne "index.html"
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "KURS BAGLANTI VE ENTEGRASYON DENETLEYICI" -ForegroundColor Cyan
Write-Host "Bulunan Toplam Kurs Sayfasi: $($courseFiles.Count)" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

$missingInIndex = @()
$missingInWizard = @()
$missingInSitemap = @()

foreach ($f in $courseFiles) {
    $slug = $f.BaseName
    $href = "kurslar/$slug.html"
    
    if ($index -notmatch [regex]::Escape($href)) {
        $missingInIndex += $f.Name
    }
    if ($wizard -notmatch [regex]::Escape($href)) {
        $missingInWizard += $f.Name
    }
    if ($sitemap -notmatch [regex]::Escape("$slug.html")) {
        $missingInSitemap += $f.Name
    }
}

Write-Host "`n1. INDEX.HTML (ANASAYFA KURS KARTLARI):" -ForegroundColor White
if ($missingInIndex.Count -eq 0) {
    Write-Host "   [OK] 20 KURSUN TAMAMI index.html KURS DIRECTORY ALANINA BAGLANDI!" -ForegroundColor Green
} else {
    Write-Host "   [HATA] index.html icinde eksik kurslar var ($($missingInIndex.Count)):" -ForegroundColor Red
    $missingInIndex | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host "`n2. INTERACTIVE-TOOLS.JS (KURS SECME SIHIRBAZI):" -ForegroundColor White
if ($missingInWizard.Count -eq 0) {
    Write-Host "   [OK] 20 KURSUN TAMAMI KURS SECIM APARATINA (WIZARD) BAGLANDI!" -ForegroundColor Green
} else {
    Write-Host "   [HATA] Wizard icinde eksik kurslar var ($($missingInWizard.Count)):" -ForegroundColor Red
    $missingInWizard | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host "`n3. SITEMAP.XML (ARAMA MOTORU HARITASI):" -ForegroundColor White
if ($missingInSitemap.Count -eq 0) {
    Write-Host "   [OK] 20 KURSUN TAMAMI sitemap.xml ICINDE MEVCUT!" -ForegroundColor Green
} else {
    Write-Host "   [HATA] Sitemap icinde eksik kurslar var ($($missingInSitemap.Count)):" -ForegroundColor Red
    $missingInSitemap | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host "`n4. UZMAN SAYFASI (UZMANLARIMIZ/NIHAT-SARI.HTML):" -ForegroundColor White
$uzmanOldLinks = [regex]::Matches($uzman, '\.\./index\.html#kurslar')
if ($uzmanOldLinks.Count -eq 0) {
    Write-Host "   [OK] Uzman sayfasindaki tum kurs linkleri ozel .html sayfalarina bagli!" -ForegroundColor Green
} else {
    Write-Host "   [UYARI] Uzman sayfasinda hala genel #kurslar linki kullanan $($uzmanOldLinks.Count) adet link var!" -ForegroundColor Yellow
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
