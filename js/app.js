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
    navUl.classList.toggle('open');
    hamburger.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (isAnimating) return;

      navUl.classList.remove('show');
      navUl.classList.remove('open');
      hamburger.classList.remove('active');
      
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
    mainContent.innerHTML = (window.contentData.pages[page] || "");
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
  const projectData = window.contentData.projects;

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

  const teachingData = window.contentData.teaching;
  

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
