document.addEventListener('DOMContentLoaded', () => {
  // 공통 HTML(header, footer) 로드 함수
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
  loadHTML('header-include', 'header.html');
  loadHTML('footer-include', 'footer.html');

  // 헤더 로드 후 햄버거 메뉴 기능
  setTimeout(() => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sideNav = document.getElementById('side-nav');
    if (hamburgerMenu && sideNav) {
      hamburgerMenu.addEventListener('click', () => {
        sideNav.classList.toggle('active');
      });
    }
  }, 100);

  // Barba.js 페이지 전환 설정
  if (window.barba) {
    barba.init({
      transitions: [{
        name: 'fade',
        leave({ current }) {
          // 떠날 때 애니메이션
          return gsap.to(current.container, {
            opacity: 0,
            duration: 0.4
          });
        },
        enter({ next }) {
          // 들어올 때 애니메이션
          return gsap.from(next.container, {
            opacity: 0,
            duration: 0.4
          });
        }
      }]
    });
  }
});
