document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const mainContent = document.getElementById('main-content');
  const hamburger = document.getElementById('hamburger');
  const navbar = document.getElementById('navbar');
  const navUl = navbar.querySelector('ul');
  const navIndicator = document.querySelector('.nav-indicator');

  let isAnimating = false;

  loadPage('home');
  updateMenu();
  setIndicator();

  const firstLink = document.querySelector('.nav-link[data-page="home"]');
  firstLink.classList.add('active');
  moveIndicator(firstLink, false);

  hamburger.addEventListener('click', () => {
    navUl.classList.toggle('show');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (isAnimating) return;

      navUl.classList.remove('show');
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      moveIndicator(link);
      loadPage(link.getAttribute('data-page'));
    });
  });

  window.addEventListener('resize', () => {
    updateMenu();
    setIndicator();
  });

  function updateMenu() {
    if (window.innerWidth > 900) {
    navUl.classList.remove('show');
    navUl.style.maxHeight = null;
    navUl.style.opacity = null;
    }
    }
    
  function setIndicator() {
    const activeLink = document.querySelector('.nav-link.active') || navLinks[0];
    moveIndicator(activeLink, false);
  }

  function moveIndicator(link, animate = true) {
    if(window.innerWidth <= 900) return;
    
    const { offsetWidth, offsetLeft } = link;
    if (animate) {
    gsap.to(navIndicator, {
    width: offsetWidth,
    x: offsetLeft,
    duration: 0.4,
    ease: 'power2.inOut'
    });
    } else {
    gsap.set(navIndicator, { width: offsetWidth, x: offsetLeft });
    }
  }

  async function loadPage(page) {
    isAnimating = true;
    await animateOut(mainContent);
    const res = await fetch(`pages/${page}.html`);
    mainContent.innerHTML = await res.text();
    await animateIn(mainContent);
  
    if (page === 'projects') {
      await generateProjectCardsFromTemplate();
    } else if (page === 'teaching') {
      await generateTeachingCardsFromTemplate();
    } 
    else {
      initCardAccordion();
    }
  
    isAnimating = false;
  }
  

  function initCardAccordion() {
    document.querySelectorAll('.card').forEach(card => {
      card.querySelector('.card-header')?.addEventListener('click', () => {
        card.classList.toggle('active');
      });
    });
  }


  // projects.html : kwak
  // 알아서 수정해라 희수야
  const projectData = [
    {
      images: "images/bubble.jpg",
      title: "The Pac-Man Project",
      description: "Programmed Pac-Man AI using search algorithms (DFS, BFS, A*) and reinforcement learning for UC Berkeley CS188."
    },
    {

      images: "images/Bratislava.jpg",
      title: "Python Autograder",
      description: "Built a web-based autograder using Flask and socket programming to streamline assignment evaluation."
    },
    {
      images: "images/profile.jpg",
      title: "Environmental Impact Assessment",
      description: "Analyzed climate patterns with ECMWF reanalysis data and applied Leopold matrices to design wastewater treatment systems."
    }
  ];

  // 템플릿을 불러와 카드로 변환
  async function generateProjectCardsFromTemplate() {
    const container = document.getElementById('project-cards');
    if (!container) return;

    const templateRes = await fetch('snippets/cards.html');
    const templateText = await templateRes.text();

    const cardsHTML = projectData.map(project =>
      templateText
        .replace('{{title}}', project.title)
        .replace('{{description}}', project.description)
        .replace('{{images}}', project.images)
    ).join('');

    container.innerHTML = cardsHTML;
    initCardAccordion(); // 카드 접힘 기능 적용
  }

  const teachingData = [
    {
      title: "Mathematics",
      description: `
        <h4>Multivariable Calculus (Spring 2025)</h4>
        <h4>Graph Theory (Fall 2024)</h4>
      `
    },
    {
      title: "Computer Science",
      description: `
        <h4>Digital Design (Spring 2023)</h4>
      `
    },
    {
      title: "Literature",
      description: `
        <h4>Courses with Prof. Soo-Jeong Lee (Professor specializing in Poetry) (Spring 2023 – Present)</h4>
        <p><i>Reading Contemporary Poetry</i>, <i>Korean Poets</i>, <i>Understanding Poetry</i>, <br>
           <i>Ri Sangs Literature and Science</i>, and <i>Writing I: Creative Writing</i></p>
      `
    },
    {
      title: "Mentoring",
      description: `
        <h4>GIST 101 (2023, 2024 Spring)</h4>
      `
    }
  ];
  

  async function generateTeachingCardsFromTemplate() {
    const container = document.getElementById('teaching-cards');
    if (!container) return;

    const templateRes = await fetch('snippets/teachingCards.html');
    const templateText = await templateRes.text();

    const cardsHTML = teachingData.map(project =>
      templateText
        .replace('{{title}}', project.title)
        .replace('{{description}}', project.description)
    ).join('');

    container.innerHTML = cardsHTML;
    initCardAccordion(); // 카드 접힘 기능 적용
  }
 

  function animateOut(el) {
    return gsap.to(el, { y: -50, opacity: 0, duration: 0.3 });
  }

  function animateIn(el) {
    gsap.set(el, { y: 50, opacity: 0 });
    return gsap.to(el, { y: 0, opacity: 1, duration: 0.3 });
  }

  window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) moveIndicator(activeLink);
  });

  document.querySelector('.site-title').addEventListener('click', e => {
    e.preventDefault();
    // 모든 nav-link에서 active 클래스 제거 후 Home 링크 활성화
    navLinks.forEach(l => l.classList.remove('active'));
    const homeLink = document.querySelector('.nav-link[data-page="home"]');
    homeLink.classList.add('active');
    moveIndicator(homeLink);
    loadPage('home');
  });
});


