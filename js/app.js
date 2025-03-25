document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  const hamburger = document.getElementById('hamburger');
  const navbar = document.getElementById('navbar');
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
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isAnimating) return;

      // 모바일일 경우 메뉴 닫기
      const navUl = navbar.querySelector('ul');
      navUl.classList.remove('show');

      // active 갱신
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const page = link.getAttribute('data-page');
      loadPage(page);
    });
  });

  // 공통 함수: 페이지 로드 + 애니메이션
  async function loadPage(page) {
    try {
      isAnimating = true;
      await animateOut(mainContent);

      const response = await fetch(`pages/${page}.html`);
      const data = await response.text();
      mainContent.innerHTML = data;

      await animateIn(mainContent);
      isAnimating = false;

      // 페이지 내용이 로드된 뒤 카드 아코디언 초기화
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

  // GSAP 상하 슬라이드 애니메이션
  function animateOut(element) {
    return gsap.to(element, {
      y: -50,
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut"
    });
  }
  function animateIn(element) {
    gsap.set(element, { y: 50, opacity: 0 });
    return gsap.to(element, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.inOut"
    });
  }
});
