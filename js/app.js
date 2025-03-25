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

  window.addEventListener('resize', updateMenu);

  function updateMenu() {
    const width = window.innerWidth;
    if (width > 900) {
      navUl.style.display = 'flex';
      hamburger.style.display = 'none';
    } else {
      navUl.style.display = 'none';
      hamburger.style.display = 'flex';
    }
  }

  function moveIndicator(link) {
    if(window.innerWidth > 900){
      gsap.to(navIndicator, {
        width: link.offsetWidth,
        x: link.offsetLeft,
        duration: 0.4,
        ease: 'power2.inOut'
      });
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
});
