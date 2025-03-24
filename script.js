document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const sideNav = document.getElementById('side-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  // 햄버거 클릭 시 사이드 메뉴 열고 닫기
  hamburgerMenu.addEventListener('click', () => {
    sideNav.classList.toggle('active');
  });

  // 사이드 메뉴 링크 클릭 시, 메뉴 닫고 해당 섹션으로 부드럽게 스크롤
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);

      // 사이드 메뉴 닫기
      sideNav.classList.remove('active');

      // 부드러운 스크롤
      if (targetEl) {
        window.scrollTo({
          top: targetEl.offsetTop - 50, // navbar 높이 감안
          behavior: 'smooth'
        });
      }
    });
  });
});
