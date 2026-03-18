const THEME_STORAGE_KEY = 'theme-preference';
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg']);
const PRIMARY_NAME_PATTERN = /(Kim,\s*H\.|H\.?\s*Kim)/gi;

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

const appState = {
  lenis: null,
  lenisRafId: 0,
  scrollController: null,
  revealCleanup: null,
  revealRafId: 0,
  resizeRafId: 0,
  dotNavCleanup: null,
  scrollBackgroundCleanup: null,
  spotlightBound: false,
  themeToggleBound: false,
  resizeBound: false,
  mediaManifestPromise: null,
  revealDebugScrollCount: 0
};

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.json();
}

function nextFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForDomMount() {
  await nextFrame();
  await nextFrame();
}

function prefersReducedMotion() {
  return false;
}

function getContentArea() {
  return document.getElementById('content-area');
}

function getContentScrollBody() {
  return document.querySelector('.content-scroll-body');
}

function isMainLayoutVisible() {
  const layout = document.querySelector('.layout');
  return Boolean(layout) && getComputedStyle(layout).display !== 'none';
}

function usesNestedScrollContainer() {
  const contentArea = getContentArea();
  if (!contentArea || !isMainLayoutVisible()) return false;
  return window.innerWidth > 768 && getComputedStyle(contentArea).overflowY !== 'visible';
}

function getScrollEventTarget() {
  return usesNestedScrollContainer() ? getContentArea() : window;
}

function getRevealRoot() {
  return usesNestedScrollContainer() ? getContentArea() : null;
}

function getScrollPosition() {
  if (usesNestedScrollContainer()) {
    const contentArea = getContentArea();
    return contentArea ? contentArea.scrollTop : 0;
  }
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function getScrollHeight() {
  if (usesNestedScrollContainer()) {
    const contentArea = getContentArea();
    return contentArea ? contentArea.scrollHeight - contentArea.clientHeight : 0;
  }
  return document.documentElement.scrollHeight - window.innerHeight;
}

function getRevealDebugSnapshot(limit = 8) {
  const root = getRevealRoot();
  const rootRect = root
    ? root.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight, height: window.innerHeight };
  const enterOffset = Math.max(rootRect.height * 0.14, 56);

  return collectRevealTargets().slice(0, limit).map((target, index) => {
    const rect = target.getBoundingClientRect();
    return {
      index,
      classes: target.className,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      height: Math.round(rect.height),
      visible: target.classList.contains('is-visible'),
      shouldReveal: rect.top <= rootRect.bottom - enterOffset && rect.bottom >= rootRect.top + 24
    };
  });
}

function logRevealDebugSnapshot(label) {
  const root = getRevealRoot();
  const scrollTarget = getScrollEventTarget();
  const payload = {
    label,
    root: root ? '#content-area' : 'window',
    scrollTop: root ? root.scrollTop : window.scrollY,
    clientHeight: root ? root.clientHeight : window.innerHeight,
    scrollHeight: root ? root.scrollHeight : document.documentElement.scrollHeight,
    targetType: scrollTarget === window ? 'window' : '#content-area',
    items: getRevealDebugSnapshot()
  };

  console.log('[reveal:debug]', payload);
}

/* -------------------------------------------------------------------------- */
/* Data Fetching & Rendering                                                  */
/* -------------------------------------------------------------------------- */

async function fetchAppData() {
  const [home, education, projects, teaching, research] = await Promise.all([
    fetchJSON('data/home.json'),
    fetchJSON('data/education.json'),
    fetchJSON('data/projects.json'),
    fetchJSON('data/teaching.json'),
    fetchJSON('data/research.json')
  ]);

  return { home, education, projects, teaching, research };
}

function emphasizePrimaryName(text = '') {
  return text.replace(PRIMARY_NAME_PATTERN, match => `<strong><u>${match}</u></strong>`);
}

function formatAuthorList(authors = [], highlightIndices) {
  if (!Array.isArray(authors) || !authors.length) return '';

  const useExplicitHighlight = Array.isArray(highlightIndices);
  const formattedAuthors = authors.map((author, index) => {
    if (!useExplicitHighlight) return emphasizePrimaryName(author);
    return highlightIndices.includes(index) ? emphasizePrimaryName(author) : author;
  });

  if (formattedAuthors.length === 1) return formattedAuthors[0];
  if (formattedAuthors.length === 2) return `${formattedAuthors[0]} & ${formattedAuthors[1]}`;

  const leadAuthors = formattedAuthors.slice(0, -1).join(', ');
  const finalAuthor = formattedAuthors[formattedAuthors.length - 1];
  return `${leadAuthors}, & ${finalAuthor}`;
}

function getMonthIndex(month = '') {
  if (!month) return 0;
  return MONTH_ORDER[month.trim().toLowerCase()] || 0;
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

  if (entry.title) segments.push(`${entry.title}.`);
  if (entry.presentation_type) segments.push(`<span class="apa-presentation">${entry.presentation_type}</span>.`);
  if (entry.status_note) segments.push(`<span class="apa-status">${entry.status_note}</span>`);

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

  return `<li>${segments.join(' ')}${metadata.join('')}</li>`;
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
      ${details.map(detail => `
        <div class="edu-detail-row">
          <dt data-label="${detail.label}">${detail.label}</dt>
          <dd>${detail.value}</dd>
        </div>
      `).join('')}
    </dl>
  `;
}

function parseProjectDescription(description = '') {
  if (!description) return { source: '', details: [], plainText: '' };

  const details = [];
  let source = '';
  let plainText = '';

  for (const match of description.matchAll(/<li>(.*?)<\/li>/g)) {
    details.push(match[1]);
  }

  const withoutList = description
    .replace(/<ul>.*?<\/ul>/gs, '')
    .replace(/<li>.*?<\/li>/g, '')
    .trim();

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

function parseTeachingDescription(description = '') {
  if (!description) return { intro: '', introTerm: '', items: [] };

  const items = [];
  let intro = '';
  let introTerm = '';
  const lines = description.split('\n').map(line => line.trim()).filter(Boolean);

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
    const paragraphMatch = line.match(/<p>(.*?)<\/p>/);
    const content = paragraphMatch ? paragraphMatch[1] : line;
    if (!content) continue;

    const cleaned = stripTags(content);
    if (!cleaned) continue;

    if (!intro && /courses|prof\.|professor|teaching/i.test(cleaned)) {
      const introMatch = cleaned.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
      intro = (introMatch?.[1] || cleaned).trim();
      introTerm = (introMatch?.[2] || '').trim();
      continue;
    }

    pushCourseLine(content);
  }

  return { intro, introTerm, items };
}

function normalizeTeachingTerms(term = '') {
  if (!term) return [];

  const parts = term.split(',').map(part => part.trim()).filter(Boolean);
  if (!parts.length) return [];

  const yearMatch = parts[0].match(/^(\d{4})\s+(.*)$/);
  if (!yearMatch) return parts;

  const year = yearMatch[1];
  return parts.map((part, index) => {
    if (index === 0) return part;
    return /^\d{4}\b/.test(part) ? part : `${year} ${part}`;
  });
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

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function mixMediaByType(items) {
  const videos = [];
  const images = [];

  items.forEach(item => {
    const extension = getExtension(item.filename);
    if (VIDEO_EXTENSIONS.has(extension)) {
      videos.push(item);
    } else {
      images.push(item);
    }
  });

  const shuffledVideos = shuffleArray(videos);
  const shuffledImages = shuffleArray(images);
  const mixed = [];
  let useVideo = shuffledVideos.length >= shuffledImages.length;

  while (shuffledVideos.length || shuffledImages.length) {
    if (useVideo && shuffledVideos.length) {
      mixed.push(shuffledVideos.shift());
    } else if (!useVideo && shuffledImages.length) {
      mixed.push(shuffledImages.shift());
    } else if (shuffledVideos.length) {
      mixed.push(shuffledVideos.shift());
    } else {
      mixed.push(shuffledImages.shift());
    }
    useVideo = !useVideo;
  }

  return mixed;
}

async function fetchMediaManifest() {
  if (!appState.mediaManifestPromise) {
    appState.mediaManifestPromise = fetchJSON('data/media.json');
  }
  return appState.mediaManifestPromise;
}

function renderHome(data) {
  const container = document.getElementById('home-section');
  if (!container) return;

  const keywords = Array.isArray(data.profile?.keywords) && data.profile.keywords.length
    ? `<div class="profile-keywords">${data.profile.keywords.map(keyword => `<span class="keyword-badge">${keyword}</span>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <div class="hero">
      <img src="${data.profile.img}" alt="${data.profile.name}" class="profile-img">
      <h1>Hello, my name is</h1>
      <h2>${data.profile.name}</h2>
      <p>${data.academic.paragraphs[0]}</p>
      ${keywords}
    </div>
  `;
}

function renderEducation(data) {
  const list = document.getElementById('education-list');
  if (!list) return;

  let html = (data.main || []).map(item => {
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
  }).join('');

  if (Array.isArray(data.extracurricular) && data.extracurricular.length) {
    const extracurricularItems = data.extracurricular.map(item => {
      const metaParts = [item.org, item.country].filter(Boolean).join(' · ');
      const detailsBlock = Array.isArray(item.details) && item.details.length
        ? `
          <ul class="extracurricular-details">
            ${item.details.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        `
        : '';

      return `
        <li class="extracurricular-item">
          <div class="extracurricular-row">
            <div class="extracurricular-main">
              <span class="extracurricular-title">${item.school || ''}</span>
              ${item.position ? `<span class="extracurricular-role">${item.position}</span>` : ''}
            </div>
            <div class="extracurricular-meta">
              ${item.period ? `<span class="extracurricular-period">${item.period}</span>` : ''}
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
}

function bindEducationAccordion() {
  const list = document.getElementById('education-list');
  if (!list) return;

  const toggle = list.querySelector('.extracurricular-toggle');
  const panel = list.querySelector('.education-extracurricular-body');

  if (!toggle || !panel) return;

  function setOpen(isOpen) {
    panel.dataset.state = isOpen ? 'open' : 'collapsed';
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '0px';
  }

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

function renderProjects(data) {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  grid.innerHTML = data.map(project => {
    const { source, details, plainText } = parseProjectDescription(project.description);
    const hasDetails = details.length > 0;
    const hasPlainText = plainText.length > 0;

    return `
      <div class="card project-card">
        <div class="project-title-section">
          <h3>${project.title}</h3>
          ${source ? `<p class="project-source">${source}</p>` : ''}
        </div>
        <div class="project-content">
          <img class="project-img" src="${project.images}" alt="${project.title}">
          <div class="project-text-content">
            ${hasDetails ? `
              <ul class="project-details">
                ${details.map(detail => `<li>${detail}</li>`).join('')}
              </ul>
            ` : hasPlainText ? `<div class="project-description">${plainText}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderTeaching(data) {
  const grid = document.getElementById('teaching-list');
  if (!grid) return;

  grid.innerHTML = data.map(item => {
    const { intro, introTerm, items } = parseTeachingDescription(item.description);
    const listHtml = items.length > 0
      ? `
        <ul class="teaching-list">
          ${items.map(course => `
            <li class="teaching-item">
              <span class="teaching-course">${course.title}</span>
              ${course.term ? `
                <span class="teaching-terms">
                  ${normalizeTeachingTerms(course.term).map(term => `<span class="teaching-term">${term}</span>`).join('')}
                </span>
              ` : ''}
            </li>
          `).join('')}
        </ul>
      `
      : '';

    return `
      <div class="card teaching-card">
        <h3>${item.title}</h3>
        ${intro ? `
          <div class="teaching-intro-row">
            <p class="teaching-intro">${intro}</p>
            ${introTerm ? `<span class="teaching-term">${introTerm}</span>` : ''}
          </div>
        ` : ''}
        ${listHtml || `<div class="teaching-description">${item.description}</div>`}
      </div>
    `;
  }).join('');
}

function renderResearch(data) {
  const publicationsContainer = document.getElementById('research-publications');
  const conferencesContainer = document.getElementById('research-conferences');
  const experienceContainer = document.getElementById('research-experience');

  if (publicationsContainer) {
    const publications = sortByRecency(data.publications || []);
    publicationsContainer.innerHTML = createApaList(publications, renderPublicationAPA);
  }

  if (conferencesContainer) {
    const conferences = sortByRecency(data.conferences || []);
    conferencesContainer.innerHTML = createApaList(conferences, renderConferenceAPA);
  }

  if (experienceContainer && Array.isArray(data.experience)) {
    experienceContainer.innerHTML = data.experience.map(item => {
      const { timeline } = splitPeriod(item.period || '');
      return `
        <div class="card experience-card">
          <div class="card-heading">
            <div>
              <p class="date">${timeline || item.period || ''}</p>
              <h3>${item.lab || ''}</h3>
            </div>
            ${item.organization ? `<span class="country-badge">${item.organization}</span>` : ''}
          </div>
          ${item.position ? `<p class="experience-position">${item.position}</p>` : ''}
          ${Array.isArray(item.details) && item.details.length ? `
            <ul class="experience-details">
              ${item.details.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}

async function populateMediaGallery({ containerId, key, allowVideos }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const manifest = await fetchMediaManifest();
    const entries = Array.isArray(manifest[key]) ? manifest[key] : [];

    const filteredEntries = entries
      .map(filename => ({ link: filename, filename }))
      .filter(item => item.filename)
      .filter(item => {
        const extension = getExtension(item.filename);
        if (IMAGE_EXTENSIONS.has(extension)) return true;
        if (allowVideos && VIDEO_EXTENSIONS.has(extension)) return true;
        return false;
      });

    const mixedEntries = mixMediaByType(filteredEntries);
    container.innerHTML = mixedEntries.map(({ link, filename }) => {
      const extension = getExtension(filename);
      const safeLink = encodeURI(link);

      if (VIDEO_EXTENSIONS.has(extension)) {
        return `
          <figure class="media-card media-video">
            <div class="media-frame">
              <video controls preload="metadata" playsinline>
                <source src="images/${safeLink}" type="video/${extension}">
                Your browser does not support the video tag.
              </video>
            </div>
          </figure>
        `;
      }

      return `
        <figure class="media-card media-photo">
          <div class="media-frame">
            <img src="images/${safeLink}" alt="${toDisplayName(filename)}" loading="lazy">
          </div>
        </figure>
      `;
    }).join('');
  } catch (error) {
    console.warn('[populateMediaGallery] Unable to load media gallery', error);
  }
}

async function renderFunFactGalleries() {
  await Promise.all([
    populateMediaGallery({ containerId: 'crossfit-gallery', key: 'crossfit', allowVideos: true }),
    populateMediaGallery({ containerId: 'dance-gallery', key: 'dance', allowVideos: false })
  ]);
}

async function renderAppContent(data) {
  renderHome(data.home);
  renderEducation(data.education);
  renderProjects(data.projects);
  renderTeaching(data.teaching);
  renderResearch(data.research);
  await renderFunFactGalleries();
  bindEducationAccordion();
}

/* -------------------------------------------------------------------------- */
/* UI Interactions                                                             */
/* -------------------------------------------------------------------------- */

function getPreferredTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
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
  if (!button || appState.themeToggleBound) return;

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
    requestAnimationFrame(() => {
      initScrollBackground();
    });
  });

  appState.themeToggleBound = true;
}

function initSpotlight() {
  if (appState.spotlightBound || window.matchMedia('(max-width: 600px)').matches) return;

  let ticking = false;
  let lastX = 0;
  let lastY = 0;

  document.addEventListener('mousemove', event => {
    lastX = event.clientX;
    lastY = event.clientY;

    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--cursor-x', `${lastX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${lastY}px`);
      ticking = false;
    });
  }, { passive: true });

  appState.spotlightBound = true;
}

function initDotNav() {
  if (appState.dotNavCleanup) {
    appState.dotNavCleanup();
    appState.dotNavCleanup = null;
  }

  const contentArea = getContentArea();
  const dots = Array.from(document.querySelectorAll('.dot-item[data-section]'));
  const sections = contentArea ? Array.from(contentArea.querySelectorAll('section[id]')) : [];

  if (!contentArea || !sections.length || !dots.length || !isMainLayoutVisible()) return;

  let ticking = false;

  function updateDots() {
    const containerTop = contentArea.getBoundingClientRect().top;
    const threshold = contentArea.clientHeight * 0.4;
    let activeId = sections[0].id;

    sections.forEach(section => {
      if (section.getBoundingClientRect().top - containerTop <= threshold) {
        activeId = section.id;
      }
    });

    dots.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.section === activeId);
    });

    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateDots);
  }

  function handleDotClick(event) {
    event.preventDefault();
    const target = document.getElementById(event.currentTarget.dataset.section);
    if (!target) return;

    if (appState.scrollController && typeof appState.scrollController.scrollTo === 'function') {
      appState.scrollController.scrollTo(target, { duration: 0.85 });
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  contentArea.addEventListener('scroll', onScroll, { passive: true });
  dots.forEach(dot => dot.addEventListener('click', handleDotClick));
  updateDots();

  appState.dotNavCleanup = () => {
    contentArea.removeEventListener('scroll', onScroll);
    dots.forEach(dot => dot.removeEventListener('click', handleDotClick));
  };
}

/* -------------------------------------------------------------------------- */
/* Animations & Scrolling                                                     */
/* -------------------------------------------------------------------------- */

function destroyLenis() {
  if (appState.lenisRafId) {
    cancelAnimationFrame(appState.lenisRafId);
    appState.lenisRafId = 0;
  }

  if (appState.lenis && typeof appState.lenis.destroy === 'function') {
    appState.lenis.destroy();
  }

  appState.lenis = null;

  if (appState.scrollController && typeof appState.scrollController.destroy === 'function') {
    appState.scrollController.destroy();
  }
  appState.scrollController = null;
}

function createSmoothScrollFallback(contentArea) {
  let targetScrollTop = contentArea.scrollTop;
  let rafId = 0;
  let animating = false;

  function clampScroll(value) {
    const maxScroll = Math.max(0, contentArea.scrollHeight - contentArea.clientHeight);
    return Math.min(Math.max(value, 0), maxScroll);
  }

  function animate() {
    const delta = targetScrollTop - contentArea.scrollTop;

    if (Math.abs(delta) < 0.5) {
      contentArea.scrollTop = targetScrollTop;
      animating = false;
      rafId = 0;
      return;
    }

    animating = true;
    contentArea.scrollTop += delta * 0.14;
    rafId = requestAnimationFrame(animate);
  }

  function requestTick() {
    if (rafId) return;
    rafId = requestAnimationFrame(animate);
  }

  function onWheel(event) {
    event.preventDefault();
    targetScrollTop = clampScroll(targetScrollTop + event.deltaY);
    requestTick();
  }

  function onScroll() {
    if (animating) return;
    targetScrollTop = contentArea.scrollTop;
  }

  contentArea.addEventListener('wheel', onWheel, { passive: false });
  contentArea.addEventListener('scroll', onScroll, { passive: true });

  return {
    scrollTo(target, options = {}) {
      const nextTop = typeof target === 'number'
        ? target
        : target.offsetTop;

      targetScrollTop = clampScroll(nextTop);

      if (options.immediate) {
        contentArea.scrollTop = targetScrollTop;
        return;
      }

      requestTick();
    },
    destroy() {
      contentArea.removeEventListener('wheel', onWheel);
      contentArea.removeEventListener('scroll', onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }
  };
}

function initLenis() {
  const contentArea = getContentArea();
  const content = getContentScrollBody();

  if (!contentArea || !content || !usesNestedScrollContainer() || prefersReducedMotion()) {
    destroyLenis();
    return null;
  }

  destroyLenis();

  if (typeof window.Lenis !== 'function') {
    console.warn('[initLenis] Lenis CDN unavailable, enabling fallback smooth scroll');
    appState.scrollController = createSmoothScrollFallback(contentArea);
    return appState.scrollController;
  }

  appState.lenis = new window.Lenis({
    wrapper: contentArea,
    content,
    duration: 0.9,
    lerp: 0.14,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.82,
    gestureOrientation: 'vertical'
  });

  if (typeof appState.lenis.on === 'function') {
    appState.lenis.on('scroll', scheduleRevealEvaluation);
  }

  const animate = time => {
    if (!appState.lenis) return;
    appState.lenis.raf(time);
    appState.lenisRafId = requestAnimationFrame(animate);
  };

  appState.lenisRafId = requestAnimationFrame(animate);
  appState.scrollController = appState.lenis;
  console.log('[initLenis] Lenis initialized');
  return appState.lenis;
}

function evaluateRevealTargets() {
  const root = getRevealRoot();
  const rootRect = root
    ? root.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight, height: window.innerHeight };
  const enterOffset = Math.max(rootRect.height * 0.14, 56);
  let activatedCount = 0;

  document.querySelectorAll('.reveal-item:not(.is-visible)').forEach(target => {
    const rect = target.getBoundingClientRect();
    const isVisibleWithinRoot = rect.top <= rootRect.bottom - enterOffset && rect.bottom >= rootRect.top + 24;

    if (!isVisibleWithinRoot) return;

    target.classList.add('is-visible');
    activatedCount += 1;
  });

  if (activatedCount > 0) {
    console.log(`[initScrollReveal] Activated ${activatedCount} element(s)`);
    logRevealDebugSnapshot('activation');
  }
}

function scheduleRevealEvaluation() {
  if (appState.revealRafId) return;
  appState.revealRafId = requestAnimationFrame(() => {
    evaluateRevealTargets();
    appState.revealRafId = 0;
  });
}

function bindRevealFallback() {
  if (appState.revealCleanup) {
    appState.revealCleanup();
    appState.revealCleanup = null;
  }

  const scrollTarget = getScrollEventTarget();

  const onScroll = () => {
    appState.revealDebugScrollCount += 1;
    if (appState.revealDebugScrollCount <= 5 || appState.revealDebugScrollCount % 10 === 0) {
      console.log('[reveal:scroll]', {
        count: appState.revealDebugScrollCount,
        target: scrollTarget === window ? 'window' : '#content-area',
        scrollTop: getScrollPosition(),
        usesNestedScrollContainer: usesNestedScrollContainer(),
        lenisActive: Boolean(appState.lenis),
        smoothControllerActive: Boolean(appState.scrollController)
      });
    }
    scheduleRevealEvaluation();
  };

  const onResize = () => {
    console.log('[reveal:resize]', {
      width: window.innerWidth,
      height: window.innerHeight,
      usesNestedScrollContainer: usesNestedScrollContainer()
    });
    scheduleRevealEvaluation();
  };

  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  appState.revealCleanup = () => {
    scrollTarget.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
  };
}

function initScrollBackground() {
  if (appState.scrollBackgroundCleanup) {
    appState.scrollBackgroundCleanup();
    appState.scrollBackgroundCleanup = null;
  }

  const scrollTarget = getScrollEventTarget();
  const root = document.documentElement;
  let ticking = false;

  function update() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    if (theme === 'dark') {
      root.style.setProperty('--bg-shift', '0');
      ticking = false;
      return;
    }

    const scrollTop = getScrollPosition();
    const scrollHeight = getScrollHeight();
    const progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
    root.style.setProperty('--bg-shift', progress.toFixed(3));
    ticking = false;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  update();

  appState.scrollBackgroundCleanup = () => {
    scrollTarget.removeEventListener('scroll', onScroll);
  };
}

function collectRevealTargets() {
  return Array.from(document.querySelectorAll('section .section-glass-panel, section .card, section .media-card'));
}

function initScrollReveal() {
  const targets = collectRevealTargets();
  console.log(`[initScrollReveal] Observing ${targets.length} elements (root: ${getRevealRoot() ? '#content-area' : 'window'})`);

  if (!targets.length) return;
  bindRevealFallback();
  appState.revealDebugScrollCount = 0;

  targets.forEach((target, index) => {
    target.classList.add('reveal-item');
    target.classList.remove('is-visible');
    target.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
  });

  if (prefersReducedMotion()) {
    targets.forEach(target => target.classList.add('is-visible'));
    return;
  }

  if (targets[0]) {
    void targets[0].offsetHeight;
  }

  window.__portfolioRevealDebug = {
    snapshot: () => logRevealDebugSnapshot('manual'),
    list: () => getRevealDebugSnapshot(32),
    root: () => getRevealRoot(),
    scrollTop: () => getScrollPosition(),
    targetCount: () => collectRevealTargets().length
  };
  console.log('[reveal:debug] window.__portfolioRevealDebug available');
  logRevealDebugSnapshot('init');

  requestAnimationFrame(() => {
    scheduleRevealEvaluation();
  });
}

function refreshResponsiveEffects() {
  initLenis();
  initScrollBackground();
  initDotNav();
  initScrollReveal();
}

function bindResizeHandler() {
  if (appState.resizeBound) return;

  window.addEventListener('resize', () => {
    cancelAnimationFrame(appState.resizeRafId);
    appState.resizeRafId = requestAnimationFrame(() => {
      refreshResponsiveEffects();
    });
  }, { passive: true });

  appState.resizeBound = true;
}

/* -------------------------------------------------------------------------- */
/* Page Transitions                                                           */
/* -------------------------------------------------------------------------- */

function schedulePostTransitionRefresh() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      refreshResponsiveEffects();
    });
  });
}

function showFunFactPage() {
  const layout = document.querySelector('.layout');
  const dotNav = document.querySelector('.dot-nav');
  const funFactPage = document.getElementById('fun-fact');
  const contentArea = getContentArea();

  if (!layout || !funFactPage) return;

  destroyLenis();

  layout.style.opacity = '0';
  layout.style.transform = 'translateY(20px)';

  setTimeout(() => {
    layout.style.display = 'none';
    if (dotNav) dotNav.style.display = 'none';
    if (contentArea) contentArea.scrollTop = 0;

    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    funFactPage.style.display = 'block';
    funFactPage.style.opacity = '0';
    funFactPage.style.transform = 'translateY(20px)';

    requestAnimationFrame(() => {
      funFactPage.style.opacity = '1';
      funFactPage.style.transform = 'translateY(0)';
      schedulePostTransitionRefresh();
    });
  }, 300);
}

function showMainPage() {
  const layout = document.querySelector('.layout');
  const dotNav = document.querySelector('.dot-nav');
  const funFactPage = document.getElementById('fun-fact');
  const contentArea = getContentArea();

  if (!layout || !funFactPage) return;

  funFactPage.style.opacity = '0';
  funFactPage.style.transform = 'translateY(-20px)';

  setTimeout(() => {
    funFactPage.style.display = 'none';

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    layout.style.display = '';
    if (dotNav) dotNav.style.display = '';
    if (contentArea) contentArea.scrollTop = 0;
    layout.style.opacity = '0';
    layout.style.transform = 'translateY(-20px)';

    requestAnimationFrame(() => {
      layout.style.opacity = '1';
      layout.style.transform = 'translateY(0)';
      schedulePostTransitionRefresh();
    });
  }, 300);
}

window.showFunFactPage = showFunFactPage;
window.showMainPage = showMainPage;

/* -------------------------------------------------------------------------- */
/* Bootstrap                                                                  */
/* -------------------------------------------------------------------------- */

async function init() {
  initThemeToggle();
  initSpotlight();
  bindResizeHandler();

  console.log('[motion]', {
    forceAnimations: false,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  });

  const appData = await fetchAppData();
  await renderAppContent(appData);

  await waitForDomMount();
  refreshResponsiveEffects();
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(error => {
    console.error('[init] Failed to initialize portfolio site', error);
  });
});
