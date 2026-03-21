/* ============================================================
   DAYSTAR CANNABIS EDUCATION & CONSULTING
   Global Script — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ── Announcement Bar ────────────────────────────────────── */
  var announceBar   = document.getElementById('announce-bar');
  var announceClose = document.getElementById('announce-close');

  if (announceBar) {
    if (sessionStorage.getItem('ds-announce-dismissed')) {
      announceBar.style.display = 'none';
    }
    if (announceClose) {
      announceClose.addEventListener('click', function () {
        announceBar.style.display = 'none';
        sessionStorage.setItem('ds-announce-dismissed', '1');
      });
    }
  }

  /* ── Active Nav Link ─────────────────────────────────────── */
  (function setActiveNav() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (
        ((page === '' || page === 'index.html') && (href === 'index.html' || href === './' || href === '/')) ||
        href === page
      ) {
        link.classList.add('active');
      }
    });
  })();

  /* ── Mobile Navigation ───────────────────────────────────── */
  var hamburger   = document.getElementById('nav-hamburger');
  var mobileNav   = document.getElementById('nav-mobile');
  var mobileClose = document.getElementById('nav-mobile-close');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  if (mobileClose && mobileNav) {
    mobileClose.addEventListener('click', function () {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── FAQ Accordion ───────────────────────────────────────── */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = btn.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-q').forEach(function (q) {
        q.classList.remove('open');
        var a = q.nextElementSibling;
        if (a) a.classList.remove('open');
      });
      // Open clicked
      if (!isOpen) {
        btn.classList.add('open');
        var ans = btn.nextElementSibling;
        if (ans) ans.classList.add('open');
      }
    });
  });

  /* ── Smooth Scroll ───────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Contact Form ────────────────────────────────────────── */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn      = document.getElementById('contact-submit-btn');
      var errorMsg = document.getElementById('contact-error-msg');

      btn.textContent = 'Sending…';
      btn.disabled    = true;
      if (errorMsg) errorMsg.style.display = 'none';

      fetch(contactForm.action, {
        method:  'POST',
        body:    new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      })
      .then(function (resp) {
        if (resp.ok) {
          btn.textContent   = 'Message Sent ✓';
          btn.style.background   = '#2D5A27';
          btn.style.color        = '#fff';
          btn.style.borderColor  = '#2D5A27';
          contactForm.reset();
        } else {
          throw new Error('failed');
        }
      })
      .catch(function () {
        btn.disabled    = false;
        btn.textContent = 'Send Message';
        if (errorMsg) errorMsg.style.display = 'block';
      });
    });
  }

  /* ── Scroll-reveal (lightweight) ────────────────────────── */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(
      '.feature-card, .score-card, .blog-card, .testimonial-card, .stat-item'
    ).forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      revealObserver.observe(el);
    });
  }

})();
