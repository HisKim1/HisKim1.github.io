document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  const hamburger = document.getElementById('hamburger');
  const navbar = document.getElementById('navbar');
  const navIndicator = document.querySelector('.nav-indicator');
  let isAnimating = false;

  loadPage('home'); // 처음 로딩 시 home.html

  hamburger.addEventListener('click', () => {
    navbar.querySelector('ul').classList.toggle('show');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (isAnimating) return;

      navbar.querySelector('ul').classList.remove('show');
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      moveIndicator(link);
      loadPage(link.getAttribute('data-page'));
    });
  });

  function moveIndicator(link) {
    const { offsetWidth, offsetLeft } = link;
    gsap.to(navIndicator, {
      width: offsetWidth,
      x: offsetLeft,
      duration: 0.4,
      ease: 'power2.inOut'
    });
  }

  async function loadPage(page) {
    try {
      isAnimating = true;
      await animateOut(mainContent);
      const response = await fetch(`pages/${page}.html`);
      mainContent.innerHTML = await response.text();
      await animateIn(mainContent);
      isAnimating = false;
    } catch (e) {
      console.error(e);
      isAnimating = false;
    }
  }

  function animateOut(element) {
    return gsap.to(element, { y: -50, opacity: 0, duration: 0.3 });
  }

  function animateIn(element) {
    gsap.set(element, { y: 50, opacity: 0 });
    return gsap.to(element, { y: 0, opacity: 1, duration: 0.3 });
  }

  // 초기 인디케이터 설정
  window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) moveIndicator(activeLink);
  });

  window.addEventListener('resize', () => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) moveIndicator(activeLink);
  });
});
