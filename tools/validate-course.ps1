# Kurs Sayfalari Butunluk ve Sifir Hata Dogrulama Araci (PowerShell)
# Kullanim: powershell -ExecutionPolicy Bypass -File tools/validate-course.ps1

$kurslarDir = Join-Path $PSScriptRoot "..\kurslar"
$htmlFiles = Get-ChildItem -Path $kurslarDir -Filter "*.html" | Where-Object { $_.Name -notmatch "ref" -and $_.Name -notmatch "v2" -and $_.Name -ne "index.html" }

Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "AGIR & TEHLIKELI ISLER - KURS SAYFALARI BUTUNLUK VE SIFIR HATA DENETLEYICI" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan

$allPassed = $true

$requiredScripts = @(
    "form-handler.js",
    "app.js",
    "interactive-tools.js"
)

$requiredCalcIds = @(
    "calcWorkerCount",
    "calcWorkerDisplay",
    "calcPenaltyVal",
    "calcCostVal",
    "calcSavingsVal"
)

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $errors = @()
    $warnings = @()

    # 1. Script Kontrolleri
    foreach ($script in $requiredScripts) {
        if ($content -notmatch [regex]::Escape($script)) {
            $errors += "[Eksik Script]: $script script etiketi bulunamadi."
        }
    }

    # 2. CSS Kontrolleri
    if ($content -notmatch "course(\-v2)?\.css") {
        $errors += "[Eksik CSS]: course.css baglantisi bulunamadi."
    }

    # 3. Custom Checklist & Cift Bullet Kontrolu
    if ($content -match 'class="custom-checklist"') {
        # Check if any li inside custom-checklist contains raw unicode bullet
        if ($content -match 'class="custom-checklist"[\s\S]*?<li[^>]*>[\s\S]*?(\u2022|&bull;)[\s\S]*?</li>') {
            $errors += "[Cift Bullet Hatasi]: .custom-checklist icinde gereksiz metin noktasi tespit edildi."
        }
    } else {
        $warnings += "[Tavsiye]: Katilim sartlari listesi icin .custom-checklist sinifi kullanilmasi onerilir."
    }

    # 4. Sosyal Kanit Bandi (3 Sutun)
    if ($content -notmatch 'class="social-proof-strip"') {
        $errors += "[Eksik Bilesen]: .social-proof-strip kapsayicisi bulunamadi."
    } else {
        $statCount = ([regex]::Matches($content, 'class="sp-item-num"')).Count
        if ($statCount -lt 3) {
            $warnings += "[Istatistik Uyarisi]: .social-proof-strip icinde en az 3 adet sp-item-num bulunmali ($statCount bulundu)."
        }
    }

    # 5. Ceza Hesaplayici
    foreach ($cid in $requiredCalcIds) {
        if ($content -notmatch "id=`"$cid`"") {
            $errors += "[Hesaplayici Hatasi]: Gerekli ID bulunamadi: #$cid"
        }
    }
    if ($content -notmatch 'name="calcRiskClass"') {
        $errors += "[Hesaplayici Hatasi]: name=`"calcRiskClass`" radyo butonlari bulunamadi."
    }

    # 6. SSS Akordeon
    if ($content -notmatch 'class="faq-accordion"') {
        $errors += "[Eksik Bilesen]: .faq-accordion bulunamadi."
    } else {
        if ($content -notmatch 'class="faq-trigger"') {
            $errors += "[Akordeon Hatasi]: .faq-trigger butonlari bulunamadi."
        }
        if ($content -notmatch 'class="faq-content"') {
            $errors += "[Akordeon Hatasi]: .faq-content cevap alanlari bulunamadi."
        }
    }

    # 7. Form ve Sidebar
    if ($content -notmatch 'class="sticky-reg-card"') {
        $errors += "[Eksik Bilesen]: .sticky-reg-card kayit karti bulunamadi."
    }
    if ($content -notmatch 'data-headless-form="true"') {
        $errors += "[Form Hatasi]: data-headless-form=`"true`" ozbelirteci eksik."
    }

    # 8. Mobil Cubuk
    if ($content -notmatch 'class="mobile-sticky-bar"') {
        $errors += "[Mobil Uyari]: .mobile-sticky-bar bulunamadi."
    }

    # 9. Schema JSON-LD
    if ($content -notmatch 'type="application/ld\+json"') {
        $errors += "[SEO Hatasi]: application/ld+json semasi bulunamadi."
    }

    # 10. Kapanis Etiketleri
    if ($content -notmatch '</body>' -or $content -notmatch '</html>') {
        $errors += "[HTML Butunluk Hatasi]: Sayfanin </body> veya </html> kapanis etiketi eksik!"
    }

    Write-Host "`nSayfa: $($file.Name)" -ForegroundColor Yellow
    if ($errors.Count -eq 0) {
        Write-Host "   [OK] BASARILI: Tum 10 mimari kriter eksiksiz dogrulandi." -ForegroundColor Green
    } else {
        $allPassed = $false
        Write-Host "   [FAIL] BASARISIZ ($($errors.Count) Hata):" -ForegroundColor Red
        foreach ($err in $errors) {
            Write-Host "      * $err" -ForegroundColor Red
        }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "   [INFO] UYARILAR:" -ForegroundColor Cyan
        foreach ($w in $warnings) {
            Write-Host "      - $w" -ForegroundColor Cyan
        }
    }
}

Write-Host ("`n" + ("=" * 70)) -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "TEBRIKLER: TUM KURS SAYFALARI VE MASTER SABLON %100 HATASIZ DOGRULANDI!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "UYARI: BAZI SAYFALARDA KRITER HATASI TESPIT EDILDI." -ForegroundColor Red
    exit 1
}
