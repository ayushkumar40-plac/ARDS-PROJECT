/* ==========================================================================
   ARDS Responsive Website — Main JavaScript
   Interactive behaviors: navigation, animations, forms, utilities
   ========================================================================== */

(function () {
  'use strict';

  /* ============================================================
     1. HEADER — scroll state
     ============================================================ */
  const header = document.getElementById('siteHeader');

  function handleHeaderScroll() {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  /* ============================================================
     2. MOBILE MENU — hamburger toggle
     ============================================================ */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const body = document.body;

  function closeMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
    body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    const isOpen = mobileMenu.classList.contains('open');
    hamburger.classList.toggle('active', !isOpen);
    mobileMenu.classList.toggle('open', !isOpen);
    body.style.overflow = isOpen ? '' : 'hidden';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileMenu();
  });

  /* ============================================================
     3. SCROLL REVEAL — animate elements entering viewport
     ============================================================ */
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ============================================================
     4. BACK TO TOP button
     ============================================================ */
  const backToTop = document.getElementById('backToTop');

  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     5. COUNTERS — animated number counting
     ============================================================ */
  const counters = document.querySelectorAll('[data-count]');

  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1600;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  if ('IntersectionObserver' in window && counters.length > 0) {
    const counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  }
  /* ============================================================
     6. CONTACT FORM — validation + simulated submission
     ============================================================ */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  function showFormStatus(type, message) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form-status form-status-' + type;
    formStatus.style.display = 'block';
    setTimeout(function () {
      formStatus.style.display = 'none';
    }, 5000);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = contactForm.querySelector('#cf-name');
      const email = contactForm.querySelector('#cf-email');
      const message = contactForm.querySelector('#cf-message');

      if (!name.value.trim()) {
        showFormStatus('error', 'Please enter your name.');
        name.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showFormStatus('error', 'Please enter a valid email address.');
        email.focus();
        return;
      }
      if (message.value.trim().length < 10) {
        showFormStatus('error', 'Message should be at least 10 characters.');
        message.focus();
        return;
      }

      // Simulated send (prototype — no backend)
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Sending...';
      submitBtn.disabled = true;

      setTimeout(function () {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        contactForm.reset();
        showFormStatus('success', 'Thank you! Your message has been sent successfully.');
      }, 1200);
    });
  }

  /* ============================================================
     7. NEWSLETTER — footer quick subscribe (simulated)
     ============================================================ */
  const newsletterForm = document.getElementById('newsletterForm');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        emailInput.value = '';
        alert('Subscribed! You will receive our latest updates.');
      } else {
        alert('Please enter a valid email address.');
      }
    });
  }

  /* ============================================================
     8. ACTIVE NAV LINK — highlight current page
     ============================================================ */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function (link) {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });

  /* ============================================================
     9. BLOG SEARCH — client-side filtering
     ============================================================ */
  const blogSearchInput = document.getElementById('blogSearch');
  const blogCards = document.querySelectorAll('.blog-card[data-title]');

  if (blogSearchInput && blogCards.length > 0) {
    const searchBtn = document.getElementById('blogSearchBtn');
    function performSearch() {
      const query = blogSearchInput.value.trim().toLowerCase();
      blogCards.forEach(function (card) {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const text = card.textContent.toLowerCase();
        const match = query === '' || title.includes(query) || text.includes(query);
        card.style.display = match ? '' : 'none';
      });
    }
    blogSearchInput.addEventListener('input', performSearch);
    if (searchBtn) searchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      performSearch();
    });
  }

  /* ============================================================
     10. BLOG CATEGORY FILTER
     ============================================================ */
  const categoryLinks = document.querySelectorAll('.sidebar-categories a[data-category]');

  categoryLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const category = link.getAttribute('data-category');
      blogCards.forEach(function (card) {
        const cardCat = card.getAttribute('data-category');
        const match = category === 'all' || cardCat === category;
        card.style.display = match ? '' : 'none';
      });
    });
  });

})();

