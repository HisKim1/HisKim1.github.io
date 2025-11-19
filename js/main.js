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

const PRIMARY_NAME_PATTERN = /(Kim,\s*H\.|H\.?\s*Kim)/gi;

function emphasizePrimaryName(text = '') {
  return text.replace(PRIMARY_NAME_PATTERN, match => `<strong><u>${match}</u></strong>`);
}

function formatAuthorList(authors = [], highlightIndices) {
  if (!Array.isArray(authors) || !authors.length) return '';
  const useExplicitHighlight = Array.isArray(highlightIndices);
  const formattedAuthors = authors.map((author, index) => {
    if (useExplicitHighlight) {
      return highlightIndices.includes(index) ? emphasizePrimaryName(author) : author;
    }
    return emphasizePrimaryName(author);
  });
  if (formattedAuthors.length === 1) return formattedAuthors[0];
  if (formattedAuthors.length === 2) {
    return `${formattedAuthors[0]} & ${formattedAuthors[1]}`;
  }
  const leadAuthors = formattedAuthors.slice(0, -1).join(', ');
  const finalAuthor = formattedAuthors[formattedAuthors.length - 1];
  return `${leadAuthors}, & ${finalAuthor}`;
}

function splitPeriod(period = '') {
  if (!period) return { timeline: '', degreeLabel: '' };
  const [timeline, label] = period.split('|').map(part => part.trim());
  return {
    timeline: timeline || period,
    degreeLabel: label || ''
  };
}

function createApaList(items, renderItem) {
  if (!Array.isArray(items) || !items.length) {
    return '<p class="empty-placeholder">Updates are on the way.</p>';
  }
  return `<ol class="apa-list">${items.map(renderItem).join('')}</ol>`;
}

function renderPublicationAPA(entry = {}) {
  const segments = [];
  const authors = formatAuthorList(entry.authors, entry.highlight_author_indices);
  if (authors) segments.push(authors);
  if (entry.year) segments.push(`(${entry.year}).`);

  if (entry.title) {
    const titleText = entry.link
      ? `<a href="${entry.link}" target="_blank" rel="noopener noreferrer">${entry.title}</a>`
      : entry.title;
    segments.push(`${titleText}.`);
  }

  if (entry.journal) {
    let journalSegment = `<span class="apa-journal">${entry.journal}</span>`;
    if (entry.volume) {
      journalSegment += `, <span class="apa-volume">${entry.volume}</span>`;
      if (entry.issue) {
        journalSegment += `(${entry.issue})`;
      }
    }
    if (entry.pages) {
      journalSegment += `, ${entry.pages}`;
    }
    journalSegment += '.';
    segments.push(journalSegment);
  }

  if (entry.doi) {
    segments.push(`<a href="${entry.doi}" target="_blank" rel="noopener noreferrer">${entry.doi}</a>.`);
  }

  if (entry.status_note) {
    segments.push(`<span class="apa-status">${entry.status_note}</span>`);
  }

  return `<li>${segments.join(' ')}</li>`;
}

function renderConferenceAPA(entry = {}) {
  const segments = [];
  const authors = formatAuthorList(entry.authors, entry.highlight_author_indices);
  if (authors) segments.push(authors);

  if (entry.year) {
    const monthPart = entry.month ? `, ${entry.month}` : '';
    segments.push(`(${entry.year}${monthPart}).`);
  }

  if (entry.title) {
    segments.push(`${entry.title}.`);
  }

  if (entry.event) {
    const presentationPrefix = entry.presentation_type ? `${entry.presentation_type} presented at` : 'Presented at';
    segments.push(`${presentationPrefix} <span class="apa-journal">${entry.event}</span>.`);
  }

  const metadata = entry.location
    ? `<div class="research-meta"><span>${entry.location}</span></div>`
    : '';

  return `<li>${segments.join(' ')}${metadata}</li>`;
}

function deriveEducationDetails(item = {}) {
  const mappings = [
    { key: 'double_degree', label: 'Double Major' },
    { key: 'minor', label: 'Minor' },
    { key: 'extra', label: 'Note' },
    { key: 'thesis', label: 'Thesis' },
    { key: 'advisor', label: 'Advisor' }
  ];

  return mappings
    .map(({ key, label }) => (item[key] ? { label, value: item[key] } : null))
    .filter(Boolean);
}

function buildEducationDetailsMarkup(item = {}) {
  const details = Array.isArray(item.details) && item.details.length
    ? item.details
    : deriveEducationDetails(item);

  if (!details.length) return '';

  return `
    <dl class="edu-details">
      ${details
        .map(detail => `
          <div class="edu-detail-row">
            <dt data-label="${detail.label}">${detail.label}</dt>
            <dd>${detail.value}</dd>
          </div>
        `)
        .join('')}
    </dl>
  `;
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
  console.log('[generateEducation] Rendering education timeline');
  let html = data.main
    .map(item => {
      const tgpa = (item.tgpa || '').trim();
      const { timeline, degreeLabel } = splitPeriod(item.period || '');
      const metaItems = [
        item.honors ? `<span class="honor-note">${item.honors}</span>` : '',
        tgpa ? `<span class="tgpa">GPA ${tgpa}</span>` : ''
      ].filter(Boolean).join('');
      const metaBlock = metaItems ? `<div class="education-meta">${metaItems}</div>` : '';
      return `
        <div class="card education-card">
          <div class="card-heading">
            <div>
              <p class="date">${timeline}</p>
              <h3>${item.school || ''}</h3>
            </div>
            ${degreeLabel ? `<span class="degree-chip">${degreeLabel}</span>` : ''}
          </div>
          ${metaBlock}
          ${item.degree ? `<p class="degree-detail">${item.degree}</p>` : ''}
          ${buildEducationDetailsMarkup(item)}
        </div>
      `;
    })
    .join('');

  if (data.extracurricular && data.extracurricular.length) {
    console.log('[generateEducation] Rendering extracurricular highlights');
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
  const pubsContainer = document.getElementById('research-publications');
  const confContainer = document.getElementById('research-conferences');
  const expContainer = document.getElementById('research-experience');

  console.log('[generateResearch] Rendering publications and presentations');

  if (pubsContainer) {
    pubsContainer.innerHTML = createApaList(data.publications, renderPublicationAPA);
    console.log(`[generateResearch] Publications rendered: ${data.publications ? data.publications.length : 0}`);
  }

  if (confContainer) {
    confContainer.innerHTML = createApaList(data.conferences, renderConferenceAPA);
    console.log(`[generateResearch] Conferences rendered: ${data.conferences ? data.conferences.length : 0}`);
  }

  if (expContainer && Array.isArray(data.experience)) {
    expContainer.innerHTML = data.experience.map(e => `
      <div class="card">
        <p class="date">${e.period || ''}</p>
        <h3>${e.lab || ''}</h3>
        <p>${e.position || ''}</p>
        ${e.details ? '<ul>' + e.details.map(d => `<li>${d}</li>`).join('') + '</ul>' : ''}
      </div>
    `).join('');
    console.log(`[generateResearch] Research experiences rendered: ${data.experience.length}`);
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
