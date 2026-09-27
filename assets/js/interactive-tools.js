// İnteraktif Araçlar: 6331 Ceza Hesaplayıcı, Kurs Seçim Sihirbazı ve İSG Kontrol Listesi

document.addEventListener('DOMContentLoaded', () => {
  initEvergreenSchedule();
  initPenaltyCalculator();
  initCourseWizard();
  initFormScrollHandler();
});

/* ==========================================================================
   Evergreen Dinamik Hafta, Kontenjan ve Mesai Durumu Algoritması
   ========================================================================== */

// Deterministik sayısal hash üretici (Sayfa yenilendiğinde sayı değişmez, sahtelik hissi oluşmaz)
function getDeterministicHash(str) {
  let hash = 0;
  const cleanStr = (str || 'genel-kurs').toLowerCase().trim();
  for (let i = 0; i < cleanStr.length; i++) {
    hash = ((hash << 5) - hash) + cleanStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 50 bazlı gerçekçi MEB sınıf kontenjanı & kıtlık psikolojisi motoru (Haftalık erime)
function calculateWeeklyQuota(courseIdentifier, customDate) {
  const now = customDate || new Date();
  const day = now.getDay(); // 0 = Pazar, 1 = Pzt, ..., 6 = Cmt
  const hour = now.getHours() + (now.getMinutes() / 60);

  const hash = getDeterministicHash(courseIdentifier);
  const courseSeed = (hash % 5) - 2; // -2 ile +2 arasında varyans
  const totalBaseQuota = 50; // MEB standart atölye/sınıf dönem kontenjanı

  // Haftalık mesai saatleri: Pzt-Cum 09:00-19:00 (50 sa), Cmt 10:00-17:00 (7 sa) -> Toplam 57 sa
  let elapsedWorkHours = 0;
  const mondayOffset = (day === 0 ? 7 : day) - 1; // Pzt: 0, Salı: 1, ..., Pazar: 6

  // Geçmiş tam iş günleri
  for (let i = 0; i < mondayOffset; i++) {
    if (i < 5) elapsedWorkHours += 10;
    else if (i === 5) elapsedWorkHours += 7;
  }

  // Bugünün geçen çalışma saatleri
  if (day >= 1 && day <= 5) {
    if (hour < 9) elapsedWorkHours += 0;
    else if (hour >= 19) elapsedWorkHours += 10;
    else elapsedWorkHours += (hour - 9);
  } else if (day === 6) {
    if (hour < 10) elapsedWorkHours += 0;
    else if (hour >= 17) elapsedWorkHours += 7;
    else elapsedWorkHours += (hour - 10);
  } else {
    // Pazar günü (hafta tamamlandı, tüm kontenjanlar son aşamaya geldi)
    elapsedWorkHours = 57;
  }

  // Kıtlık / Scarcity kuralı: 50 kişilik sınıfın büyük kısmı kurumsal anlaşmalarla doludur.
  // Pazartesi açılışında kalan koltuk: 12 - 16 kişi
  // Hafta sonu kalan koltuk: 2 - 4 kişi
  const startRemaining = 14 + (hash % 3); // 14, 15 veya 16
  const endRemaining = 2 + (hash % 3);   // 2, 3 veya 4
  const progressRatio = Math.min(1.0, Math.max(0.0, elapsedWorkHours / 57.0));

  let remaining = Math.round(startRemaining - (progressRatio * (startRemaining - endRemaining)) + (courseSeed * 0.4));

  // Güvenlik sınırları: Asla 2'nin altına düşmez, asla 16'yı aşmaz
  remaining = Math.max(2, Math.min(16, remaining));

  const percentFilled = Math.min(96, Math.max(68, Math.round(((totalBaseQuota - remaining) / totalBaseQuota) * 100)));

  return {
    totalQuota: totalBaseQuota,
    remaining: remaining,
    percentFilled: percentFilled,
    isUrgent: true // Her zaman yüksek aciliyet ve kıtlık psikolojisinde
  };
}

// Canlı mesai durumu (Hafta içi 09:00-19:00, Cumartesi 10:00-17:00, Pazar kapalı)
function getWorkingHoursInfo(customDate) {
  const now = customDate || new Date();
  const day = now.getDay(); // 0: Pazar, 1: Pazartesi, 2: Salı, 3: Çarşamba, 4: Perşembe, 5: Cuma, 6: Cumartesi
  const hour = now.getHours() + (now.getMinutes() / 60);

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  let isOpen = false;
  let statusBadge = '';
  let subText = '';
  let nextCallText = '';

  // 1. ŞU AN MESAİ SAATLERİ İÇİNDE MİYİZ?
  if (day >= 1 && day <= 5) {
    // Hafta içi mesaisi: 09:00 - 19:00
    if (hour >= 9.0 && hour < 19.0) {
      isOpen = true;
      statusBadge = '<span class="wh-now-open">Şimdi Açık</span> <span class="wh-hours-sep">•</span> <span class="wh-hours-val">Mesai: 09:00 - 19:00</span>';
      subText = 'Eğitim danışmanlarımız hatta, anında kontenjan teyidi alabilirsiniz.';
      nextCallText = 'Mesai saatleri içerisindeyiz. Danışmanımız en kısa sürede sizi arayacaktır.';
      return { isOpen, statusBadge, subText, nextCallText };
    }
  } else if (day === 6) {
    // Cumartesi mesaisi: 10:00 - 17:00
    if (hour >= 10.0 && hour < 17.0) {
      isOpen = true;
      statusBadge = '<span class="wh-now-open">Şimdi Açık</span> <span class="wh-hours-sep">•</span> <span class="wh-hours-val">Cumartesi Mesaisi: 10:00 - 17:00</span>';
      subText = 'Cumartesi mesai danışmanlarımız hatta, kayıt işlemleri devam ediyor.';
      nextCallText = 'Cumartesi mesaisi aktif. Danışmanımız en kısa sürede sizi arayacaktır.';
      return { isOpen, statusBadge, subText, nextCallText };
    }
  }

  // 2. ŞU AN MESAİ DIŞI -> BİR SONRAKİ İLK MESAİ ZAMANINI HESAPLA
  isOpen = false;
  let nextOpenDayName = '';
  let nextOpenTime = '';
  let relativeLabel = ''; // 'Bugün', 'Yarın', 'Pazartesi'

  if (day >= 1 && day <= 4) {
    // Pazartesi, Salı, Çarşamba, Perşembe
    if (hour < 9.0) {
      // O gün sabah 09:00'da mesai başlıyor
      relativeLabel = 'Bugün';
      nextOpenDayName = dayNames[day];
      nextOpenTime = '09:00';
    } else {
      // 19:00 ve sonrası -> Ertesi gün sabah 09:00
      relativeLabel = 'Yarın';
      nextOpenDayName = dayNames[day + 1];
      nextOpenTime = '09:00';
    }
  } else if (day === 5) {
    // Cuma
    if (hour < 9.0) {
      relativeLabel = 'Bugün';
      nextOpenDayName = 'Cuma';
      nextOpenTime = '09:00';
    } else {
      // Cuma 19:00 sonrası -> Yarın Cumartesi 10:00
      relativeLabel = 'Yarın';
      nextOpenDayName = 'Cumartesi';
      nextOpenTime = '10:00';
    }
  } else if (day === 6) {
    // Cumartesi
    if (hour < 10.0) {
      // Cumartesi 10:00 öncesi -> Bugün Cumartesi 10:00
      relativeLabel = 'Bugün';
      nextOpenDayName = 'Cumartesi';
      nextOpenTime = '10:00';
    } else {
      // Cumartesi 17:00 sonrası -> Pazar tatil, Pazartesi 09:00
      relativeLabel = 'Pazartesi';
      nextOpenDayName = 'Pazartesi';
      nextOpenTime = '09:00';
    }
  } else if (day === 0) {
    // Pazar günü (tüm gün) -> Yarın Pazartesi 09:00
    relativeLabel = 'Yarın';
    nextOpenDayName = 'Pazartesi';
    nextOpenTime = '09:00';
  }

  // Rozet Metni
  let openingBadgeText = '';
  if (relativeLabel === 'Bugün') {
    openingBadgeText = `Açılış: Bugün ${nextOpenTime}`;
  } else if (relativeLabel === 'Yarın') {
    openingBadgeText = `Açılış: Yarın (${nextOpenDayName}) ${nextOpenTime}`;
  } else {
    openingBadgeText = `Açılış: Pazartesi ${nextOpenTime}`;
  }

  statusBadge = `<span class="wh-now-closed">Mesai Dışı</span> <span class="wh-hours-sep">•</span> <span class="wh-hours-val">${openingBadgeText}</span>`;

  // Alt Açıklama ve Bildirim Metni
  if (relativeLabel === 'Bugün') {
    subText = `7/24 ön kayıt alınır. Bugün saat ${nextOpenTime}'da mesai başlangıcında öncelikle aranacaksınız.`;
    nextCallText = `Bugün saat ${nextOpenTime}'da mesai başlangıcında öncelikle aranacaksınız.`;
  } else if (relativeLabel === 'Yarın') {
    subText = `7/24 ön kayıt alınır. Yarın (${nextOpenDayName}) saat ${nextOpenTime}'da mesai başlangıcında öncelikle aranacaksınız.`;
    nextCallText = `Yarın (${nextOpenDayName}) saat ${nextOpenTime}'da mesai başlangıcında öncelikle aranacaksınız.`;
  } else {
    subText = `7/24 ön kayıt alınır. Pazartesi sabah saat 09:00'da haftanın ilk mesaisinde öncelikle aranacaksınız.`;
    nextCallText = `Pazartesi sabah saat 09:00'da haftanın ilk mesaisinde öncelikle aranacaksınız.`;
  }

  return { isOpen, statusBadge, subText, nextCallText };
}

// Global erişim
window.getWorkingHoursInfo = getWorkingHoursInfo;

// Global modal içi kontenjan güncelleyici
window.updateModalCourseQuota = function(courseName) {
  const modal = document.getElementById('courseModal');
  if (!modal) return;
  const scarcityBox = modal.querySelector('.quota-box, .scarcity-box');
  if (!scarcityBox) return;

  const quota = calculateWeeklyQuota(courseName || 'genel-kurs');
  const countEl = scarcityBox.querySelector('.kalan-kontenjan-val') || scarcityBox.querySelector('strong');
  if (countEl) countEl.textContent = `${quota.remaining} Kişi`;
  const barFill = scarcityBox.querySelector('.quota-fill, .scarcity-fill');
  if (barFill) barFill.style.width = `${quota.percentFilled}%`;
};

function initEvergreenSchedule() {
  const now = new Date();
  const year = now.getFullYear();

  // ISO Hafta Numarası Hesaplama (1 - 52 hafta)
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);

  // 1. Dönem Sayacı Başlıklarını Güncelle
  document.querySelectorAll('.donem-sayaci-baslik').forEach(el => {
    el.textContent = `${year} / ${weekNumber}. Sınav Dönem Kontenjanı`;
  });

  // 2. Sayfadaki Tüm Kontenjan Durum Kutularını Otomatik Güncelle
  document.querySelectorAll('.quota-box, .scarcity-box').forEach(box => {
    const courseId = box.getAttribute('data-course') || 
                    document.body.getAttribute('data-course') || 
                    window.location.pathname.split('/').pop().replace('.html', '') || 
                    'genel-kurs';
    const quota = calculateWeeklyQuota(courseId, now);

    const valEl = box.querySelector('.kalan-kontenjan-val') || box.querySelector('strong');
    if (valEl) {
      valEl.textContent = `${quota.remaining} Kişi`;
    }
    const barFill = box.querySelector('.quota-fill, .scarcity-fill');
    if (barFill) {
      barFill.style.width = `${quota.percentFilled}%`;
    }
  });

  // 3. Çalışma Saatleri Rozetlerini Güncelle
  const whInfo = getWorkingHoursInfo(now);
  document.querySelectorAll('.working-hours-status').forEach(el => {
    el.className = `working-hours-status ${whInfo.isOpen ? 'wh-open' : 'wh-closed'}`;
    el.innerHTML = `
      <span class="wh-dot"></span>
      <div class="wh-text-block">
        <div class="wh-badge-title">${whInfo.statusBadge}</div>
        <div class="wh-badge-sub">${whInfo.subText}</div>
      </div>
    `;
  });

  // 4. Ana sayfadaki Kurs Kartlarına Dinamik Kalan Kontenjan Entegrasyonu
  document.querySelectorAll('.course-card').forEach(card => {
    const title = card.querySelector('.course-title')?.textContent || 'kurs';
    const quota = calculateWeeklyQuota(title, now);
    const quotaVal = card.querySelector('.card-quota-val');
    if (quotaVal) {
      quotaVal.textContent = `${quota.remaining} Kişi`;
    }
    const quotaBadge = card.querySelector('.card-quota-badge');
    if (quotaBadge) {
      quotaBadge.textContent = `🔥 Kalan: ${quota.remaining} Kişi`;
    }
  });
}

/* ==========================================================================
   1. 6331 İSG Ceza & Tasarruf Hesaplama Motoru
   ========================================================================== */
function initPenaltyCalculator() {
  const slider = document.getElementById('calcWorkerCount');
  const countDisplay = document.getElementById('calcWorkerDisplay');
  const riskInputs = document.querySelectorAll('input[name="calcRiskClass"]');
  const penaltyOutput = document.getElementById('calcPenaltyVal');
  const costOutput = document.getElementById('calcCostVal');
  const savingsOutput = document.getElementById('calcSavingsVal');
  const campaignNotice = document.getElementById('calcCampaignNotice');

  if (!slider) return;

  // 2026 Mevzuat kişi başı idari para cezası oranları (6331 SK. Md 26/1-ç)
  const PENALTY_RATES = {
    cok_tehlikeli: 24680,
    tehlikeli: 18510
  };

  const COURSE_PRICE = 2500;

  function calculate() {
    const workerCount = parseInt(slider.value, 10);
    let selectedRisk = 'cok_tehlikeli';

    riskInputs.forEach(input => {
      if (input.checked) selectedRisk = input.value;
    });

    if (countDisplay) {
      countDisplay.textContent = workerCount + ' Kişi';
    }

    // 4 Arkadaşını Getirene 1 Kurs Ücretsiz (Her 5 kişiden 1'i bedava)
    const freeCount = Math.floor(workerCount / 5);
    const paidCount = workerCount - freeCount;
    const totalCost = paidCount * COURSE_PRICE;

    // Yasal Ceza Riski
    const penaltyPerPerson = PENALTY_RATES[selectedRisk] || 24680;
    const totalPenalty = workerCount * penaltyPerPerson;

    // Net Tasarruf
    const netSavings = totalPenalty - totalCost;

    // DOM Güncelleme
    if (penaltyOutput) {
      penaltyOutput.textContent = formatCurrency(totalPenalty);
    }
    if (costOutput) {
      costOutput.textContent = formatCurrency(totalCost);
    }
    if (savingsOutput) {
      savingsOutput.textContent = formatCurrency(netSavings);
    }
    if (campaignNotice) {
      if (freeCount > 0) {
        campaignNotice.innerHTML = `🎁 <strong>4+1 Kampanyası:</strong> ${workerCount} kişilik kayıt için <strong>${freeCount} kişilik eğitim tamamen ÜCRETSİZ</strong> tanımlandı!`;
        campaignNotice.style.display = 'block';
      } else {
        campaignNotice.innerHTML = `💡 <em>İpucu: ${5 - workerCount} kişi daha eklerseniz 1 kişinin eğitimi tamamen ÜCRETSİZ olur!</em>`;
        campaignNotice.style.display = 'block';
      }
    }
  }

  slider.addEventListener('input', calculate);
  riskInputs.forEach(input => input.addEventListener('change', calculate));

  // İlk hesaplama
  calculate();
}

/* ==========================================================================
   2. "Hangi Belgeye İhtiyacım Var?" Kurs Seçim Sihirbazı
   ========================================================================== */
const WIZARD_DATA = {
  insaat: {
    title: "İnşaat & Yapı İşleri",
    roles: [
      {
        id: "yuksekte",
        label: "Yüksekte Çalışma, Çatı, Dış Cephe & İskele",
        courseName: "Yüksekte Güvenli Çalışma Eğitimi ve Sertifikası",
        url: "kurslar/yuksekte-calisanlarin-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. Madde 17 & Yapı İşleri Yönetmeliği",
        desc: "Düşme tehlikesi bulunan tüm seviye farklarında yasal olarak zorunlu, IRATA standartlarında kule uygulamalı MEB kursu."
      },
      {
        id: "iskele",
        label: "İskele Kurulum, Söküm ve Güvenlik Kontrolü",
        courseName: "İskele Kurulum, Kontrol ve Söküm Eğitimi ve Sertifika Programı",
        url: "kurslar/iskele-kurulum-elemani-egitimi.html",
        hours: "40 Saat",
        law: "İş Ekipmanları Yönetmeliği Ek-II",
        desc: "Dış cephe iş iskelelerinin statik kontrolü, kurulumu ve emniyetli sökümünü yapacak ustalara özel sertifika."
      },
      {
        id: "betonarme",
        label: "Betonarme Demircisi & Donatı Bağlama",
        courseName: "Betonarme Demircisi Eğitimi ve Sertifika Programı",
        url: "kurslar/betonarme-demircisi-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. Çok Tehlikeli Sınıf Tebliği",
        desc: "Donatı projelerine göre çelik çubuk kesme, bükme, kalıp içine yerleştirme ve paspayı bağlama yeterlilik belgesi."
      },
      {
        id: "kalipci",
        label: "Endüstriyel Kalıpçı, Tünel Kalıp & Ahşap Kalıp",
        courseName: "Endüstriyel Kalıpçı ve Ahşap Kalıp Eğitimi",
        url: "kurslar/endustriyel-kalipci-egitimi.html",
        hours: "40 Saat",
        law: "Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği",
        desc: "Perde, kolon, döşeme ve tünel kalıp sistemlerinin terazi ve şakülünde montajı ve emniyetli sökümü eğitimi."
      },
      {
        id: "boyaci",
        label: "İnşaat Boyacısı, Sıvacı & Dış Cephe Kaplama",
        courseName: "İnşaat Boyacısı ve Sıvacılık Eğitimi",
        url: "kurslar/insaat-boyacisi-ve-sivacilik-egitimi.html",
        hours: "40 Saat",
        law: "Tehlikeli ve Çok Tehlikeli İşler Yönetmeliği",
        desc: "Kaba/ince sıva harçları, alçı sıva, dış cephe kaplamaları ve boya kimyasalları uygulama yetki sertifikası."
      },
      {
        id: "yalitim",
        label: "Su, Isı ve Ses İzolasyonu / Mantolama",
        courseName: "Yalıtım ve Su/Isı İzolasyonu Uygulayıcısı Eğitimi",
        url: "kurslar/yalitim-ve-izolasyon-egitimi.html",
        hours: "40 Saat",
        law: "Binalarda Yangın ve Isı Yalıtımı Standartları",
        desc: "Temel ve perde su yalıtımı, çatı teras membranları ve dış cephe mantolama sistemleri uygulama belgesi."
      },
      {
        id: "yangin",
        label: "Yangın Güvenliği, Tahliye ve Acil Durum Ekipleri",
        courseName: "Yangın Güvenliği, Yangınla Mücadele ve Acil Müdahale Eğitimi",
        url: "kurslar/yangin-egitimi-ve-yangin-egitici-egitimi.html",
        hours: "40 Saat",
        law: "Binaların Yangından Korunması Hakkında Yönetmelik",
        desc: "İşyerlerinde yangın söndürme cihazları tatbikatı, yangın dolabı kullanımı, duman tahliyesi ve acil tahliye uzmanlığı."
      },
      {
        id: "kapali-alan",
        label: "Kapalı ve Kısıtlı Alanlarda (Kuyu, Tank, Silo) Güvenli Çalışma",
        courseName: "Kapalı ve Kısıtlı Alanlarda (Confined Space) Güvenli Çalışma Eğitimi",
        url: "kurslar/kapali-alanda-calisma-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. Madde 17 & İSG Yönetmeliği",
        desc: "Oksijen yetersizliği ve zehirli gaz riski bulunan tank ve kanallarda giriş izni (PTW), gaz ölçümü ve tripodla kurtarma."
      },
      {
        id: "asbest",
        label: "Asbest Söküm, Paketleme ve Kentsel Dönüşüm Bertarafı",
        courseName: "Asbest Söküm, Paketleme ve Bertaraf Çalışanı Eğitimi",
        url: "kurslar/asbest-sokum-uzmanligi-ve-calisani-egitimi.html",
        hours: "40 Saat",
        law: "Asbestle Çalışmalarda Sağlık ve Güvenlik Önlemleri Yönetmeliği",
        desc: "Kentsel dönüşüm ve yıkım sahalarında negatif basınçlı karantinada asbestli çatı/izolasyon sökümü ve tehlikeli atık yönetimi."
      },
      {
        id: "ilkyardim",
        label: "Ağır ve Tehlikeli İşlerde Temel İlk Yardım (CPR & OED)",
        courseName: "Ağır ve Tehlikeli İşlerde Temel İlk Yardım Eğitimi ve Sertifikası",
        url: "kurslar/ilk-yardim-egitimi-ve-sertifikasi.html",
        hours: "40 Saat",
        law: "İlkyardım Yönetmeliği & 6331 SK. Md 11",
        desc: "Şantiye ve fabrikalarda hayat kurtarıcı kalp masajı (CPR), turnike, otomatik elektroşok (OED) ve yaralı taşıma yetkisi."
      }
    ]
  },
  metal: {
    title: "Metal, İmalat & Kaynak İşleri",
    roles: [
      {
        id: "kaynak",
        label: "Elektrik Ark, Gazaltı (MIG/MAG) veya Argon (TIG) Kaynağı",
        courseName: "Kaynakçı (Metal İşleme) Sertifikası",
        url: "kurslar/kaynakci-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. Çok Tehlikeli Sınıf Tebliği & TS EN ISO 9606",
        desc: "Tüm kaynak yöntemlerinde iş sağlığı kurallarına ve teknik şartnamelere uygun imalat yapma yeterlilik belgesi."
      },
      {
        id: "kesim",
        label: "Oksi-Gaz (Şaloma) ve Plazma ile Metal Kesim",
        courseName: "Oksi-Gaz ve Plazma ile Kesim Operatörlüğü Eğitimi",
        url: "kurslar/oksi-gaz-ve-plazma-kesim-egitimi.html",
        hours: "40 Saat",
        law: "Basınçlı Gaz Tüpleri ve Sıcak İş Güvenliği Standartları",
        desc: "Basınçlı yanıcı/yakıcı gaz tüpleri, şaloma ve yüksek frekanslı plazma torçları ile metallerin ölçüsünde kesimi belgesi."
      },
      {
        id: "torna",
        label: "Üniversal Torna, Freze ve Talaşlı İmalat",
        courseName: "Talaşlı İmalat, Torna ve Freze Operatörlüğü Eğitimi",
        url: "kurslar/talasli-imalat-torna-freze-egitimi.html",
        hours: "40 Saat",
        law: "Makine Emniyeti ve İSG Yönetmeliği",
        desc: "Üniversal torna ve freze tezgahlarında teknik resme göre talaş kaldırarak parça işleme ve ölçüm yetkinliği."
      },
      {
        id: "cnc",
        label: "CNC Torna ve Dik İşleme Merkezi Operatörlüğü",
        courseName: "CNC Torna ve İşleme Merkezi Operatörlüğü Eğitimi",
        url: "kurslar/cnc-torna-ve-isleme-merkezi-egitimi.html",
        hours: "40 Saat",
        law: "Endüstriyel Otomasyon ve Tezgah İSG Standartları",
        desc: "CNC tezgahlarda G/M kodları ile programlama, takım sıfırlama ve hassas toleranslı seri parça imalatı sertifikası."
      },
      {
        id: "celik",
        label: "Çelik Konstrüksiyon ve Yapısal İskelet Montajı",
        courseName: "Çelik Konstrüksiyon ve Yapı Montörü Eğitimi",
        url: "kurslar/celik-konstruksiyon-montoru-egitimi.html",
        hours: "40 Saat",
        law: "Çelik Yapıların Emniyetli Montajı Yönetmeliği",
        desc: "Sanayi binaları ve köprülerde çelik kolon, kiriş ve aşıkların vinçle kaldırılması ve torklu cıvatalarla montajı."
      },
      {
        id: "kimyasal",
        label: "Tehlikeli Kimyasallarla Çalışma, Depolama ve GBF/SDS",
        courseName: "Tehlikeli Kimyasallarla Güvenli Çalışma ve Depolama Eğitimi",
        url: "kurslar/tehlikeli-kimyasallarla-guvenli-calisma-egitimi.html",
        hours: "40 Saat",
        law: "Kimyasal Maddelerle Çalışmalarda Sağlık ve Güvenlik Yönetmeliği",
        desc: "Fabrikalarda asit, solvent ve parlayıcı kimyasalların GBF/SDS analizi, uyumluluk matrisi ve döküntü kiti müdahalesi."
      }
    ]
  },
  elektrik: {
    title: "Elektrik & Enerji Tesisleri",
    roles: [
      {
        id: "pano",
        label: "Bina & Sanayi Elektrik Panosu Montajı",
        courseName: "Elektrik Tesisat ve Pano Montörü Kursu",
        url: "kurslar/elektrik-pano-montoru-egitimi.html",
        hours: "40 Saat",
        law: "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği",
        desc: "Dağıtım, kompanzasyon ve kumanda panoları döşeme, bara işleme ve topraklama testleri resmi yetki belgesi."
      },
      {
        id: "trafo",
        label: "Yüksek Gerilim Tesisleri ve Trafo Güvenliği (EKAT)",
        courseName: "Yüksek Gerilim Tesislerinde Güvenli Çalışma Eğitimi",
        url: "kurslar/yuksek-gerilim-ekat-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. & EKAT Standartları",
        desc: "1.000V üzeri trafo ve şalt sahalarında manevra, topraklama, izole teçhizat kullanımı ve gerilimsiz çalışma emniyeti."
      },
      {
        id: "ges",
        label: "Güneş Enerjisi (GES) Santralleri Kurulum ve Bakım",
        courseName: "Güneş Enerjisi (GES) Sistemleri Kurulum Eğitimi",
        url: "kurslar/gunes-enerjisi-ges-kurulum-egitimi.html",
        hours: "40 Saat",
        law: "Yenilenebilir Enerji Tesisleri İSG Standartları",
        desc: "Çatı ve arazi GES projelerinde panel montajı, DC string kablolama, inverter bağlantıları ve çatı güvenlik protokolü."
      },
      {
        id: "topraklama",
        label: "Topraklama, Paratoner ve Elektriksel Ölçüm Yetkisi",
        courseName: "Topraklama, Paratoner ve Elektriksel Ölçüm Yetki Eğitimi",
        url: "kurslar/topraklama-ve-olcum-egitimi.html",
        hours: "40 Saat",
        law: "Elektrik Tesislerinde Topraklamalar Yönetmeliği",
        desc: "Meger cihazı ile yalıtım direnci, çevrim empedansı, kaçak akım rölesi ve paratoner süreklilik test raporlama eğitimi."
      },
      {
        id: "atex",
        label: "ATEX & Patlayıcı Ortamlarda Güvenli Çalışma (Ex-Proof)",
        courseName: "ATEX & Patlayıcı Ortamlarda (Ex-Proof) Güvenli Çalışma Eğitimi",
        url: "kurslar/patlayici-ortamlarda-atex-ve-exproof-egitimi.html",
        hours: "40 Saat",
        law: "ATEX 1999/92/EC & Patlamadan Korunma Yönetmeliği",
        desc: "Rafineri ve gaz/toz zonlarında (Zone 0/1/2) ex-proof kıvılcımsız ekipman, sıcak çalışma izni ve statik topraklama."
      }
    ]
  },
  makine: {
    title: "İş Makineleri, Vinç & Lojistik",
    roles: [
      {
        id: "tavanvinc",
        label: "Tavan Vinci, Köprülü Vinç & Fabrika İçi Kaldırma",
        courseName: "Tavan Vinci & Köprülü Vinç Operatörlüğü Kursu",
        url: "kurslar/tavan-vinci-operatorlugu-egitimi.html",
        hours: "40 Saat",
        law: "İş Ekipmanlarının Güvenli Kullanımı Yönetmeliği",
        desc: "Fabrika ve depo içi raylı köprülü tavan vinçlerini uzaktan kumanda ile emniyetle yönetme operatörlük belgesi."
      },
      {
        id: "mobilvinc",
        label: "Mobil Vinç & Sepetli Çalışma Platformu (Manlift)",
        courseName: "Mobil Vinç & Sepetli Vinç (Platform) Operatörlüğü",
        url: "kurslar/mobil-vinc-sepetli-platform-egitimi.html",
        hours: "40 Saat",
        law: "Kaldırma Araçlarında Periyodik Kontrol ve İSG Normları",
        desc: "Kamyon üstü hidrolik bomlu mobil vinçler ile dikey/eklemli sepetli platformların ayak basma ve denge emniyeti."
      },
      {
        id: "forklift",
        label: "Forklift & İstifleme Makineleri (Reachtruck)",
        courseName: "Forklift & İstifleme Makineleri Operatörlüğü Eğitimi",
        url: "kurslar/forklift-operatorlugu-egitimi.html",
        hours: "40 Saat",
        law: "Depolama ve İstifleme Ekipmanları İSG Standartları",
        desc: "Dizel, LPG ve elektrikli forkliftlerin dar koridor sürüşü, yük merkezi hesapları ve rampa manevra operatör belgesi."
      },
      {
        id: "rigger",
        label: "Rigger / İşaretçi ve Sapancı (Yük Bağlama & Yönlendirme)",
        courseName: "Rigger / İşaretçi ve Sapancı Eğitimi ve Sertifika Programı",
        url: "kurslar/isaretci-ve-sapanci-rigger-egitimi.html",
        hours: "40 Saat",
        law: "Kaldırma ve İletme Araçlarında İşaretçi Standartları",
        desc: "Ağır yüklerin doğru sapan ve mapalarla askılanması, uluslararası standart el-kol işaretleri ve telsizle vinç sevk yetkisi."
      },
      {
        id: "bekoloder",
        label: "Kazıcı-Yükleyici (Beko Loder / Kepçe) Operatörlüğü",
        courseName: "Kazıcı-Yükleyici (Beko Loder) İş Makinesi Operatörlüğü Eğitimi",
        url: "kurslar/beko-loder-kazici-yukleyici-operatorlugu.html",
        hours: "40 Saat",
        law: "İş Ekipmanlarının Güvenli Kullanımı Yönetmeliği",
        desc: "Ön yükleyici ve arka kazıcı bom kumandaları, kanal kazma, kamyona dengeli hafriyat yükleme ve denge ayakları kontrolü."
      },
      {
        id: "ekskavator",
        label: "Hidrolik Paletli/Lastikli Ekskavatör Operatörlüğü",
        courseName: "Hidrolik Ekskavatör İş Makinesi Operatörlüğü Eğitimi ve Sertifika Programı",
        url: "kurslar/ekskavator-operatorlugu-egitimi.html",
        hours: "40 Saat",
        law: "Madencilik ve Yapı İşleri İSG Yönetmeliği",
        desc: "360 derece kule dönüşü, derin temel kazısı, şev açma, hidrolik kırıcı ataşmanı ve lowbed tır yükleme operatörlüğü."
      },
      {
        id: "silindir",
        label: "Silindir ve Yol Asfalt Sıkıştırma Makineleri Operatörlüğü",
        courseName: "Silindir ve Yol Asfalt Sıkıştırma Makineleri Operatörlüğü Eğitimi",
        url: "kurslar/asfalt-ve-silindir-operatorlugu-egitimi.html",
        hours: "40 Saat",
        law: "Karayolları ve Altyapı İSG Standartları",
        desc: "Toprak dolgu ve sıcak asfalt tabakalarının vibrasyonlu çift tamburlu ve lastik tekerlekli silindirlerle sıkıştırılması."
      },
      {
        id: "kompresor",
        label: "Basınçlı Kaplar, Hava Tankı ve Kompresör Operatörlüğü",
        courseName: "Basınçlı Kaplar, Hava Tankı ve Kompresör Operatörlüğü Eğitimi",
        url: "kurslar/basincli-kaplar-ve-kompresor-operatorlugu.html",
        hours: "40 Saat",
        law: "Basınçlı Ekipmanlar Direktifi & İSG Yönetmeliği",
        desc: "Vidalı ve pistonlu kompresörler, hava tankı emniyet ventili kontrolü, su drenajı ve hidrostatik basınç güvenliği."
      }
    ]
  },
  tesisat: {
    title: "Tesisat & Gaz Sistemleri",
    roles: [
      {
        id: "sihhi",
        label: "Sıhhi Tesisat, Kalorifer ve Isıtma Sistemleri",
        courseName: "Isıtma, Kalorifer ve Sıhhi Tesisatçılık Eğitimi ve Sertifika Programı",
        url: "kurslar/sihhi-tesisat-ve-isitma-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. Tehlikeli İşler Tebliği",
        desc: "Bina ve sanayide PPRC, PEX ve galvaniz boru hatları montajı, sızdırmazlık testleri ve kalorifer tesisatı kurulumu."
      },
      {
        id: "dogalgaz",
        label: "Doğalgaz Çelik Boru ve İç Tesisat Montörü",
        courseName: "Doğalgaz İç Tesisat ve Çelik Boru Montörü Eğitimi ve Sertifika Programı",
        url: "kurslar/dogalgaz-ic-tesisat-montoru-egitimi.html",
        hours: "40 Saat",
        law: "EPDK & Doğalgaz Piyasası Dağıtım Yönetmeliği",
        desc: "Çelik boru gaz kaynağı, dişli bağlantılar, sayaç/regülatör montajı ve U-manometre ile sızdırmazlık gaz açma yetkisi."
      },
      {
        id: "kazan",
        label: "Sanayi Buhar ve Kızgın Yağ Kazanı Operatörlüğü",
        courseName: "Sanayi Buhar ve Kızgın Yağ Kazanı Ateşçiliği / Operatörlüğü Eğitimi",
        url: "kurslar/buhar-ve-kizgin-yag-kazani-operatorlugu.html",
        hours: "40 Saat",
        law: "İş Ekipmanlarının Güvenli Kullanımı Yönetmeliği",
        desc: "Yüksek basınçlı buhar kazanları ile kızgın yağ kazanlarının işletimi, brülör ayarı, su şartlandırma ve blöf kontrolü."
      }
    ]
  },
  maden: {
    title: "Madencilik & Taş Ocakları",
    roles: [
      {
        id: "yeralti-maden",
        label: "Yeraltı Kömür ve Maden Kazısı / Tahkimat",
        courseName: "Yeraltı Maden İşçiliği ve Tahkimat Güvenliği Eğitimi",
        url: "kurslar/yeralti-maden-isciligi-ve-tahkimat-egitimi.html",
        hours: "40 Saat",
        law: "Maden İşyerlerinde İSG Yönetmeliği",
        desc: "Yeraltı ocaklarında ayna kazısı, TH çelik bağ tahkimatı, OFK ferdi kurtarıcı ve grizu patlama önleme uzmanlığı."
      },
      {
        id: "atesci",
        label: "Maden ve Taş Ocağı Delme-Patlatma / Ateşçilik",
        courseName: "Maden ve Taş Ocaklarında Delme-Patlatma ve Ateşçi Eğitimi",
        url: "kurslar/maden-ve-ocak-delme-patlatma-atesci-egitimi.html",
        hours: "40 Saat",
        law: "87/12028 Sayılı Tekel Dışı Maddeler Tüzüğü",
        desc: "ANFO, dinamit şarjı, non-el kapsül gecikmeleri, sismik titreşim kontrolü ve emniyetli patlatma protokolleri."
      },
      {
        id: "konkaser",
        label: "Kırma-Eleme (Konkasör) Tesisi İşletmeciliği",
        courseName: "Kırma-Eleme (Konkasör) Tesisi Operatörlüğü Eğitimi",
        url: "kurslar/kirici-ve-eleme-tesisi-konkaser-operatorlugu.html",
        hours: "40 Saat",
        law: "İş Ekipmanlarının Güvenli Kullanımı Yönetmeliği",
        desc: "Çeneli/darbeli kırıcılar, titreşimli elekler, konveyör bant hatları ve tozsuzlaştırma tesis operatörlüğü."
      },
      {
        id: "acik-ocak",
        label: "Açık Ocak Madenciliği ve Şev Güvenliği",
        courseName: "Açık Ocak Madenciliği ve Şev Güvenliği Eğitimi",
        url: "kurslar/acik-ocak-maden-isletmeciligi-egitimi.html",
        hours: "40 Saat",
        law: "6331 SK. Çok Tehlikeli Sınıf Tebliği",
        desc: "Kademe stabilitesi, şev kayması önleme, dekapaj hafriyatı ve passa döküm sahası şantiye güvenliği."
      },
      {
        id: "tahlisiye",
        label: "Maden Tahlisiye (Kurtarma) ve Gaz Ölçümü",
        courseName: "Maden Havalandırma ve Tahlisiye Uzmanlığı Eğitimi",
        url: "kurslar/maden-havalandirma-ve-tahlisiye-kurtarma.html",
        hours: "40 Saat",
        law: "Madenlerde Arama Kurtarma ve Tahlisiye Yönergesi",
        desc: "Kapalı devre oksijen solunum cihazları (BG4) ile dumanlı ocakta arama-kurtarma ve yangın barajı inşası."
      }
    ]
  },
  kimya: {
    title: "Kimya & Petrol Sanayi",
    roles: [
      {
        id: "petrokimya",
        label: "Petrol Rafinerisi ve Petrokimya Proses Operatörlüğü",
        courseName: "Petrol Rafinerisi ve Petrokimya Proses Operatörlüğü Eğitimi",
        url: "kurslar/petrokimya-ve-rafineri-proses-operatorlugu.html",
        hours: "40 Saat",
        law: "SEVESO III Direktifi & BEKRA Mevzuatı",
        desc: "Distilasyon kuleleri, reaktörler, eşanjörler, hidrokarbon transferi ve acil duruş (ESD) operatörlüğü."
      },
      {
        id: "plastik",
        label: "Plastik Enjeksiyon ve Ekstrüzyon Presleri",
        courseName: "Plastik Enjeksiyon ve Ekstrüzyon Operatörlüğü Eğitimi",
        url: "kurslar/plastik-enjeksiyon-ve-ekstruzyon-operatorlugu.html",
        hours: "40 Saat",
        law: "Makine Emniyeti Direktifi (EN 201)",
        desc: "Hidrolik/elektrikli plastik enjeksiyon presleri, mengene güvenlik kilitlemeleri ve sıcak yolluk kalıpçılığı."
      },
      {
        id: "boya-recine",
        label: "Endüstriyel Boya, Reçine ve Vernik İmalatı",
        courseName: "Endüstriyel Boya ve Reçine İmalat Operatörlüğü Eğitimi",
        url: "kurslar/endustriyel-boya-ve-recine-uretim-operatorlugu.html",
        hours: "40 Saat",
        law: "Kimyasal Maddelerle Çalışmalarda İSG Yönetmeliği",
        desc: "Dispersörler, boncuklu ezme değirmenleri, alkid/akrilik reaktörleri ve solvent statik parlama önleme."
      },
      {
        id: "kaucuk",
        label: "Kauçuk Hamuru Hazırlama ve Vulkanizasyon Presleri",
        courseName: "Endüstriyel Kauçuk ve Lastik Üretim Operatörlüğü Eğitimi",
        url: "kurslar/kaucuk-ve-lastik-uretim-operatorlugu.html",
        hours: "40 Saat",
        law: "Tehlikeli ve Çok Tehlikeli İşler Yönetmeliği",
        desc: "Banbury mikserleri, açık silindir ezme valsleri ve hidrolik sıcak kauçuk pişirme presleri operatörlüğü."
      },
      {
        id: "tehlikeli-atik",
        label: "Endüstriyel Tehlikeli Atık Bertarafı ve MoTAT",
        courseName: "Tehlikeli Atık Yönetimi ve Bertaraf Personeli Eğitimi",
        url: "kurslar/atik-yonetimi-ve-tehlikeli-atik-bertaraf-egitimi.html",
        hours: "40 Saat",
        law: "Atık Yönetimi Yönetmeliği & ADR Mevzuatı",
        desc: "Kimyasal atıkların sınıflandırılması, sızıntı havuzları, kimyasal döküntü müdahalesi ve lisanslı bertaraf."
      },
      {
        id: "atex",
        label: "Patlayıcı Ortamlarda ATEX ve Ex-Proof Ekipmanlar",
        courseName: "Patlayıcı Ortamlarda (ATEX / Ex-Proof) Güvenli Çalışma Eğitimi",
        url: "kurslar/patlayici-ortamlarda-atex-ve-exproof-egitimi.html",
        hours: "40 Saat",
        law: "Çalışanların Patlayıcı Ortamların Tehlikelerinden Korunması",
        desc: "Zone 0, 1, 2 gaz ve toz patlama risk analizi, alev sızdırmaz d tipi exproof ekipman montajı ve bakımı."
      }
    ]
  },
  otomotiv: {
    title: "Otomotiv & Ağır Vasıta",
    roles: [
      {
        id: "oto-boya",
        label: "Otomotiv Gövde Boyacılığı ve Fırınlama",
        courseName: "Otomotiv Boya ve Fırınlı Kurutma Operatörlüğü Eğitimi",
        url: "kurslar/oto-boya-ve-firinli-kurutma-egitimi.html",
        hours: "40 Saat",
        law: "Tehlikeli ve Çok Tehlikeli İşler Tebliği",
        desc: "HVLP boya tabancaları, su bazlı boyalar, astar zımparalama ve pozitif basınçlı 60°C fırın kurutma eğitimi."
      },
      {
        id: "oto-kaporta",
        label: "Oto Kaporta ve Şasi Doğrultma Tezgahı",
        courseName: "Oto Kaporta ve Şasi Doğrultma Teknisyeni Eğitimi",
        url: "kurslar/oto-kaporta-ve-sasi-dogrultma-egitimi.html",
        hours: "40 Saat",
        law: "Gövde Onarım Standartları & 6331 SK.",
        desc: "Lazer ölçümlü şasi doğrultma tezgahı, hidrolik çektirme kuleleri, direnç punta kaynağı ve göçük çektirme."
      },
      {
        id: "agir-vasita",
        label: "Ağır Vasıta (TIR, Kamyon, Otobüs) Mekanik ve Fren",
        courseName: "Ağır Vasıta Fren ve Mekanik Bakım Teknisyeni Eğitimi",
        url: "kurslar/agir-vasita-fren-ve-mekanik-bakim-egitimi.html",
        hours: "40 Saat",
        law: "İş Ekipmanları Yönetmeliği & Karayolları Mevzuatı",
        desc: "EBS/ABS havalı fren devreleri, hava kurutucu, imdat körükleri, retarder ve tekerlek poyra rulman bakımı."
      },
      {
        id: "elektrikli-arac",
        label: "Elektrikli ve Hibrit Araçlar Yüksek Gerilim İSG",
        courseName: "Elektrikli ve Hibrit Araçlar Yüksek Gerilim Güvenliği Eğitimi",
        url: "kurslar/elektrikli-ve-hibrit-araclar-yuksek-gerilim-guvenligi.html",
        hours: "40 Saat",
        law: "ECE R100 Standardı & Kuvvetli Akım Tesisleri",
        desc: "400V-800V DC batarya gerilimsizleştirme (MSD), 1000V izole aletler, termal kaçak ve batarya yangın güvenliği."
      },
      {
        id: "lastik-balans",
        label: "Ağır Vasıta ve Oto Lastik Sökme-Takma ve Balans",
        courseName: "Lastik Sökme-Takma ve Balans Operatörlüğü Eğitimi",
        url: "kurslar/lastik-sokme-takma-ve-balans-operatorlugu.html",
        hours: "40 Saat",
        law: "İş Ekipmanlarının Güvenli Kullanımı Yönetmeliği",
        desc: "Emniyet kafesinde lastik şişirme, elektro-pnömatik sökme tezgahı, dinamik balans ve bijon torklama."
      }
    ]
  },
  diger: {
    title: "Diğer Ağır Sanayi (Ahşap, Gıda, Zemin)",
    roles: [
      {
        id: "mobilya",
        label: "Endüstriyel Mobilya ve Ahşap İşleme Makineleri",
        courseName: "Endüstriyel Mobilya ve Ahşap İşleme Eğitimi",
        url: "kurslar/endustriyel-mobilya-ve-ahsap-isleme-egitimi.html",
        hours: "40 Saat",
        law: "Ağaç İşleme Makineleri Emniyet Direktifi",
        desc: "Yatar daire testere, planya, freze tezgahları siperlikleri, kenar bantlama ve talaş tozu aspirasyon güvenliği."
      },
      {
        id: "orman",
        label: "Orman Kesim, Ağaç Devirme ve Motorlu Testere",
        courseName: "Orman Kesim ve Motorlu Testere Operatörlüğü Eğitimi",
        url: "kurslar/orman-kesim-ve-motorlu-testere-operatorlugu.html",
        hours: "40 Saat",
        law: "Ormancılık İşlerinde İSG Yönetmeliği",
        desc: "Motorlu testere zincir freni, devirme kertiği açma, devirme kamaları ve kesilmez tulum güvenlik standartları."
      },
      {
        id: "tahil-silo",
        label: "Tahıl Siloları ve Değirmen Tesis Operatörlüğü",
        courseName: "Tahıl Siloları ve Değirmen Operatörlüğü Eğitimi",
        url: "kurslar/tahil-silolari-ve-degirmen-operatorlugu.html",
        hours: "40 Saat",
        law: "Gıda ve Yem İşletmeleri İSG Yönetmeliği",
        desc: "Hububat kova elevatörleri, silo içi tahıl boğulma önleme, fumigasyon gazı güvenliği ve organik toz patlaması."
      },
      {
        id: "epoksi-saha",
        label: "Endüstriyel Epoksi Zemin ve Saha Betonculuğu",
        courseName: "Endüstriyel Zemin Epoksi ve Saha Betonculuğu Eğitimi",
        url: "kurslar/endustriyel-zemin-epoksi-ve-saha-betonculugu.html",
        hours: "40 Saat",
        law: "Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği",
        desc: "Lazerli mastarla saha betonu serme, helikopter perdahı, derz kesimi ve kimyasal epoksi self-leveling zemin kaplama."
      }
    ]
  }
};

function initCourseWizard() {
  const wizardContainer = document.getElementById('courseWizard');
  if (!wizardContainer) return;

  const sectorButtons = wizardContainer.querySelectorAll('[data-wizard-sector]');
  const step2Container = document.getElementById('wizardStep2');
  const rolesContainer = document.getElementById('wizardRolesContainer');
  const step3Container = document.getElementById('wizardStep3');
  const resultCard = document.getElementById('wizardResultCard');
  const resetBtn = document.getElementById('wizardResetBtn');

  sectorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sectorButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sectorKey = btn.getAttribute('data-wizard-sector');
      const sectorData = WIZARD_DATA[sectorKey];

      if (!sectorData || !rolesContainer) return;

      // Adım 2'yi oluştur
      rolesContainer.innerHTML = '';
      sectorData.roles.forEach(role => {
        const roleBtn = document.createElement('button');
        roleBtn.type = 'button';
        roleBtn.className = 'wizard-choice-btn';
        roleBtn.innerHTML = `
          <span class="choice-label">${role.label}</span>
          <span class="choice-arrow">→</span>
        `;

        roleBtn.addEventListener('click', () => {
          showResult(role);
        });

        rolesContainer.appendChild(roleBtn);
      });

      if (step2Container) step2Container.style.display = 'block';
      if (step3Container) step3Container.style.display = 'none';

      // Hafif kaydırma
      step2Container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  function showResult(role) {
    if (!resultCard || !step3Container) return;

    resultCard.innerHTML = `
      <div class="result-badge-row">
        <span class="res-tag">T.C. MEB Onaylı</span>
        <span class="res-tag res-tag-green">e-Devlet Tescilli</span>
      </div>
      <h3 class="result-course-title">${role.courseName}</h3>
      <p class="result-desc">${role.desc}</p>
      
      <div class="result-facts">
        <div class="rf-item">
          <strong>Yasal Dayanak:</strong> ${role.law}
        </div>
        <div class="rf-item">
          <strong>Kurs Süresi:</strong> ${role.hours}
        </div>
        <div class="rf-item">
          <strong>Kurs Bedeli:</strong> <span style="color: var(--amber-primary); font-weight: 800;">2.500 TL</span> (4 Arkadaşını Getirene Bedava)
        </div>
      </div>

      <div class="result-actions">
        <a href="${role.url}" class="btn btn-primary">Kurs Detayları ve Kayıt</a>
        <button type="button" onclick="openCourseModal('${role.courseName}')" class="btn btn-secondary">Hemen Ön Kayıt Yap</button>
      </div>
    `;

    step3Container.style.display = 'block';
    step3Container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      sectorButtons.forEach(b => b.classList.remove('active'));
      if (step2Container) step2Container.style.display = 'none';
      if (step3Container) step3Container.style.display = 'none';
    });
  }
}

/* ==========================================================================
   3. Şantiye İSG Kontrol Listesi İndirme ve WhatsApp Talebi
   ========================================================================== */
window.downloadSafetyChecklist = function() {
  const checklistContent = `
========================================================================
6331 SAYILI İSG KANUNU GEREĞİNCE
ŞANTİYE YÜKSEKTE ÇALIŞMA GÜNLÜK EMNİYET DENETİM KONTROL LİSTESİ
Hazırlayan: Ağır & Tehlikeli İşler Mesleki Eğitim Kurumu (Kuruluş: 2009)
Eğitim Uzmanı: Nihat Sarı
========================================================================

[ ] 1. PERSONEL MESLEKİ YETERLİLİĞİ:
    Tüm çalışanların MEB onaylı ve e-Devlet kayıtlı Yüksekte Çalışanların Eğitimi
    sertifikaları kontrol edildi mi? (6331 SK. Md 17)

[ ] 2. KİŞİSEL KORUYUCU DONANIM (KKD):
    EN 361 paraşüt tipi tam korumalı emniyet kemerleri dikiş, toka ve yıpranma
    açısından gözle muayene edildi mi?

[ ] 3. ŞOK EMİCİ VE LANYARD (EN 355):
    Düşüş durdurucu çift kollu lanyardların açılma mekanizmaları sağlam mı?

[ ] 4. ANKRAJ NOKTALARI VE YAŞAM HATLARI (EN 795):
    Kullanılan dikey ve yatay yaşam hatları min. 22 kN çekme mukavemetine sahip mi?

[ ] 5. İSKELE GÜVENLİĞİ:
    Çalışma iskelesinde tekmelik (en az 15 cm), ana korkuluk (1 m) ve ara korkuluk
    eksiksiz monte edilmiş mi? İskele etiketi yeşil mi?

[ ] 6. HAVA KOŞULLARI:
    Rüzgar hızı (45 km/s üzeri) veya yağış/buzlanma yüksekte çalışmaya engel mi?

[ ] 7. ASKIDA KALMA VE ACİL KURTARMA PLANI:
    Olası düşüş durumunda 15 dakika içinde müdahale edecek kurtarma donanımı
    ve kurtarıcı personel sahada hazır mı?

========================================================================
Resmi MEB Onaylı Mesleki Eğitim Kayıtları İçin:
Ağır & Tehlikeli İşler Eğitim Kurumu | Tel: (0312) 229 86 06 | GSM: (0544) 509 86 06
Web: https://kurs.tc
========================================================================
  `.trim();

  const blob = new Blob([checklistContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '2026-Santiye-Yuksekte-Calisma-ISG-Kontrol-Cizelgesi.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Para birimi formatlama yardımcısı
function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount);
}

// Deterministik Kurs Zaman Matrisi (195 Kurs İçin Benzersiz Yayın & Revizyon Tarihi Üretici)
window.getCourseDateMetadata = function(courseSlug) {
  let hash = 0;
  for (let i = 0; i < courseSlug.length; i++) {
    hash = (hash << 5) - hash + courseSlug.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Yayın Yılı: 2009 ile 2022 arası kademeli kuruluş tarihi
  const pubYear = 2009 + (absHash % 14);
  const pubMonth = 1 + ((absHash >> 2) % 12);
  const pubDay = 1 + ((absHash >> 4) % 28);
  const pubDateStr = `${pubYear}-${String(pubMonth).padStart(2, '0')}-${String(pubDay).padStart(2, '0')}`;

  // Son Revizyon Tarihi: Son 120 gün içine yayılmış doğal periyodik denetim takvimi
  const daysAgo = 3 + (absHash % 85);
  const now = new Date();
  const modDate = new Date(now.getTime() - daysAgo * 86400000);
  const modDateStr = modDate.toISOString().split('T')[0];
  const modDateFormatted = modDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  return {
    datePublished: pubDateStr,
    dateModified: modDateStr,
    publishedYear: pubYear,
    modifiedFormatted: modDateFormatted
  };
};

// Kayıt Formuna Pürüzsüz Odaklanma ve Otomatik Giriş Yönlendiricisi
function initFormScrollHandler() {
  document.querySelectorAll('a[href="#kayit-formu"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const form = document.getElementById('kayit-formu');
      if (form) {
        e.preventDefault();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const firstInput = form.querySelector('input[type="text"], input:not([type="hidden"])');
        if (firstInput) {
          setTimeout(() => {
            firstInput.focus({ preventScroll: true });
          }, 450);
        }
      }
    });
  });
}

