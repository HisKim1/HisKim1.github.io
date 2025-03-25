document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const mainContent = document.getElementById('main-content');
    let isAnimating = false;
  
    navLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        if (isAnimating) return;
        
        // 네비게이션 active 상태 갱신
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
                    I'm a multidisciplinary Environmental Engineering and CS student, passionate about AI-driven weather forecasting and innovative solutions.
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
  
    // 상하 애니메이션 (출현/퇴장)
    function animateOut(element) {
      return gsap.to(element, {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut"
      });
    }
    function animateIn(element) {
      gsap.set(element, { y: 50, opacity: 0 });
      return gsap.to(element, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut"
      });
    }
  });
  