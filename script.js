document.addEventListener('DOMContentLoaded', () => {
  // 1) 공통 HTML 로드
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

  // 2) Barba.js + GSAP: 페이지 전환 (slide-left)
  if (window.barba) {
    barba.init({
      transitions: [{
        name: 'slide-left',
        leave({ current }) {
          // 현재 페이지 왼쪽으로 밀어내기
          return gsap.to(current.container, {
            x: '-100%',
            opacity: 0,
            duration: 0.4
          });
        },
        enter({ next }) {
          // 새 페이지 오른쪽에서 들어오기
          gsap.set(next.container, { x: '100%', opacity: 0 });
          return gsap.to(next.container, {
            x: '0%',
            opacity: 1,
            duration: 0.4
          });
        }
      }]
    });
  }

  // 3) 네비게이션 활성 메뉴 표시 + 흰색 박스 슬라이드
  // header.html이 로드된 후에 실행해야 하므로 약간 지연
  setTimeout(() => {
    const navLinks = document.querySelectorAll('.nav-links a');
    const indicator = document.getElementById('nav-indicator');

    if (!navLinks || !indicator) return;

    // 현재 body data-barba-namespace를 찾아서 해당 메뉴를 active
    const currentNamespace = document.body.getAttribute('data-barba-namespace');

    // active link 찾기
    let activeLink = null;
    navLinks.forEach(link => {
      const navAttr = link.getAttribute('data-nav');
      if (navAttr === currentNamespace) {
        activeLink = link;
      }
    });

    function moveIndicator(link) {
      if (!link) return;
      const linkRect = link.getBoundingClientRect();
      const navRect = link.parentElement.parentElement.getBoundingClientRect();

      // linkRect.x - navRect.x로 위치 계산
      const offsetLeft = linkRect.left - navRect.left;
      const width = linkRect.width;

      gsap.to(indicator, {
        left: offsetLeft,
        width: width,
        duration: 0.4
      });

      // 모든 링크 색상 초기화
      navLinks.forEach(a => {
        a.style.color = '#fff';
      });
      // 현재 링크 텍스트는 어둡게
      link.style.color = '#333';
    }

    // 초기 indicator 위치
    moveIndicator(activeLink);

    // 다른 메뉴 클릭 시 indicator 이동 (Barba.js가 intercept하므로)
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        moveIndicator(link);
      });
    });
  }, 300);
});
