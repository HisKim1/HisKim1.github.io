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

const THEME_STORAGE_KEY = 'theme-preference';

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function updateThemeToggle(button, theme) {
  if (!button) return;
  const isDark = theme === 'dark';
  button.dataset.theme = theme;
  button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

function applyTheme(theme, button) {
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggle(button, theme);
}

function initThemeToggle() {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme, button);
  requestAnimationFrame(() => {
    document.documentElement.classList.add('theme-ready');
  });
  button.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme, button);
  });
}

function initSpotlight() {
  if (window.matchMedia('(max-width: 600px)').matches) return;
  
  let ticking = false;
  let lastX = 0;
  let lastY = 0;
  
  function updateCursorPosition(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--cursor-x', lastX + 'px');
        document.documentElement.style.setProperty('--cursor-y', lastY + 'px');
        ticking = false;
      });
      ticking = true;
    }
  }
  
  // Use passive listener for better scroll performance
  document.addEventListener('mousemove', updateCursorPosition, { passive: true });
}

function initScrollBackground() {
  const root = document.documentElement;
  let ticking = false;

  function update() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    root.style.setProperty('--bg-shift', progress.toFixed(3));
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
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

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg']);

function shuffleArray(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function mixMediaByType(items) {
  const videos = [];
  const images = [];
  items.forEach(item => {
    const ext = getExtension(item.filename);
    if (VIDEO_EXTENSIONS.has(ext)) {
      videos.push(item);
    } else {
      images.push(item);
    }
  });

  const shuffledVideos = shuffleArray(videos);
  const shuffledImages = shuffleArray(images);
  const result = [];
  let useVideo = shuffledVideos.length >= shuffledImages.length;

  while (shuffledVideos.length || shuffledImages.length) {
    if (useVideo && shuffledVideos.length) {
      result.push(shuffledVideos.shift());
    } else if (!useVideo && shuffledImages.length) {
      result.push(shuffledImages.shift());
    } else if (shuffledVideos.length) {
      result.push(shuffledVideos.shift());
    } else {
      result.push(shuffledImages.shift());
    }
    useVideo = !useVideo;
  }

  return result;
}

function getExtension(filename = '') {
  const match = filename.match(/\.([^.?#/]+)(?:[?#].*)?$/);
  return match ? match[1].toLowerCase() : '';
}

function toDisplayName(filename = '') {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

let mediaManifestPromise;

async function fetchMediaManifest() {
  if (!mediaManifestPromise) {
    mediaManifestPromise = fetch('data/media.json').then(res => {
      if (!res.ok) {
        throw new Error('Failed to load media manifest');
      }
      return res.json();
    });
  }
  return mediaManifestPromise;
}

async function populateMediaGallery({ containerId, key, allowVideos }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const manifest = await fetchMediaManifest();
    const entries = Array.isArray(manifest[key]) ? manifest[key] : [];
    const filtered = entries
      .map(filename => ({ link: filename, filename }))
      .filter(item => item.filename)
      .filter(item => {
        const ext = getExtension(item.filename);
        if (IMAGE_EXTENSIONS.has(ext)) return true;
        if (allowVideos && VIDEO_EXTENSIONS.has(ext)) return true;
        return false;
      });

    const mixed = mixMediaByType(filtered);
    const markup = mixed.map(({ link, filename }) => {
      const ext = getExtension(filename);
      const safeLink = encodeURI(link);
      if (VIDEO_EXTENSIONS.has(ext)) {
        return `
          <figure class="media-card media-video">
            <div class="media-frame">
              <video controls preload="metadata" playsinline>
                <source src="images/${safeLink}" type="video/${ext}">
                Your browser does not support the video tag.
              </video>
            </div>
          </figure>
        `;
      }
      const alt = toDisplayName(filename);
      return `
        <figure class="media-card media-photo">
          <div class="media-frame">
            <img src="images/${safeLink}" alt="${alt}" loading="lazy">
          </div>
        </figure>
      `;
    }).join('');

    container.innerHTML = markup;
  } catch (error) {
    console.warn('[populateMediaGallery] Unable to load gallery', error);
  }
}

async function initFunFactGalleries() {
  await Promise.all([
    populateMediaGallery({ containerId: 'crossfit-gallery', key: 'crossfit', allowVideos: true }),
    populateMediaGallery({ containerId: 'dance-gallery', key: 'dance', allowVideos: false })
  ]);
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

const MONTH_ORDER = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
};

function getMonthIndex(month = '') {
  if (!month) return 0;
  const normalized = month.trim().toLowerCase();
  return MONTH_ORDER[normalized] || 0;
}

function sortByRecency(items = []) {
  return [...items].sort((a, b) => {
    const yearA = Number(a.year) || 0;
    const yearB = Number(b.year) || 0;
    if (yearA !== yearB) return yearB - yearA;
    const monthA = getMonthIndex(a.month);
    const monthB = getMonthIndex(b.month);
    if (monthA !== monthB) return monthB - monthA;
    return 0;
  });
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

  if (entry.presentation_type) {
    segments.push(`<span class="apa-presentation">${entry.presentation_type}</span>.`);
  }

  if (entry.status_note) {
    segments.push(`<span class="apa-status">${entry.status_note}</span>`);
  }

  const metadata = [];
  if (entry.event || entry.location) {
    const parts = [];
    if (entry.event) parts.push(entry.event);
    if (entry.location) parts.push(entry.location);
    metadata.push(`<div class="research-meta"><span>${parts.join(', ')}</span></div>`);
  }
  if (entry.doi) {
    metadata.push(`<div class="research-meta"><a href="${entry.doi}" target="_blank" rel="noopener noreferrer">${entry.doi}</a></div>`);
  }
  const metadataHtml = metadata.join('');

  return `<li>${segments.join(' ')}${metadataHtml}</li>`;
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
  const keywords = data.profile.keywords && data.profile.keywords.length > 0
    ? `<div class="profile-keywords">${data.profile.keywords.map(k => `<span class="keyword-badge">${k}</span>`).join('')}</div>`
    : '';
  container.innerHTML = `
    <div class="hero">
      <img src="${data.profile.img}" alt="${data.profile.name}" class="profile-img">
      <h1>Hello, my name is</h1>
      <h2>${data.profile.name}</h2>
      <p>${data.academic.paragraphs[0]}</p>
      ${keywords}
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
        tgpa ? `<span class="tgpa">GPA ${tgpa}</span>` : '',
        item.honors ? `<span class="honor-note">${item.honors}</span>` : ''
      ].filter(Boolean).join('');
      const metaBlock = metaItems ? `<div class="education-meta">${metaItems}</div>` : '';
      return `
        <div class="card education-card">
          <div class="card-heading">
            <div>
              <div class="date-row">
                <p class="date">${timeline}</p>
                ${item.country ? `<span class="country-badge">${item.country}</span>` : ''}
              </div>
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
    const extracurricularItems = data.extracurricular.map(e => {
      const metaParts = [e.org, e.country].filter(Boolean).join(' · ');
      const detailsBlock = e.details && e.details.length > 0 ? `
        <ul class="extracurricular-details">
          ${e.details.map(d => `<li>${d}</li>`).join('')}
        </ul>
      ` : '';
      return `
        <li class="extracurricular-item">
          <div class="extracurricular-row">
            <div class="extracurricular-main">
              <span class="extracurricular-title">${e.school || ''}</span>
              ${e.position ? `<span class="extracurricular-role">${e.position}</span>` : ''}
            </div>
            <div class="extracurricular-meta">
              ${e.period ? `<span class="extracurricular-period">${e.period}</span>` : ''}
            </div>
          </div>
          ${metaParts ? `<div class="extracurricular-sub">${metaParts}</div>` : ''}
          ${detailsBlock}
        </li>
      `;
    }).join('');
    html += `
      <div class="education-extracurricular">
        <button class="extracurricular-toggle" type="button" aria-expanded="false">
          <span>Extracurricular</span>
          <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="education-extracurricular-body" data-state="collapsed">
          <ul class="extracurricular-list">${extracurricularItems}</ul>
        </div>
      </div>
    `;
  }
  list.innerHTML = html;
  const toggle = list.querySelector('.extracurricular-toggle');
  const panel = list.querySelector('.education-extracurricular-body');
  if (toggle && panel) {
    const setOpen = isOpen => {
      panel.dataset.state = isOpen ? 'open' : 'collapsed';
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      } else {
        panel.style.maxHeight = '0px';
      }
    };
    setOpen(false);
    toggle.addEventListener('click', () => {
      const isOpen = panel.dataset.state === 'open';
      setOpen(!isOpen);
    });
    window.addEventListener('resize', () => {
      if (panel.dataset.state === 'open') {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    }, { passive: true });
  }
  applyCardHoverEffects();
}

function parseProjectDescription(description = '') {
  if (!description) return { source: '', details: [], plainText: '' };
  const details = [];
  let source = '';
  let plainText = '';
  
  const liMatches = description.matchAll(/<li>(.*?)<\/li>/g);
  for (const match of liMatches) {
    details.push(match[1]);
  }
  
  const withoutList = description.replace(/<ul>.*?<\/ul>/gs, '').replace(/<li>.*?<\/li>/g, '').trim();
  
  if (details.length > 0) {
    const sourceMatch = withoutList.match(/^(.+?)(?:\n|$)/);
    if (sourceMatch) {
      source = sourceMatch[1].trim();
    }
  } else {
    plainText = withoutList;
  }
  
  return { source, details, plainText };
}

function generateProjects(data) {
  const grid = document.getElementById('project-grid');
  if (!grid) return;
  console.log('[generateProjects] Rendering project cards');
  grid.innerHTML = data.map(p => {
    const { source, details, plainText } = parseProjectDescription(p.description);
    const hasDetails = details.length > 0;
    const hasPlainText = plainText.length > 0;
    
    return `
      <div class="card project-card">
        <div class="project-title-section">
          <h3>${p.title}</h3>
          ${source ? `<p class="project-source">${source}</p>` : ''}
        </div>
        <div class="project-content">
          <img class="project-img" src="${p.images}" alt="${p.title}">
          <div class="project-text-content">
            ${hasDetails ? `
              <ul class="project-details">
                ${details.map(d => `<li>${d}</li>`).join('')}
              </ul>
            ` : hasPlainText ? `<div class="project-description">${plainText}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
  applyCardHoverEffects();
}

function parseTeachingDescription(description = '') {
  if (!description) return { intro: '', introTerm: '', items: [] };
  const items = [];
  let intro = '';
  let introTerm = '';
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);

  function stripTags(text) {
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  function splitOutsideParens(text) {
    const parts = [];
    let current = '';
    let depth = 0;
    for (const char of text) {
      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);
      if (char === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  function pushCourseLine(line) {
    const cleaned = stripTags(line);
    if (!cleaned) return;
    const normalized = cleaned.replace(/,\s*and\s+/gi, ', ');
    const parts = splitOutsideParens(normalized);
    parts.forEach(part => {
      const match = part.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
      if (!match) return;
      const title = (match[1] || '').trim();
      const term = (match[2] || '').trim();
      if (!title) return;
      items.push({ title, term });
    });
  }

  for (const line of lines) {
    const pMatch = line.match(/<p>(.*?)<\/p>/);
    const content = pMatch ? pMatch[1] : line;
    if (!content) continue;
    const cleaned = stripTags(content);
    if (!cleaned) continue;
    if (!intro && /courses|prof\.|professor|teaching/i.test(cleaned)) {
      const match = cleaned.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
      intro = (match?.[1] || cleaned).trim();
      introTerm = (match?.[2] || '').trim();
      continue;
    }
    pushCourseLine(content);
  }

  return { intro, introTerm, items };
}

function normalizeTeachingTerms(term = '') {
  if (!term) return [];
  const parts = term.split(',').map(p => p.trim()).filter(Boolean);
  if (!parts.length) return [];
  const yearMatch = parts[0].match(/^(\d{4})\s+(.*)$/);
  if (yearMatch) {
    const year = yearMatch[1];
    return parts.map((part, index) => {
      if (index === 0) return part;
      return /^\d{4}\b/.test(part) ? part : `${year} ${part}`;
    });
  }
  return parts;
}

function generateTeaching(data) {
  const grid = document.getElementById('teaching-list');
  if (!grid) return;
  console.log('[generateTeaching] Rendering teaching cards');
  grid.innerHTML = data.map(t => {
    const { intro, introTerm, items } = parseTeachingDescription(t.description);
    const listHtml = items.length > 0
      ? `
        <ul class="teaching-list">
          ${items.map(item => `
            <li class="teaching-item">
              <span class="teaching-course">${item.title}</span>
              ${item.term ? `
                <span class="teaching-terms">
                  ${normalizeTeachingTerms(item.term).map(term => `<span class="teaching-term">${term}</span>`).join('')}
                </span>
              ` : ''}
            </li>
          `).join('')}
        </ul>
      `
      : '';
    return `
      <div class="card teaching-card">
        <h3>${t.title}</h3>
        ${intro ? `
          <div class="teaching-intro-row">
            <p class="teaching-intro">${intro}</p>
            ${introTerm ? `<span class="teaching-term">${introTerm}</span>` : ''}
          </div>
        ` : ''}
        ${listHtml || `<div class="teaching-description">${t.description}</div>`}
      </div>
    `;
  }).join('');
  applyCardHoverEffects();
}

function generateResearch(data) {
  const pubsContainer = document.getElementById('research-publications');
  const confContainer = document.getElementById('research-conferences');
  const expContainer = document.getElementById('research-experience');

  console.log('[generateResearch] Rendering publications and presentations');

  if (pubsContainer) {
    const publications = sortByRecency(data.publications);
    pubsContainer.innerHTML = createApaList(publications, renderPublicationAPA);
    console.log(`[generateResearch] Publications rendered: ${data.publications ? data.publications.length : 0}`);
  }

  if (confContainer) {
    const conferences = sortByRecency(data.conferences);
    confContainer.innerHTML = createApaList(conferences, renderConferenceAPA);
    console.log(`[generateResearch] Conferences rendered: ${data.conferences ? data.conferences.length : 0}`);
  }

  if (expContainer && Array.isArray(data.experience)) {
    expContainer.innerHTML = data.experience.map(e => {
      const { timeline } = splitPeriod(e.period || '');
      return `
        <div class="card experience-card">
          <div class="card-heading">
            <div>
              <p class="date">${timeline || e.period || ''}</p>
              <h3>${e.lab || ''}</h3>
            </div>
            ${e.organization ? `<span class="country-badge">${e.organization}</span>` : ''}
          </div>
          ${e.position ? `<p class="experience-position">${e.position || ''}</p>` : ''}
          ${e.details && e.details.length > 0 ? `
            <ul class="experience-details">
              ${e.details.map(d => `<li>${d}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }).join('');
    console.log(`[generateResearch] Research experiences rendered: ${data.experience.length}`);
  }

  applyCardHoverEffects();
}



async function init() {
  initNavigation();
  initThemeToggle();
  initSpotlight();
  initScrollBackground();
  generateHome(await fetchJSON('data/home.json'));
  generateEducation(await fetchJSON('data/education.json'));
  generateProjects(await fetchJSON('data/projects.json'));
  generateTeaching(await fetchJSON('data/teaching.json'));
  generateResearch(await fetchJSON('data/research.json'));
  await initFunFactGalleries();
  applyCardHoverEffects();
}

function showFunFactPage() {
  const mainContent = document.querySelector('main');
  const funFactPage = document.getElementById('fun-fact');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  
  if (!mainContent || !funFactPage) return;
  
  console.log('[showFunFactPage] Transitioning to fun fact page');
  
  // Fade out main content
  mainContent.style.opacity = '0';
  mainContent.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    mainContent.style.display = 'none';
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    // Show and fade in fun fact page
    funFactPage.style.display = 'block';
    funFactPage.style.opacity = '0';
    funFactPage.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        funFactPage.style.opacity = '1';
        funFactPage.style.transform = 'translateY(0)';
      }, 10);
    });
  }, 300);
  
  // Use smooth scroll only on desktop
  if (window.innerWidth > 600) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo(0, 0);
  }
}

function showMainPage() {
  const mainContent = document.querySelector('main');
  const funFactPage = document.getElementById('fun-fact');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  
  if (!mainContent || !funFactPage) return;
  
  console.log('[showMainPage] Returning to main page');
  
  // Fade out fun fact page
  funFactPage.style.opacity = '0';
  funFactPage.style.transform = 'translateY(-20px)';
  
  setTimeout(() => {
    funFactPage.style.display = 'none';
    
    // Show and fade in main content
    mainContent.style.display = 'block';
    if (header) header.style.display = 'block';
    if (footer) footer.style.display = 'block';
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateY(-20px)';
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'translateY(0)';
      }, 10);
    });
  }, 300);
  
  // Use smooth scroll only on desktop
  if (window.innerWidth > 600) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo(0, 0);
  }
}

document.addEventListener('DOMContentLoaded', init);
