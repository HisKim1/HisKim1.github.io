document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  let isAnimating = false; // 애니메이션 중복 방지

  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isAnimating) return; // 애니메이션 도중 클릭 무시

      // 모든 링크의 active 제거
      navLinks.forEach(a => a.classList.remove('active'));
      // 현재 링크 active 추가
      link.classList.add('active');

      const pageUrl = link.getAttribute('data-page');
      // Home 처리
      if (pageUrl === 'index.html') {
        // 애니메이션 아웃
        await animateOut(mainContent);
        // Home 섹션 다시 삽입
        mainContent.innerHTML = `
          <section class="home-wrapper">
            <div class="home-content">
              <div class="home-left">
                <img src="profile.jpg" alt="Hisu Kim" class="profile-pic">
              </div>
              <div class="home-right">
                <h1 class="big-name">Hisu Kim</h1>
                <h2>Forecasting the Future of Forecasting</h2>
                <p>
                  I'm a multidisciplinary Environmental Engineering and CS student
                  passionate about AI-driven weather forecasting, creative design,
                  and innovative solutions.
                </p>
              </div>
            </div>
          </section>
        `;
        await animateIn(mainContent);
      } else {
        try {
          isAnimating = true;
          // 1) 기존 내용 슬라이드 아웃
          await animateOut(mainContent);

          // 2) fetch로 새 HTML 가져옴
          const htmlText = await fetch(pageUrl).then(res => res.text());

          // 3) HTML 파싱 → body 안의 내용만 추출
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');
          const bodyContent = doc.querySelector('body').innerHTML;

          // 4) mainContent에 삽입
          mainContent.innerHTML = bodyContent;

          // 5) 새 내용 슬라이드 인
          await animateIn(mainContent);
        } catch (err) {
          console.error(err);
        } finally {
          isAnimating = false;
        }
      }
    });
  });

  // GSAP 애니메이션 함수
  function animateOut(element) {
    isAnimating = true;
    return gsap.to(element, {
      x: -50,
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut"
    });
  }
  function animateIn(element) {
    gsap.set(element, { x: 50, opacity: 0 });
    return gsap.to(element, {
      x: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.inOut"
    });
  }
});
