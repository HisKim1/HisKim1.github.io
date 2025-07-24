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

function createTagHTML(tag) {
  return `<span class="tag">${tag}</span>`;
}

function generateHome(data) {
  const container = document.getElementById('home-section');
  if (!container) return;
  container.innerHTML = `
    <div class="hero">
      <h1>Hello, my name is</h1>
      <h2>${data.profile.name}</h2>
      <p>${data.academic.paragraphs[0]}</p>
      <a class="btn" href="#contact">Get In Touch</a>
    </div>
  `;
}

function generateEducation(data) {
  const list = document.getElementById('education-list');
  if (!list) return;
  let html = '';
  data.main.forEach(item => {
    html += `<div class="card"><h3>${item.school}</h3><p>${item.degree || ''} ${item.minor || ''}</p><p>${item.period}</p></div>`;
  });
  list.innerHTML = html;
}

function generateProjects(data) {
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  grid.innerHTML = data.map(p => `
    <div class="card">
      <img src="${p.images}" alt="${p.title}" style="width:100%;border-radius:4px;">
      <h3>${p.title}</h3>
      <p>${p.description}</p>
    </div>
  `).join('');
}

function generateTeaching(data) {
  const grid = document.getElementById('teaching-list');
  if (!grid) return;
  grid.innerHTML = data.map(t => `
    <div class="card"><h3>${t.title}</h3>${t.description}</div>
  `).join('');
}

function generateResearch(data) {
  const pub = document.getElementById('pub-list');
  const exp = document.getElementById('exp-list');
  if (pub) {
    pub.innerHTML = '<ul>' + data.publications.map(p => `<li>${p.authors || ''} ${p.title || ''}</li>`).join('') + '</ul>';
  }
  if (exp) {
    exp.innerHTML = data.experience.map(e => `
      <div class="card"><h3>${e.lab}</h3><p>${e.position}</p><p>${e.period}</p></div>
    `).join('');
  }
}

async function init() {
  initNavigation();
  generateHome(await fetchJSON('data/home.json'));
  generateEducation(await fetchJSON('data/education.json'));
  generateProjects(await fetchJSON('data/projects.json'));
  generateTeaching(await fetchJSON('data/teaching.json'));
  generateResearch(await fetchJSON('data/research.json'));
}

document.addEventListener('DOMContentLoaded', init);
