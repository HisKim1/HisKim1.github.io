document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  const hamburger = document.getElementById('hamburger');
  const navbar = document.getElementById('navbar');
  const navIndicator = document.querySelector('.nav-indicator');
  let isAnimating = false;

  // 1) 페이지 최초 로딩 시 home.html 불러오기
  loadPage('home');

  // 2) 햄버거 메뉴 클릭 -> 모바일 메뉴 토글
  hamburger.addEventListener('click', () => {
    const navUl = navbar.querySelector('ul');
    navUl.classList.toggle('show');
  });

  // 3) 네비게이션 링크 클릭 -> 해당 페이지 로드
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
      const data = await response.text();
      mainContent.innerHTML = data;

      await animateIn(mainContent);
      isAnimating = false;

      initCardAccordion();
    } catch (error) {
      console.error('Error loading page:', error);
      isAnimating = false;
    }
  }

  // 아코디언 초기화 함수
  function initCardAccordion() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const header = card.querySelector('.card-header');
      if (!header) return;
      header.addEventListener('click', () => {
        card.classList.toggle('active');
      });
    });
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
