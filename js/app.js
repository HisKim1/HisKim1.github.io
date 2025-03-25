document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const mainContent = document.getElementById('main-content');
    const hamburger = document.getElementById('hamburger');
    const navbar = document.getElementById('navbar');
    let isAnimating = false;
  
    // (1) 햄버거 메뉴 아이콘 클릭 시 모바일 메뉴 토글
    hamburger.addEventListener('click', () => {
      const navUl = navbar.querySelector('ul');
      navUl.classList.toggle('show');
    });
  
    // (2) 페이지 전환 로직
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
        if (page === 'home') {
          await animateOut(mainContent);
          mainContent.innerHTML = `
            <section class="home-wrapper">
              <div class="home-content">
                <div class="home-left">
                  <img src="images/profile.jpg" alt="Hisu Kim" class="profile-pic">
                </div>
                <div class="home-right">
                  <h1 class="big-name">Hisu Kim</h1>
                  <h2>Forecasting the Future</h2>
                  <p>
                    I'm a multidisciplinary Environmental Engineering and CS student,
                    passionate about AI-driven weather forecasting and innovative solutions.
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
  
            // pages/ 폴더 내의 page.html 불러오기
            const response = await fetch(`pages/${page}.html`);
            const data = await response.text();
            mainContent.innerHTML = data;
  
            await animateIn(mainContent);
          } catch (error) {
            console.error('Error loading page:', error);
          } finally {
            isAnimating = false;
          }
        }
      });
    });
  
    // (3) GSAP 상하 슬라이드 애니메이션
    function animateOut(element) {
      isAnimating = true;
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
  