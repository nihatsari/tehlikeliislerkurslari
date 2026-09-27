// Form işleme ve asenkron veri aktarımı

document.addEventListener('DOMContentLoaded', () => {
  setupGoogleFormsHandler();
});

function setupGoogleFormsHandler() {
  const forms = document.querySelectorAll('form[data-headless-form="true"]');
  
  if (forms.length === 0) return;

  // Gizli iframe oluştur (CORS engeline takılmadan Google Form'a POST etmek için en güvenli yöntem)
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
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Gönder';
      
      // Buton yükleniyor durumuna geçer
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

      // 600ms sonra formu temizle ve kullanıcıya tebrik bildirimini göster
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
        
        const fullName = form.querySelector('input[name="entry.1633062460"]')?.value || 'Değerli Kursiyerimiz';
        form.reset();

        // Eğer modal içerisindeki formsa modalı kapat
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

// Bildirim kutusu kontrolü
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

    // Kullanıcı okurken üzerine gelirse (hover) zamanlayıcıyı duraklat
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

  // Kullanıcı rahatça okuyabilsin diye 10 saniye (10000ms) açık tut
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 10000);
}

// Global modal açıcı (Hızlı başvuru butonları için)
window.openCourseModal = function(courseName) {
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

  // Dinamik kontenjanı seçilen kursa göre güncelle
  if (typeof window.updateModalCourseQuota === 'function' && courseName) {
    window.updateModalCourseQuota(courseName);
  }
  
  modal.style.display = 'flex';
};

window.closeCourseModal = function() {
  const modal = document.getElementById('courseModal');
  if (modal) modal.style.display = 'none';
};
