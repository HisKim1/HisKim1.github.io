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

  // Throttle resize events for better performance
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateMenu();
      setIndicator();
    }, 150);
  }, { passive: true });

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
    console.log('loadPage', page);
    isAnimating = true;
    // await animateOut(mainContent); // 사라지는 애니메이션 제거
    // 1. HTML과 데이터 fetch를 병렬로 시작
    const htmlPromise = fetch(`pages/${page}.html`).then(res => res.text());
    let dataPromise = null;
    let needsData = false;
    if (page === 'projects') { dataPromise = fetch('data/projects.json').then(res => res.json()); needsData = true; }
    else if (page === 'teaching') { dataPromise = fetch('data/teaching.json').then(res => res.json()); needsData = true; }
    else if (page === 'education') { dataPromise = fetch('data/education.json').then(res => res.json()); needsData = true; }
    else if (page === 'research') { dataPromise = fetch('data/research.json').then(res => res.json()); needsData = true; }
    else if (page === 'home') { dataPromise = fetch('data/home.json').then(res => res.json()); needsData = true; }

    // 2. 둘 다 준비될 때까지 기다림
    let html, data;
    if (needsData) {
      [html, data] = await Promise.all([htmlPromise, dataPromise]);
    } else {
      html = await htmlPromise;
    }

    // 3. mainContent에 HTML을 한 번에 넣음
    mainContent.innerHTML = html;

    // 4. 데이터 기반 렌더링 함수 호출 (data를 인자로 넘김) - requestAnimationFrame으로 감싸기
    if (page === 'projects') {
      requestAnimationFrame(() => generateProjectCardsFromTemplate(data));
    } else if (page === 'teaching') {
      requestAnimationFrame(() => generateTeachingCardsFromTemplate(data));
    } else if (page === 'education') {
      requestAnimationFrame(() => generateEducationContentFromTemplate(data));
    } else if (page === 'research') {
      requestAnimationFrame(() => {
        generateResearchPublications(data);
        generateResearchConferences(data);
        generateResearchExperience(data);
      });
    } else if (page === 'home') {
      requestAnimationFrame(() => generateHomeContentFromTemplate(data));
    } else {
      initCardAccordion();
    }
    await animateIn(mainContent);
    mainContent.style.opacity = '1';
    isAnimating = false;
  }

  // 각 렌더링 함수에서 data 인자를 받도록 수정
  async function generateProjectCardsFromTemplate(projectData) {
    const container = document.getElementById('project-cards');
    console.log('[ProjectCards] container:', container, 'data:', projectData);
    if (!container) return;
    // Small JSON + template fetch: avoid loading spinner to keep UX snappy
    container.innerHTML = '';
    const templateRes = await fetch('snippets/cards.html');
    const templateText = await templateRes.text();
    console.log('[ProjectCards] template loaded');
    const cardsHTML = projectData.map(project =>
      templateText
        .replace('{{title}}', project.title)
        .replace('{{description}}', project.description)
        .replace('{{images}}', project.images)
    ).join('');
    container.innerHTML = cardsHTML;
    console.log('[ProjectCards] cards rendered');
    initCardAccordion(); // 카드 접힘 기능 적용
    console.log('[ProjectCards] accordion initialized');
  }

  async function generateTeachingCardsFromTemplate(teachingData) {
    const container = document.getElementById('teaching-cards');
    console.log('[TeachingCards] container:', container, 'data:', teachingData);
    if (!container) return;
    // Small JSON: render directly without spinner
    container.innerHTML = '';
    const templateRes = await fetch('snippets/teachingCards.html');
    const templateText = await templateRes.text();
    console.log('[TeachingCards] template loaded');
    const cardsHTML = teachingData.map(project =>
      templateText
        .replace('{{title}}', project.title)
        .replace('{{description}}', project.description)
    ).join('');
    container.innerHTML = cardsHTML;
    console.log('[TeachingCards] cards rendered');
    initCardAccordion(); // 카드 접힘 기능 적용
    console.log('[TeachingCards] accordion initialized');
  }

  async function generateEducationContentFromTemplate(data) {
    const container = document.getElementById('education-content');
    console.log('[Education] container:', container, 'data:', data);
    if (!container) return;
    // Direct render without intermediate loading state
    container.innerHTML = '';
    let html = '<ul class="education-list">';
    data.main.forEach(item => {
      html += `<li><div class="education-item">
        <div class="edu-top">
          <span class="edu-school">${item.school}</span>
          <span class="edu-period">${item.period}</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">
            ${item.degree ? item.degree + '<br>' : ''}
            ${item.minor ? item.minor + '<br>' : ''}
            ${item.extra ? item.extra + '<br>' : ''}
            ${item.thesis ? '<span style="display: inline-block; margin-top: 4px;">Thesis: <i>' + item.thesis + '</i></span>' : ''}
          </span>
          <span class="edu-tgpa">${item.tgpa || ''}</span>
        </div>
      </div></li>`;
    });
    html += '</ul>';
    html += '<h3>Extracurricular Education</h3><ul class="education-list">';
    data.extracurricular.forEach(item => {
      html += `<li><div class="education-item">
        <div class="edu-top">
          <span class="edu-school">${item.school}</span>
          <span class="edu-period">${item.period}</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">${item.org}</span>
        </div>
      </div></li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
    console.log('[Education] content rendered');
  }

  async function generateResearchPublications(data) {
    const container = document.getElementById('research-content');
    console.log('[Research:Publications] container:', container, 'data:', data);
    if (!container) return;
    container.innerHTML = '';
    let html = '<ul class="publication-list">';
    data.publications.forEach(pub => {
      html += '<li>';
      if (pub.authors) html += pub.authors + ' ';
      if (pub.title) html += pub.title + ' ';
      if (pub.link) html += `<a href="${pub.link}" target="_blank" rel="noopener noreferrer">[Preprint]</a> `;
      if (pub.status) html += `<span class="status"> ${pub.status}</span>`;
      html += '</li>';
    });
    html += '</ul>';
    container.innerHTML = html;
    console.log('[Research:Publications] content rendered');
  }

  async function generateResearchConferences(data) {
    const container = document.getElementById('conference-content');
    console.log('[Research:Conferences] container:', container, 'data:', data);
    if (!container) return;
    container.innerHTML = '';
    let html = '<ul class="conference-list">';
    data.conferences.forEach(conf => {
      html += '<li>';
      if (conf.authors) html += conf.authors + ' ';
      if (conf.title) html += conf.title + ' ';
      if (conf.link) html += `<a href="${conf.link}" target="_blank" rel="noopener noreferrer">[Link]</a> `;
      if (conf.status) html += `<span class="status"> ${conf.status}</span>`;
      html += '</li>';
    });
    html += '</ul>';
    container.innerHTML = html;
    console.log('[Research:Conferences] content rendered');
  }

  async function generateResearchExperience(data) {
    const container = document.getElementById('experience-content');
    console.log('[Research:Experience] container:', container, 'data:', data);
    if (!container) return;
    container.innerHTML = '';
    let html = '<ul class="education-list">';
    data.experience.forEach(exp => {
      html += `<li><div class="education-item">
        <div class="edu-top">
          <span class="edu-school">${exp.lab}</span>
          <span class="edu-period">${exp.period}</span>
        </div>
        <div class="edu-bottom">
          <span class="edu-detail">${exp.position}<br>`;
      exp.details.forEach(d => { html += '• ' + d + '<br>'; });
      html += '</span></div></div></li>';
    });
    html += '</ul>';
    container.innerHTML = html;
    console.log('[Research:Experience] content rendered');
  }

  async function generateHomeContentFromTemplate(data) {
    const container = document.getElementById('home-content');
    console.log('[Home] container:', container, 'data:', data);
    if (!container) return;
    container.innerHTML = '';
    let html = '<div class="home-wrapper"><div class="home-content">';
    html += `<div class="profile-circle"><img src="${data.profile.img}" alt="${data.profile.name}" class="profile-pic"></div>`;
    html += `<h1 class="big-name">${data.profile.name}</h1>`;
    html += `<h2 class="sub-title">${data.profile.subtitle}</h2>`;
    html += `<div class="info-box"><h3 class="info-title">${data.academic.title}</h3>`;
    data.academic.paragraphs.forEach(p => { html += `<p>${p}</p>`; });
    html += '</div>';
    html += `<div class="info-box"><h3 class="info-title">${data.research.title}</h3>`;
    data.research.paragraphs.forEach(p => { html += `<p>${p}</p>`; });
    html += '</div></div></div>';
    container.innerHTML = html;
    console.log('[Home] content rendered');
  }
  

  function initCardAccordion() {
    document.querySelectorAll('.card').forEach(card => {
      card.querySelector('.card-header')?.addEventListener('click', () => {
        card.classList.toggle('active');
      });
    });
  }


  function animateOut(el) {
    return new Promise(resolve => {
      try {
        gsap.to(el, {
          y: -50,
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            el.style.opacity = '1';
            resolve();
          }
        });
      } catch (e) {
        el.style.opacity = '1';
        resolve();
      }
    });
  }

  function animateIn(el) {
    return new Promise(resolve => {
      try {
        gsap.set(el, { y: 50, opacity: 0 });
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.6, // 더 느리게
          onComplete: () => {
            el.style.opacity = '1';
            resolve();
          }
        });
      } catch (e) {
        el.style.opacity = '1';
        resolve();
      }
    });
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


