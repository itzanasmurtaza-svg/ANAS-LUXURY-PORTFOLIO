(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Enable enhanced reveal only after JS is ready, preventing hidden content on errors.
  document.documentElement.classList.add('motion-ready');

  // Premium intro loader.
  const preloader = $('#preloader');
  const dismissLoader = () => window.setTimeout(() => preloader?.classList.add('done'), 650);
  if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', dismissLoader, { once: true });
  window.setTimeout(dismissLoader, 2600); // failsafe for slow local assets

  // Current year.
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Header and reading progress.
  const header = $('.site-header');
  const progress = $('#scrollProgress');
  let scrollTicking = false;
  const updateScrollUI = () => {
    if (progress) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;
    }
    header?.classList.toggle('scrolled', window.scrollY > 30);
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) { requestAnimationFrame(updateScrollUI); scrollTicking = true; }
  }, { passive: true });
  updateScrollUI();

  // Mobile navigation.
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  const closeMenu = () => {
    menuToggle?.classList.remove('active');
    menuToggle?.setAttribute('aria-expanded', 'false');
    mainNav?.classList.remove('open');
    document.body.classList.remove('menu-open');
  };
  menuToggle?.addEventListener('click', () => {
    const isOpen = mainNav?.classList.toggle('open') ?? false;
    menuToggle.classList.toggle('active', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
  $$('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));

  // Staggered scroll reveals.
  const revealItems = $$('.reveal');
  revealItems.forEach((item, index) => {
    const siblings = item.parentElement ? $$('.reveal', item.parentElement) : [];
    const siblingIndex = Math.max(0, siblings.indexOf(item));
    item.style.setProperty('--reveal-delay', `${Math.min(siblingIndex * 95, 380)}ms`);
  });
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -55px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  // Active navigation link based on visible section.
  const sections = ['home', 'about', 'expertise', 'work', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Rotating role text.
  const roleText = $('#roleText');
  const roles = ['Web Developer', 'Digital Creator', 'Aspiring Software Engineer'];
  let roleIndex = 0;
  if (roleText && !reducedMotion) {
    window.setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleText.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-9px)', filter: 'blur(4px)' }], { duration: 260, fill: 'forwards', easing: 'ease' }).onfinish = () => {
        roleText.textContent = roles[roleIndex];
        roleText.animate([{ opacity: 0, transform: 'translateY(9px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 360, fill: 'forwards', easing: 'cubic-bezier(.2,.75,.2,1)' });
      };
    }, 3200);
  }

  // Custom cursor with smooth trailing ring.
  const dot = $('#cursorDot');
  const ring = $('#cursorRing');
  if (finePointer && !reducedMotion && dot && ring) {
    let mouseX = innerWidth / 2, mouseY = innerHeight / 2, ringX = mouseX, ringY = mouseY;
    window.addEventListener('mousemove', event => {
      mouseX = event.clientX; mouseY = event.clientY;
      dot.style.opacity = '1'; ring.style.opacity = '1';
      dot.style.left = `${mouseX}px`; dot.style.top = `${mouseY}px`;
    }, { passive: true });
    const follow = () => {
      ringX += (mouseX - ringX) * .13; ringY += (mouseY - ringY) * .13;
      ring.style.left = `${ringX}px`; ring.style.top = `${ringY}px`;
      requestAnimationFrame(follow);
    };
    follow();
    $$('a,button,.project-image').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }

  // Magnetic buttons.
  if (finePointer && !reducedMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', event => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * .10}px, ${y * .16}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    // Gentle 3D tilt on hero visual and project previews.
    const tiltTargets = $$('.hero-image-frame, .project-feature .project-image, .project-card .project-image');
    tiltTargets.forEach(el => {
      el.addEventListener('mousemove', event => {
        if (innerWidth < 900) return;
        const r = el.getBoundingClientRect();
        const px = (event.clientX - r.left) / r.width;
        const py = (event.clientY - r.top) / r.height;
        const rotateY = (px - .5) * 5;
        const rotateX = (.5 - py) * 4;
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015,1.015,1.015)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // Smooth anchor navigation for local file and hosted use.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }));
})();
