document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  let isAnimating = false; // 애니메이션 중복 방지

  // 네비게이션 클릭 시 fetch & GSAP 전환
  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isAnimating) return;

      // active 스타일 조정
      navLinks.forEach(a => a.classList.remove('active'));
      link.classList.add('active');

      const pageUrl = link.getAttribute('data-page');
      if (pageUrl === 'index.html') {
        // Home 처리
        await animateOut(mainContent);
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
          await animateOut(mainContent);

          const htmlText = await fetch(pageUrl).then(res => res.text());
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');
          // body 안쪽 내용만 추출
          const bodyContent = doc.querySelector('body').innerHTML;
          mainContent.innerHTML = bodyContent;

          await animateIn(mainContent);

        } catch (err) {
          console.error(err);
        } finally {
          isAnimating = false;
        }
      }

      // 새로 로드된 accordion-card들에 대해 클릭 이벤트 등록
      initAccordion();
    });
  });

  // GSAP 슬라이드 아웃
  function animateOut(element) {
    isAnimating = true;
    return gsap.to(element, {
      x: -50,
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut"
    });
  }

  // GSAP 슬라이드 인
  function animateIn(element) {
    gsap.set(element, { x: 50, opacity: 0 });
    return gsap.to(element, {
      x: 0,
      opacity: 1,
      duration: 0.4,
      ease: "power2.inOut"
    });
  }

  // Accordion 초기화 함수
  function initAccordion() {
    const accordions = document.querySelectorAll('.accordion-card');
    accordions.forEach(card => {
      const header = card.querySelector('.card-header');
      header.addEventListener('click', () => {
        card.classList.toggle('active');
      });
    });
  }

  // 초기 페이지에서도 accordion init (home엔 없음)
  initAccordion();
});
