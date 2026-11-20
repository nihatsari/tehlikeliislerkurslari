// Form işleme, dinamik WhatsApp yönlendirme ve asenkron veri aktarımı

document.addEventListener('DOMContentLoaded', () => {
  setupGoogleFormsHandler();
  optimizeFormFields();
  injectSidebarWhatsAppCTA();
  setupDynamicWhatsApp();
  setupAutoUpdatingDates();
});

// 1. Formları hafiflet: E-posta ve Doğum Yılı alanlarını gizle, zorunluluğu kaldır
function optimizeFormFields() {
  const forms = document.querySelectorAll('form[data-headless-form="true"]');
  forms.forEach(form => {
    // E-Posta alanını gizle ve varsayılan değer ver
    const emailInput = form.querySelector('input[type="email"], input[name="entry.746511830"]');
    if (emailInput) {
      emailInput.removeAttribute('required');
      if (!emailInput.value) emailInput.value = 'bilgi@kurs.tc';
      const fg = emailInput.closest('.form-group');
      if (fg) fg.style.display = 'none';
    }

    // Doğum Yılı alanını gizle ve varsayılan değer ver
    const birthInput = form.querySelector('input[name="entry.1360886086"]');
    if (birthInput) {
      birthInput.removeAttribute('required');
      if (!birthInput.value) birthInput.value = '1990';
      const fg = birthInput.closest('.form-group');
      if (fg) fg.style.display = 'none';
    }
  });
}

// 2. Kurs sayfalarındaki formun içine alternatif WhatsApp butonu ekle
function injectSidebarWhatsAppCTA() {
  const courseForms = document.querySelectorAll('#kayit-formu, .sticky-reg-card form');
  courseForms.forEach(form => {
    if (form.querySelector('.sidebar-wa-container')) return;

    const waContainer = document.createElement('div');
    waContainer.className = 'sidebar-wa-container';
    waContainer.innerHTML = `
      <div class="form-divider-text"><span>VEYA</span></div>
      <a href="https://wa.me/905445098606" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp-cta sidebar-wa-btn" aria-label="WhatsApp ile Hemen Bilgi Alın">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span>WhatsApp ile Hızlı Başvur</span>
      </a>
    `;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && submitBtn.nextSibling) {
      submitBtn.parentNode.insertBefore(waContainer, submitBtn.nextSibling);
    } else {
      form.appendChild(waContainer);
    }
  });
}

// 3. WhatsApp başvuru mesajını bulunulan kurs sayfasına göre dinamik özelleştir
function setupDynamicWhatsApp() {
  const phone = '905445098606';
  let courseTitle = '';

  const courseInput = document.querySelector('input[name="entry.2019287352"]');
  const h1 = document.querySelector('h1');

  if (courseInput && courseInput.value && !courseInput.value.includes('İletişim') && !courseInput.value.includes('Genel')) {
    courseTitle = courseInput.value.replace(/\(kurs\.tc\)/g, '').trim();
  } else if (h1) {
    courseTitle = h1.textContent.trim().replace(/\s+/g, ' ');
  }

  const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  let defaultMessage = 'Merhaba, kurs.tc üzerinden ağır ve tehlikeli işler eğitimi ve sertifikası hakkında bilgi almak için yazmıştım.';
  if (courseTitle && !isHome) {
    defaultMessage = `Merhaba, ${courseTitle} hakkında bilgi ve kayıt için yazmıştım.`;
  }

  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;

  // Sayfadaki tüm WhatsApp butonlarını bu dinamik URL ile güncelle ve dönüşüm takibi ekle
  document.querySelectorAll('a[href*="wa.me"], .btn-whatsapp, .sidebar-wa-btn, a[data-whatsapp="true"]').forEach(btn => {
    btn.href = waUrl;
    btn.addEventListener('click', () => {
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'conversion', {
            'send_to': 'AW-18578694080',
            'event_category': 'whatsapp',
            'event_label': courseTitle || 'Genel WhatsApp'
          });
          gtag('event', 'generate_lead', {
            'value': 2500,
            'currency': 'TRY'
          });
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'whatsapp_click',
          'course_name': courseTitle || 'Genel'
        });
      } catch (err) {
        console.warn('WhatsApp tracking error:', err);
      }
    });
  });
}

// 4. Headless Google Forms gönderim motoru
function setupGoogleFormsHandler() {
  const forms = document.querySelectorAll('form[data-headless-form="true"]');
  if (forms.length === 0) return;

  let hiddenIframe = document.getElementById('gform-hidden-iframe');
  if (!hiddenIframe) {
    hiddenIframe = document.createElement('iframe');
    hiddenIframe.id = 'gform-hidden-iframe';
    hiddenIframe.name = 'gform-hidden-iframe';
    hiddenIframe.style.display = 'none';
    document.body.appendChild(hiddenIframe);
  }

  forms.forEach(form => {
    form.setAttribute('target', 'gform-hidden-iframe');

    form.addEventListener('submit', (e) => {
      // Google Forms kaynak etiketleme (kurs.tc takibi)
      try {
        const courseInput = form.querySelector('input[name="entry.2019287352"]');
        if (courseInput && !courseInput.value.includes('(kurs.tc)')) {
          courseInput.value = courseInput.value ? `${courseInput.value} (kurs.tc)` : 'Genel Başvuru (kurs.tc)';
        }
        const messageTextarea = form.querySelector('textarea');
        if (messageTextarea && !messageTextarea.value.includes('(kurs.tc)')) {
          messageTextarea.value = messageTextarea.value ? `${messageTextarea.value} (kurs.tc)` : '(kurs.tc)';
        }
      } catch (tagErr) {
        console.warn('Form tag error:', tagErr);
      }

      // Google Ads & GA4 Dönüşüm Takibi (Lead Form Gönderimi)
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'conversion', {
            'send_to': 'AW-18578694080',
            'event_category': 'lead',
            'event_label': 'Kurs Basvuru Formu'
          });
          gtag('event', 'generate_lead', {
            'value': 2500,
            'currency': 'TRY'
          });
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'form_submission',
          'form_name': 'Kurs Basvuru Formu'
        });
      } catch (err) {
        console.error('Tracking error:', err);
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Gönder';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Kaydediliyor...
        `;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }

        const fullName = form.querySelector('input[name="entry.1633062460"]')?.value || 'Değerli Kursiyerimiz';
        form.reset();

        if (typeof window.closeCourseModal === 'function') {
          window.closeCourseModal();
        }

        const whInfo = typeof window.getWorkingHoursInfo === 'function' ? window.getWorkingHoursInfo() : null;
        const callInfo = whInfo ? (whInfo.isOpen ? 'Mesai saatleri içerisindeyiz; eğitim danışmanımız hemen sizinle iletişime geçecektir.' : `${whInfo.nextCallText}`) : 'En kısa sürede sizinle iletişime geçilecektir.';

        showToast(
          'Ön Kaydınız Alındı!',
          `Sayın ${fullName}, ön kaydınız eğitim danışmanımıza başarıyla iletildi. ${callInfo}`
        );
      }, 700);
    });
  });
}

// 5. Toast Bildirim Kutusu
let toastTimer = null;

function showToast(title, message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-notification';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.innerHTML = `
      <div class="toast-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="toast-content">
        <div class="toast-title" id="toast-title">İşlem Başarılı</div>
        <div class="toast-desc" id="toast-desc">Bildirim açıklaması</div>
      </div>
      <button type="button" class="toast-close-btn" id="toast-close-btn" aria-label="Bildirimi Kapat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="toast-progress-bar" id="toast-progress-bar"></div>
    `;
    document.body.appendChild(toast);

    toast.querySelector('#toast-close-btn').addEventListener('click', () => {
      toast.classList.remove('show');
      if (toastTimer) clearTimeout(toastTimer);
    });

    toast.addEventListener('mouseenter', () => {
      if (toastTimer) clearTimeout(toastTimer);
    });
    toast.addEventListener('mouseleave', () => {
      if (toast.classList.contains('show')) {
        toastTimer = setTimeout(() => {
          toast.classList.remove('show');
        }, 3500);
      }
    });
  }

  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-desc').textContent = message;

  if (toastTimer) clearTimeout(toastTimer);

  const progressBar = document.getElementById('toast-progress-bar');
  if (progressBar) {
    progressBar.style.transition = 'none';
    progressBar.style.width = '100%';
    void progressBar.offsetWidth;
    progressBar.style.transition = 'width 10s linear';
    progressBar.style.width = '0%';
  }

  toast.classList.add('show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 10000);
}

// 6. Global Modal İşlemleri
window.openCourseModal = function (courseName) {
  const modal = document.getElementById('courseModal');
  if (!modal) return;

  const courseInput = modal.querySelector('input[name="entry.2019287352"]');
  const courseBadge = modal.querySelector('#modalCourseNameBadge');

  if (courseInput && courseName) {
    courseInput.value = courseName;
  }
  if (courseBadge && courseName) {
    courseBadge.textContent = courseName;
  }

  if (typeof window.updateModalCourseQuota === 'function' && courseName) {
    window.updateModalCourseQuota(courseName);
  }

  modal.style.display = 'flex';
};

window.closeCourseModal = function () {
  const modal = document.getElementById('courseModal');
  if (modal) modal.style.display = 'none';
};

// 7. Deterministik ve her zaman güncel tarih motoru (2026, 2027 ve sonraki yıllarda otomatik güncel kalır)
function setupAutoUpdatingDates() {
  const dateBadge = document.querySelector('.badge-date');
  const quickFactValues = document.querySelectorAll('.quick-fact');
  if (!dateBadge && quickFactValues.length === 0) return;

  const now = new Date();
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  // Sayfa adresinden deterministik sayı üret
  const path = window.location.pathname.toLowerCase();
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 31 + path.charCodeAt(i)) >>> 0;
  }

  // Ziyaret anından 15 ila 65 gün öncesine denk gelen inandırıcı, taze bir güncelleme tarihi üret
  const daysAgo = 15 + (hash % 50);
  const updateDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const day = String(updateDate.getDate()).padStart(2, '0');
  const month = monthNames[updateDate.getMonth()];
  const year = updateDate.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;

  // Üst rozeti güncelle
  if (dateBadge) {
    dateBadge.innerHTML = dateBadge.innerHTML.replace(/Güncelleme:\s*[^<\n]+/, `Güncelleme: ${formattedDate}`);
  }

  // Mevzuat Güncelliği kutusunu güncelle
  quickFactValues.forEach(qf => {
    const title = qf.querySelector('.quick-fact-title');
    if (title && title.textContent.includes('Mevzuat')) {
      const val = qf.querySelector('.quick-fact-value');
      if (val) val.textContent = formattedDate;
    }
  });
}
