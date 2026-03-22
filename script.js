/* ============================================================
   DAYSTAR CANNABIS EDUCATION & CONSULTING
   Global Script — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ── Google Sheets Webhook URL ─────────────────────────────── */
  var WEBHOOK_URL = 'REPLACE_WITH_APPS_SCRIPT_URL';
  var WEBHOOK_CONFIGURED = WEBHOOK_URL.indexOf('REPLACE') === -1;

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


  /* ══════════════════════════════════════════════════════════
     EMAIL COLLECTION — Google Sheets via Apps Script
  ══════════════════════════════════════════════════════════ */

  function submitToWebhook(data) {
    if (!WEBHOOK_CONFIGURED) {
      console.warn('Webhook URL not configured — form submission skipped.');
      return Promise.reject(new Error('Webhook not configured'));
    }
    return fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  /* ── Contact Form ────────────────────────────────────────── */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn      = document.getElementById('contact-submit-btn');
      var errorMsg = document.getElementById('contact-error-msg');

      btn.textContent = 'Sending\u2026';
      btn.disabled    = true;
      if (errorMsg) errorMsg.style.display = 'none';

      var formData = {
        name:      contactForm.querySelector('[name="name"]').value,
        email:     contactForm.querySelector('[name="email"]').value,
        message:   contactForm.querySelector('[name="message"]').value,
        source:    'contact-form',
        timestamp: new Date().toISOString()
      };

      submitToWebhook(formData)
      .then(function () {
        btn.textContent   = 'Message Sent \u2713';
        btn.style.background   = '#2D5A27';
        btn.style.color        = '#fff';
        btn.style.borderColor  = '#2D5A27';
        contactForm.reset();
      })
      .catch(function () {
        btn.disabled    = false;
        btn.textContent = 'Send Message';
        if (errorMsg) {
          errorMsg.innerHTML = '\u274C Something went wrong. Email us at <a href="mailto:daystargreenery@yahoo.com" style="color:var(--color-gold);">daystargreenery@yahoo.com</a>';
          errorMsg.style.display = 'block';
        }
      });
    });
  }

  /* ── Email Signup Form (index.html) ─────────────────────── */
  var signupForm = document.getElementById('email-signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgEl = document.getElementById('email-signup-msg');
      var btn   = signupForm.querySelector('button[type="submit"]');

      btn.textContent = 'Sending\u2026';
      btn.disabled = true;

      var formData = {
        name:      signupForm.querySelector('[name="name"]').value,
        email:     signupForm.querySelector('[name="email"]').value,
        message:   '',
        source:    'homepage-signup',
        timestamp: new Date().toISOString()
      };

      submitToWebhook(formData)
      .then(function () {
        if (msgEl) {
          msgEl.textContent = '\u2705 You\u2019re on the list. Expect expert grow insights in your inbox.';
          msgEl.style.display = 'block';
          msgEl.style.color = '#2D5A27';
        }
        signupForm.reset();
        btn.textContent = 'Subscribed \u2713';
      })
      .catch(function () {
        if (msgEl) {
          msgEl.innerHTML = '\u274C Something went wrong. Email us at <a href="mailto:daystargreenery@yahoo.com" style="color:#D4AF37;">daystargreenery@yahoo.com</a>';
          msgEl.style.display = 'block';
          msgEl.style.color = '#e07070';
        }
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      });
    });
  }


  /* ── Pilot Grower Signup Form (index.html) ─────────────── */
  var pilotForm = document.getElementById('pilot-signup-form');
  if (pilotForm) {
    pilotForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgEl = document.getElementById('pilot-signup-msg');
      var btn   = pilotForm.querySelector('button[type="submit"]');

      btn.textContent = 'Sending\u2026';
      btn.disabled = true;

      var formData = {
        email:     pilotForm.querySelector('[name="email"]').value,
        source:    'pilot-grower-signup',
        timestamp: new Date().toISOString()
      };

      submitToWebhook(formData)
      .then(function () {
        if (msgEl) {
          msgEl.textContent = '\u2705 You\u2019re in! We\u2019ll reach out soon with your free Growth Report.';
          msgEl.style.display = 'block';
          msgEl.style.color = '#2D5A27';
        }
        pilotForm.reset();
        btn.textContent = 'Claimed \u2713';
      })
      .catch(function () {
        if (msgEl) {
          msgEl.innerHTML = '\u274C Something went wrong. Email us at <a href="mailto:daystargreenery@yahoo.com" style="color:#D4AF37;">daystargreenery@yahoo.com</a>';
          msgEl.style.display = 'block';
          msgEl.style.color = '#e07070';
        }
        btn.disabled = false;
        btn.textContent = 'Claim My Spot';
      });
    });
  }


  /* ══════════════════════════════════════════════════════════
     SCROLL REVEAL — IntersectionObserver
  ══════════════════════════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    // General section / card reveal
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ds-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll(
      '.feature-card, .score-card, .blog-card, .testimonial-card, .stat-item, ' +
      '.compare-card, .process-step, .section-header, .pricing-card, .author-block, ' +
      '.book-callout, .faq-item, .payhip-block, .trust-badges'
    ).forEach(function (el) {
      el.classList.add('ds-reveal');
      revealObserver.observe(el);
    });

    // Score bar fill animation
    var barObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var fills = entry.target.querySelectorAll('.rbar-fill, .mock-bar-fill');
          fills.forEach(function (fill) {
            var target = fill.style.width;
            fill.style.width = '0';
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                fill.style.width = target;
              });
            });
          });
          barObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.rpage-body, .report-mock-body').forEach(function (el) {
      barObserver.observe(el);
    });
  }


  /* ══════════════════════════════════════════════════════════
     STAT COUNTER — Count up from 0
  ══════════════════════════════════════════════════════════ */
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        counterObserver.unobserve(el);

        var text = el.textContent.trim();
        var suffix = text.replace(/[0-9]/g, '');
        var target = parseInt(text, 10);
        if (isNaN(target)) return;

        var start = 0;
        var duration = 1200;
        var startTime = null;

        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-num').forEach(function (el) {
      counterObserver.observe(el);
    });
  }


  /* ══════════════════════════════════════════════════════════
     NAVBAR — Scroll blur effect
  ══════════════════════════════════════════════════════════ */
  var nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }
    }, { passive: true });
  }


  /* ══════════════════════════════════════════════════════════
     HERO PARTICLES — Canvas (index.html only)
  ══════════════════════════════════════════════════════════ */
  var particleCanvas = document.getElementById('hero-particles');
  if (particleCanvas) {
    var ctx = particleCanvas.getContext('2d');
    var particles = [];
    var particleCount = 35;

    function resizeCanvas() {
      var hero = particleCanvas.parentElement;
      particleCanvas.width = hero.offsetWidth;
      particleCanvas.height = hero.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (var i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.3 + 0.1),
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.1 + 0.3
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) { p.y = particleCanvas.height + 10; p.x = Math.random() * particleCanvas.width; }
        if (p.x < -10) p.x = particleCanvas.width + 10;
        if (p.x > particleCanvas.width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212, 175, 55, ' + p.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }


  /* ══════════════════════════════════════════════════════════
     GOLD CURSOR DOT — Desktop only
  ══════════════════════════════════════════════════════════ */
  if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) {
    var cursor = document.createElement('div');
    cursor.className = 'ds-cursor';
    document.body.appendChild(cursor);

    var cx = 0, cy = 0;
    var tx = 0, ty = 0;

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
    });

    function lerpCursor() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cursor.style.left = cx - 4 + 'px';
      cursor.style.top  = cy - 4 + 'px';
      requestAnimationFrame(lerpCursor);
    }
    lerpCursor();
  }


  /* ── Scroll Entrance Animations ──────────────────────────── */
  (function initScrollAnimations() {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Inject animation CSS
    var style = document.createElement('style');
    style.textContent = [
      '.ds-animate { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }',
      '.ds-animate.ds-visible { opacity: 1; transform: translateY(0); }',
      '.ds-animate-delay-1 { transition-delay: 0.1s; }',
      '.ds-animate-delay-2 { transition-delay: 0.2s; }',
      '.ds-animate-delay-3 { transition-delay: 0.3s; }'
    ].join('\n');
    document.head.appendChild(style);

    // Target elements for animation
    var selectors = [
      '.section-header',
      '.feature-card',
      '.blog-card',
      '.cta-strip',
      '.intake-section',
      '.blog-post-cta',
      '.sidebar-cta',
      '.results-share-panel',
      '.page-header'
    ];

    var elements = document.querySelectorAll(selectors.join(','));
    elements.forEach(function (el, i) {
      el.classList.add('ds-animate');
      var siblings = el.parentElement ? Array.from(el.parentElement.children).filter(function (c) { return c.classList.contains('ds-animate'); }) : [];
      var idx = siblings.indexOf(el);
      if (idx > 0 && idx < 4) el.classList.add('ds-animate-delay-' + idx);
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('ds-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      elements.forEach(function (el) { observer.observe(el); });
    } else {
      elements.forEach(function (el) { el.classList.add('ds-visible'); });
    }
  })();


  /* ── Hero Parallax Effect ──────────────────────────────── */
  (function initHeroParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var hero = document.querySelector('.hero');
    if (!hero) return;

    var heroVisual = hero.querySelector('.hero-visual');
    var heroContent = hero.querySelector('.hero-content');
    if (!heroVisual && !heroContent) return;

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.pageYOffset;
          var heroH = hero.offsetHeight;
          if (scrollY < heroH) {
            var rate = scrollY * 0.3;
            if (heroVisual) heroVisual.style.transform = 'translateY(' + (rate * 0.5) + 'px)';
            if (heroContent) heroContent.style.transform = 'translateY(' + (rate * 0.15) + 'px)';
            hero.style.opacity = String(1 - (scrollY / heroH) * 0.4);
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  })();


  /* ── Loading Progress Bar (for results page) ───────────── */
  (function initLoadingProgress() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var loadingEl = document.getElementById('results-loading');
    if (!loadingEl) return;

    var existing = loadingEl.querySelector('.ds-progress-bar');
    if (existing) return;

    var bar = document.createElement('div');
    bar.className = 'ds-progress-bar';
    bar.style.cssText = 'width:280px;max-width:80%;height:4px;background:rgba(212,175,55,0.15);border-radius:2px;margin:1.5rem auto 0;overflow:hidden;';
    var fill = document.createElement('div');
    fill.style.cssText = 'width:0%;height:100%;background:linear-gradient(90deg,#D4AF37,#E8C850);border-radius:2px;transition:width 0.4s ease-out;';
    bar.appendChild(fill);
    loadingEl.appendChild(bar);

    var progress = 0;
    var interval = setInterval(function () {
      if (progress < 85) {
        progress += Math.random() * 8 + 2;
        if (progress > 85) progress = 85;
        fill.style.width = progress + '%';
      }
    }, 500);

    var reportEl = document.getElementById('results-report');
    if (reportEl) {
      var checkDone = setInterval(function () {
        if (reportEl.classList.contains('visible')) {
          clearInterval(interval);
          clearInterval(checkDone);
          fill.style.width = '100%';
          setTimeout(function () { bar.style.opacity = '0'; }, 400);
        }
      }, 200);
    }
  })();

})();
