document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  const hamburger = document.getElementById('hamburger');
  const navbar = document.getElementById('navbar');
  const navUl = navbar.querySelector('ul');
  const navIndicator = document.querySelector('.nav-indicator');

  let isAnimating = false;

  loadPage('home');
  updateMenu();
  setIndicator();

  const firstLink = document.querySelector('.nav-link[data-page="home"]');
  firstLink.classList.add('active');
  moveIndicator(firstLink, false);

  hamburger.addEventListener('click', () => {
    navUl.classList.toggle('show');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (isAnimating) return;

      navUl.classList.remove('show');
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      moveIndicator(link);
      loadPage(link.getAttribute('data-page'));
    });
  });

  window.addEventListener('resize', () => {
    updateMenu();
    setIndicator();
  });

  function updateMenu() {
    if (window.innerWidth > 900) {
    navUl.classList.remove('show');
    navUl.style.maxHeight = null;
    navUl.style.opacity = null;
    }
    }
    
  function setIndicator() {
    const activeLink = document.querySelector('.nav-link.active') || navLinks[0];
    moveIndicator(activeLink, false);
  }

  function moveIndicator(link, animate = true) {
    if(window.innerWidth <= 900) return;
    
    const { offsetWidth, offsetLeft } = link;
    if (animate) {
    gsap.to(navIndicator, {
    width: offsetWidth,
    x: offsetLeft,
    duration: 0.4,
    ease: 'power2.inOut'
    });
    } else {
    gsap.set(navIndicator, { width: offsetWidth, x: offsetLeft });
    }
  }

  async function loadPage(page) {
    isAnimating = true;
    await animateOut(mainContent);
    const res = await fetch(`pages/${page}.html`);
    mainContent.innerHTML = await res.text();
    await animateIn(mainContent);
    initCardAccordion();
    isAnimating = false;
  }

  function initCardAccordion() {
    document.querySelectorAll('.card').forEach(card => {
      card.querySelector('.card-header')?.addEventListener('click', () => {
        card.classList.toggle('active');
      });
    });
  }
  

  function animateOut(el) {
    return gsap.to(el, { y: -50, opacity: 0, duration: 0.3 });
  }

  function animateIn(el) {
    gsap.set(el, { y: 50, opacity: 0 });
    return gsap.to(el, { y: 0, opacity: 1, duration: 0.3 });
  }

  window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) moveIndicator(activeLink);
  });

  document.querySelector('.site-title').addEventListener('click', e => {
    e.preventDefault();
    // 모든 nav-link에서 active 클래스 제거 후 Home 링크 활성화
    navLinks.forEach(l => l.classList.remove('active'));
    const homeLink = document.querySelector('.nav-link[data-page="home"]');
    homeLink.classList.add('active');
    moveIndicator(homeLink);
    loadPage('home');
  });
});


