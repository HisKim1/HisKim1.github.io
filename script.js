document.addEventListener('DOMContentLoaded', () => {
  // 1. 공통 HTML 로드 함수
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

  // 헤더와 푸터 로드
  loadHTML('header-include', 'header.html');
  loadHTML('footer-include', 'footer.html');

  // 2. 페이지 전환 페이드 효과
  // 페이지 로드시 fade-in 효과 적용
  document.body.classList.remove('fade-out');

  // 모든 nav-link에 대해 페이드 아웃 후 페이지 이동
  setTimeout(() => {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // 기본 동작 취소
        e.preventDefault();
        const targetUrl = link.getAttribute('href');
        // 사이드 네비가 열려있다면 닫기
        const sideNav = document.getElementById('side-nav');
        if (sideNav) sideNav.classList.remove('active');
        // 페이드 아웃 효과 적용 후 이동
        document.body.classList.add('fade-out');
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 500); // CSS transition 시간과 동일
      });
    });
  }, 100);

  // 3. 햄버거 메뉴 토글 (헤더 로드 후 연결)
  setTimeout(() => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sideNav = document.getElementById('side-nav');
    if (hamburgerMenu && sideNav) {
      hamburgerMenu.addEventListener('click', () => {
        sideNav.classList.toggle('active');
      });
    }
  }, 100);

  // 4. Collapsible 카드 (Experience, Projects, Teaching)
  // 모든 .card.collapsible 요소에 대해 클릭 시 세부내용 토글
  document.querySelectorAll('.card.collapsible').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
      const details = card.querySelector('.card-details');
      if (card.classList.contains('active')) {
        // 내용의 scrollHeight를 이용해 max-height 설정
        details.style.maxHeight = details.scrollHeight + "px";
      } else {
        details.style.maxHeight = 0;
      }
    });
  });
});
