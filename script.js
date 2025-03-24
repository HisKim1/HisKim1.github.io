document.addEventListener('DOMContentLoaded', () => {
  // 공통 HTML 로드 함수
  async function loadHTML(id, url) {
    const container = document.getElementById(id);
    if (container) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          container.innerHTML = await response.text();
        } else {
          console.error('Error loading ' + url + ': ' + response.status);
        }
      } catch (error) {
        console.error('Error fetching ' + url + ': ', error);
      }
    }
  }

  // 헤더, 푸터 로드
  loadHTML('header-include', 'header.html');
  loadHTML('footer-include', 'footer.html');

  // 헤더 로드 후 햄버거 메뉴 기능 연결 (약간의 딜레이 후 실행)
  setTimeout(() => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sideNav = document.getElementById('side-nav');
    if (hamburgerMenu && sideNav) {
      hamburgerMenu.addEventListener('click', () => {
        sideNav.classList.toggle('active');
      });
    }
  }, 100);
});
