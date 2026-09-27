// Arayüz etkileşimleri ve filtreleme kontrolü

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCourseFiltering();
  initFaqAccordion();
  initModalInteractions();
});

/* Mobil Menü Kontrolü */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });

    // Menü dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('open');
      }
    });
  }
}

/* Canlı Arama, Kategori Filtreleme ve Kademeli Yükleme (12'şer Kart) */
function initCourseFiltering() {
  const searchInput = document.getElementById('courseSearchInput');
  const categoryBtns = document.querySelectorAll('.category-btn');
  const courseCards = document.querySelectorAll('.course-card');
  const noResultsMsg = document.getElementById('noResultsMessage');
  const loadMoreWrapper = document.getElementById('loadMoreWrapper');
  const loadMoreBtn = document.getElementById('loadMoreCoursesBtn');
  const loadMoreBadge = document.getElementById('loadMoreBadge');

  if (!courseCards.length) return;

  const PAGE_SIZE = 12;
  let visibleLimit = PAGE_SIZE;
  let activeCategory = 'all';
  let searchTerm = '';

  function filterCards() {
    let matchedCount = 0;
    let renderedCount = 0;
    const isSearching = searchTerm.length > 0;

    courseCards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const title = card.querySelector('.course-title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.course-desc')?.textContent.toLowerCase() || '';
      
      const matchesCategory = (activeCategory === 'all' || category === activeCategory);
      const matchesSearch = !isSearching || (title.includes(searchTerm) || desc.includes(searchTerm));

      if (matchesCategory && matchesSearch) {
        matchedCount++;
        // Aktif aramada tüm eşleşenleri göster; normal gezinmede 12'şer kademeli göster
        if (isSearching || matchedCount <= visibleLimit) {
          if (card.style.display !== 'flex') {
            card.style.display = 'flex';
            card.classList.remove('card-revealed');
            void card.offsetWidth; // Reflow tetikle
            card.classList.add('card-revealed');
          }
          renderedCount++;
        } else {
          card.style.display = 'none';
        }
      } else {
        card.style.display = 'none';
      }
    });

    // Sonuç bulunamadı uyarısı
    if (noResultsMsg) {
      noResultsMsg.style.display = matchedCount === 0 ? 'block' : 'none';
    }

    // Daha Fazla Göster Butonu Kontrolü
    if (loadMoreWrapper && loadMoreBtn) {
      if (!isSearching && matchedCount > visibleLimit) {
        loadMoreWrapper.style.display = 'block';
        if (loadMoreBadge) {
          loadMoreBadge.textContent = `${renderedCount} / ${matchedCount}`;
        }
      } else {
        loadMoreWrapper.style.display = 'none';
      }
    }
  }

  // Daha Fazla Göster Buton Tıklaması (+12 Kart)
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleLimit += PAGE_SIZE;
      filterCards();
    });
  }

  // Arama girdisi
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      visibleLimit = PAGE_SIZE;
      filterCards();
    });
  }

  // Kategori butonları
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-filter') || 'all';
      visibleLimit = PAGE_SIZE; // Kategori değiştiğinde ilk 12'ye dön
      filterCards();
    });
  });

  // Sayfa açıldığında ilk 12 kartı göster
  filterCards();
}

/* Akordeon FAQ */
function initFaqAccordion() {
  const faqTriggers = document.querySelectorAll('.faq-trigger');

  faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parentItem = trigger.closest('.faq-item');
      const isAlreadyActive = parentItem.classList.contains('active');

      // İsteğe bağlı: Diğerlerini kapat
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      if (!isAlreadyActive) {
        parentItem.classList.add('active');
      }
    });
  });
}

/* Modal Kapatma Etkileşimleri */
function initModalInteractions() {
  const modal = document.getElementById('courseModal');
  if (!modal) return;

  // Dışına tıklayınca kapat
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // ESC tuşuna basınca kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });
}
