async function fetchJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function initNavigation() {
  const toggle = document.querySelector('.toggle');
  const nav = document.querySelector('nav');
  if (toggle) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
}

function initSpotlight() {
  if (window.matchMedia('(max-width: 600px)').matches) return;
  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
  });
}

function createTagHTML(tag) {
  return `<span class="tag">${tag}</span>`;
}

function applyCardHoverEffects() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      cards.forEach(c => {
        if (c !== card) c.classList.add('faded');
        else c.classList.add('active');
      });
    });
    card.addEventListener('mouseleave', () => {
      cards.forEach(c => c.classList.remove('faded', 'active'));
    });
  });
}

function generateHome(data) {
  const container = document.getElementById('home-section');
  if (!container) return;
  container.innerHTML = `
    <div class="hero">
      <img src="${data.profile.img}" alt="${data.profile.name}" class="profile-img">
      <h1>Hello, my name is</h1>
      <h2>${data.profile.name}</h2>
      <p>${data.academic.paragraphs[0]}</p>
      <!-- 
      <div class="social">
        <a href="mailto:hisu.kim.hisu@gmail.com" aria-label="Email"><i class="fas fa-envelope"></i></a>
        <a href="https://github.com/HisKim1" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i></a>
      </div>
      -->
    </div>
  `;
}

function generateEducation(data) {
  const list = document.getElementById('education-list');
  if (!list) return;
  let html = '';
  data.main.forEach(item => {
    html += `<div class="card">
      <p class="date">${item.period}</p>
      <h3>${item.school}</h3>
      <div class="degree-tgpa-row">
        <span class="degree">${item.degree || ''}</span>
        ${item.tgpa ? `<span class="tgpa">TGPA: ${item.tgpa}</span>` : ''}
      </div>
      <p>${item.double_degree ? item.double_degree : ''}</p>
      <p>${item.minor ? item.minor : ''}</p>
      ${item.thesis ? `<p>Thesis:</p> <p><i>${item.thesis}</i></p>` : ''}
      <p>${item.advisor ? item.advisor : ''}</p>
    </div>`;
  });

  if (data.extracurricular) {
    html += `<h3>Extracurricular</h3>` + data.extracurricular.map(e => `
      <div class="card">
        <p class="date">${e.period}</p>
        <h3>${e.school}</h3>
        <p>${e.org}</p>
      </div>
    `).join('');
  }
  list.innerHTML = html;
  applyCardHoverEffects();
}

function generateProjects(data) {
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  grid.innerHTML = data.map(p => `
    <div class="project-item card">
      <img class="project-img" src="${p.images}" alt="${p.title}">
      <div class="project-text">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
      </div>
    </div>
  `).join('');
  applyCardHoverEffects();
}

function generateTeaching(data) {
  const grid = document.getElementById('teaching-list');
  if (!grid) return;
  grid.innerHTML = data.map(t => `
    <div class="card"><h3>${t.title}</h3><p>${t.description}</p></div>
  `).join('');
  applyCardHoverEffects();
}

function generateResearch(data) {
  const pub = document.getElementById('pub-list');
  const exp = document.getElementById('exp-list');
  if (pub) {
    pub.innerHTML = '<ul>' + data.publications.map(p => `<li>${p.authors || ''} ${p.title || ''}</li>`).join('') + '</ul>';
  }
  if (exp) {
    exp.innerHTML = data.experience.map(e => `
      <div class="card">
        <p class="date">${e.period}</p>
        <h3>${e.lab}</h3>
        <p>${e.position}</p>
        ${e.details ? '<ul>' + e.details.map(d => `<li>${d}</li>`).join('') + '</ul>' : ''}
      </div>
    `).join('');
  }
  applyCardHoverEffects();
}



async function init() {
  initNavigation();
  initSpotlight();
  generateHome(await fetchJSON('data/home.json'));
  generateEducation(await fetchJSON('data/education.json'));
  generateProjects(await fetchJSON('data/projects.json'));
  generateTeaching(await fetchJSON('data/teaching.json'));
  generateResearch(await fetchJSON('data/research.json'));
  applyCardHoverEffects();
}

document.addEventListener('DOMContentLoaded', init);
