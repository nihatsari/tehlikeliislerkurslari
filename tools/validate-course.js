/**
 * Kurs Sayfaları Bütünlük ve Sıfır Hata Doğrulama Aracı
 * Kullanım: node tools/validate-course.js [dosya-yolu]
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_SCRIPTS = [
  'form-handler.js',
  'app.js',
  'interactive-tools.js'
];

const REQUIRED_CSS = [
  'style.css',
  'course.css'
];

const REQUIRED_CALC_IDS = [
  'calcWorkerCount',
  'calcWorkerDisplay',
  'calcPenaltyVal',
  'calcCostVal',
  'calcSavingsVal'
];

function validateCourseHtml(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];

  // 1. Script Kontrolleri
  REQUIRED_SCRIPTS.forEach(script => {
    if (!content.includes(script)) {
      errors.push(`[Eksik Script]: ${script} script etiketi bulunamadı.`);
    }
  });

  // 2. CSS Kontrolleri
  REQUIRED_CSS.forEach(css => {
    if (!content.includes(css)) {
      errors.push(`[Eksik CSS]: ${css} stylesheet bağlantısı bulunamadı.`);
    }
  });

  // 3. Çift Bullet / Tick Hatası Denetimi
  // li içinde hem siyah nokta karakteri veya bullet hem de svg tick var mı?
  if (content.match(/<li[^>]*>\s*[•·-]\s*<svg/i) || content.match(/<li[^>]*>\s*<svg[^>]*>[\s\S]*?[•·-]/i)) {
    errors.push(`[Çift Bullet Hatası]: Liste öğesinde hem metin noktası (•) hem de SVG onay işareti tespit edildi!`);
  }

  // 4. Sosyal Kanıt Bandı (3 Sütun)
  if (!content.includes('class="social-proof-strip"')) {
    errors.push(`[Eksik Bileşen]: .social-proof-strip kapsayıcısı bulunamadı.`);
  } else {
    const statMatches = content.match(/class="sp-item-num"/g);
    if (!statMatches || statMatches.length < 3) {
      warnings.push(`[İstatistik Uyarısı]: .social-proof-strip içinde 3 adet sp-item-num bulunmalı, ${statMatches ? statMatches.length : 0} bulundu.`);
    }
  }

  // 5. Ceza ve Tasarruf Hesaplayıcı
  REQUIRED_CALC_IDS.forEach(id => {
    if (!content.includes(`id="${id}"`)) {
      errors.push(`[Hesaplayıcı Hatası]: Gerekli ID bulunamadı: #${id}`);
    }
  });

  if (!content.includes('name="calcRiskClass"')) {
    errors.push(`[Hesaplayıcı Hatası]: Tehlike sınıfı radyo butonları (name="calcRiskClass") bulunamadı.`);
  }

  // 6. SSS Akordeon
  if (!content.includes('class="faq-accordion"')) {
    errors.push(`[Eksik Bileşen]: .faq-accordion bulunamadı.`);
  } else {
    if (!content.includes('class="faq-item active"')) {
      warnings.push(`[Akordeon Uyarısı]: Varsayılan olarak açık olan (.faq-item.active) ilk soru bulunamadı.`);
    }
    if (!content.includes('class="faq-trigger"')) {
      errors.push(`[Akordeon Hatası]: .faq-trigger butonları bulunamadı.`);
    }
    if (!content.includes('class="faq-content"')) {
      errors.push(`[Akordeon Hatası]: .faq-content cevap alanları bulunamadı.`);
    }
  }

  // 7. Form Kartı & Yapışkan Sidebar
  if (!content.includes('class="sticky-reg-card"')) {
    errors.push(`[Eksik Bileşen]: .sticky-reg-card kayıt kartı bulunamadı.`);
  }
  if (!content.includes('data-headless-form="true"')) {
    errors.push(`[Form Hatası]: Form etiketinde data-headless-form="true" özniteliği eksik.`);
  }

  // 8. Mobil Sabit Alt Bar
  if (!content.includes('class="mobile-sticky-bar"')) {
    errors.push(`[Mobil Uyarı]: .mobile-sticky-bar bulunamadı.`);
  }

  // 9. Schema JSON-LD
  if (!content.includes('type="application/ld+json"')) {
    errors.push(`[SEO Hatası]: application/ld+json yapısal veri şeması bulunamadı.`);
  } else {
    try {
      const jsonMatches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
      if (jsonMatches) {
        jsonMatches.forEach((match, idx) => {
          const rawJson = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          // Şablondaki {{...}} değişkenleri parse hatası vermemesi için testte geçici temizle
          const sanitized = rawJson.replace(/\{\{[^}]+\}\}/g, '"TEMPL_VAL"');
          JSON.parse(sanitized);
        });
      }
    } catch (e) {
      errors.push(`[JSON-LD Sentaks Hatası]: Yapısal veri JSON formatı geçersiz: ${e.message}`);
    }
  }

  // 10. Son Kapanış Etiketleri (Truncation / Eksik Kapanma Kontrolü)
  if (!content.includes('</body>') || !content.includes('</html>')) {
    errors.push(`[HTML Bütünlük Hatası]: Sayfanın </body> veya </html> kapanış etiketi eksik (dosya kesintiye uğramış olabilir).`);
  }

  return {
    file: fileName,
    passed: errors.length === 0,
    errors,
    warnings
  };
}

// Ana Çalıştırıcı
const targetArg = process.argv[2];
let targetFiles = [];

if (targetArg) {
  targetFiles = [path.resolve(targetArg)];
} else {
  const kurslarDir = path.resolve(__dirname, '../kurslar');
  targetFiles = fs.readdirSync(kurslarDir)
    .filter(f => f.endsWith('.html') && !f.includes('ref'))
    .map(f => path.join(kurslarDir, f));
}

console.log('='.repeat(70));
console.log('🔍 AĞIR & TEHLİKELİ İŞLER - KURS SAYFALARI BÜTÜNLÜK DOĞRULAYICI');
console.log('='.repeat(70));

let allPassed = true;

targetFiles.forEach(file => {
  const res = validateCourseHtml(file);
  console.log(`\n📄 ${res.file}:`);
  if (res.passed) {
    console.log(`   ✅ BAŞARILI: Tüm 10 mimari kriter eksiksiz doğrulandı.`);
  } else {
    allPassed = false;
    console.log(`   ❌ BAŞARISIZ (${res.errors.length} Hata):`);
    res.errors.forEach(err => console.log(`      • ${err}`));
  }

  if (res.warnings.length > 0) {
    console.log(`   ⚠️ UYARILAR (${res.warnings.length}):`);
    res.warnings.forEach(w => console.log(`      - ${w}`));
  }
});

console.log('\n' + '='.repeat(70));
if (allPassed) {
  console.log('🎉 TÜM KURS SAYFALARI VE ŞABLON %100 HATASIZ DOĞRULANDI!');
  process.exit(0);
} else {
  console.log('⚠️ BAZI SAYFALARDA KRİTER HATASI TESPİT EDİLDİ.');
  process.exit(1);
}
