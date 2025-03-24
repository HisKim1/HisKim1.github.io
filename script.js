document.addEventListener('DOMContentLoaded', () => {
  // 공통 HTML 파일(header.html, footer.html)을 특정 div에 로드하는 함수
  async function loadHTMLInto(id, url) {
    const container = document.getElementById(id);
    if (!container) return;
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
  
  // header와 footer 로드
  loadHTMLInto('header-include', 'header.html');
  loadHTMLInto('footer-include', 'footer.html');

  // 헤더가 로드된 후에 햄버거 메뉴 토글 기능 연결
  setTimeout(() => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');
    if (hamburgerMenu && navLinks) {
      hamburgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
      });
    }
  }, 100);
});
