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
  resizeTimerId: 0,
  dotNavCleanup: null,
  scrollBackgroundCleanup: null,
  spotlightBound: false,
  themeToggleBound: false,
  resizeBound: false,
  educationAccordionCleanup: null
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

/* -------------------------------------------------------------------------- */
/* Data Fetching & Rendering                                                  */
/* -------------------------------------------------------------------------- */

async function fetchAppData() {
  const [home, education, projects, teaching, research, now, beyond] = await Promise.all([
    fetchJSON('data/home.json'),
    fetchJSON('data/education.json'),
    fetchJSON('data/projects.json'),
    fetchJSON('data/teaching.json'),
    fetchJSON('data/research.json'),
    fetchJSON('data/now.json'),
    fetchJSON('data/beyond.json')
  ]);

  return { home, education, projects, teaching, research, now, beyond };
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


function renderHome(data) {
  const container = document.getElementById('home-section');
  if (!container) return;

  const keywords = Array.isArray(data.profile?.keywords) && data.profile.keywords.length
    ? `<div class="profile-keywords">${data.profile.keywords.map(kw => {
        const label = typeof kw === 'string' ? kw : kw.label;
        const tooltip = typeof kw === 'object' && kw.tooltip ? kw.tooltip : '';
        const tooltipAttr = tooltip ? ` data-tooltip="${tooltip.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}"` : '';
        return `<span class="keyword-badge"${tooltipAttr}>${label}</span>`;
      }).join('')}</div>`
    : '';

  const ctaHtml = Array.isArray(data.cta) && data.cta.length
    ? `<div class="hero-cta">${data.cta.map(c => `<a href="${c.href}" class="cta-btn">${c.label}</a>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <div class="hero">
      <img src="${data.profile.img}" alt="${data.profile.name}" class="profile-img">
      ${data.eyebrow ? `<p class="hero-eyebrow">${data.eyebrow}</p>` : ''}
      <h2 class="profile-name">${data.profile.name}</h2>
      ${keywords}
      ${data.headline ? `<p class="hero-headline">${data.headline}</p>` : ''}
      ${data.hero_summary ? `<p class="hero-summary">${data.hero_summary}</p>` : ''}
      ${ctaHtml}
    </div>
  `;
}

function renderNow(data) {
  const updatedEl = document.getElementById('now-updated');
  const list = document.getElementById('now-list');
  if (!list) return;

  if (updatedEl && data.updated) {
    updatedEl.textContent = `Updated: ${data.updated}`;
  }

  list.innerHTML = (data.items || []).map(item => {
    if (item.type === 'reading') {
      return `
        <div class="card now-card now-reading">
          <div class="now-card-header">
            <span class="now-type-badge">Reading</span>
            <h3>${item.title}</h3>
          </div>
          ${item.note ? `<p class="now-note">${item.note}</p>` : ''}
        </div>
      `;
    }

    const statusLabel = item.status
      ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
      : '';

    return `
      <div class="card now-card">
        <div class="now-card-header">
          <span class="now-type-badge now-type-${item.type}">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
          ${statusLabel ? `<span class="now-status now-status-${item.status}">${statusLabel}</span>` : ''}
        </div>
        <h3>${item.title}</h3>
        ${item.one_liner ? `<p class="now-one-liner">${item.one_liner}</p>` : ''}
        ${item.current_focus ? `<p class="now-focus">${item.current_focus}</p>` : ''}
        ${item.link ? `<a href="${item.link}" class="now-link" target="_blank" rel="noopener noreferrer">Learn more →</a>` : ''}
      </div>
    `;
  }).join('');
}

function renderEducation(data) {
  const list = document.getElementById('education-list');
  if (!list) return;

  const renderEducationCard = (item, { hideDegreeChip = false } = {}) => {
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
          ${degreeLabel && !hideDegreeChip ? `<span class="degree-chip">${degreeLabel}</span>` : ''}
        </div>
        ${metaBlock}
        ${item.degree ? `<p class="degree-detail">${item.degree}</p>` : ''}
        ${buildEducationDetailsMarkup(item)}
      </div>
    `;
  };

  const isExchangeItem = item => {
    const school = (item.school || '').toLowerCase();
    const period = (item.period || '').toLowerCase();
    return period.includes('exchange student')
      || school.includes('warsaw university of technology')
      || school.includes('university of california, berkeley');
  };

  const mainItems = (data.main || []).filter(item => !isExchangeItem(item));
  const exchangeItems = (data.main || []).filter(isExchangeItem);

  let html = mainItems.map(renderEducationCard).join('');

  const renderTopicSection = ({
    title,
    bodyClassName,
    listClassName,
    itemsMarkup,
    defaultOpen = false
  }) => `
    <div class="education-topic">
      <button class="education-topic-toggle" type="button" aria-expanded="${defaultOpen ? 'true' : 'false'}">
        <span class="education-topic-label">${title}</span>
        <span class="education-topic-icon" aria-hidden="true">
          <i class="fas fa-chevron-down"></i>
        </span>
      </button>
      <div class="education-topic-body ${bodyClassName}" data-state="${defaultOpen ? 'open' : 'collapsed'}" data-default-open="${defaultOpen ? 'true' : 'false'}">
        <div class="${listClassName}">${itemsMarkup}</div>
      </div>
    </div>
  `;

  if (exchangeItems.length) {
    html += renderTopicSection({
      title: 'Exchange Student',
      bodyClassName: 'education-topic-body-cards',
      listClassName: 'education-topic-card-list',
      itemsMarkup: exchangeItems.map(item => renderEducationCard(item, { hideDegreeChip: true })).join(''),
      defaultOpen: true
    });
  }

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

    html += renderTopicSection({
      title: 'Extracurricular',
      bodyClassName: 'education-topic-body-list',
      listClassName: 'extracurricular-list',
      itemsMarkup: extracurricularItems,
      defaultOpen: false
    });
  }

  list.innerHTML = html;
}

function bindEducationAccordion() {
  const list = document.getElementById('education-list');
  if (!list) return;

  const topics = Array.from(list.querySelectorAll('.education-topic'));
  if (!topics.length) return;

  if (appState.educationAccordionCleanup) {
    appState.educationAccordionCleanup();
    appState.educationAccordionCleanup = null;
  }

  const resizeHandlers = [];

  topics.forEach(topic => {
    const toggle = topic.querySelector('.education-topic-toggle');
    const panel = topic.querySelector('.education-topic-body');
    if (!toggle || !panel) return;

    const setOpen = isOpen => {
      panel.dataset.state = isOpen ? 'open' : 'collapsed';
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '0px';
    };

    setOpen(panel.dataset.defaultOpen === 'true');

    toggle.addEventListener('click', () => {
      const isOpen = panel.dataset.state === 'open';
      setOpen(!isOpen);
    });

    resizeHandlers.push(() => {
      if (panel.dataset.state === 'open') {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

  const onResize = () => resizeHandlers.forEach(h => h());
  window.addEventListener('resize', onResize, { passive: true });
  appState.educationAccordionCleanup = () => window.removeEventListener('resize', onResize);
}

function renderProjects(data) {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  grid.innerHTML = data.map(project => {
    const stackHtml = Array.isArray(project.stack) && project.stack.length
      ? `<div class="project-stack">${project.stack.map(s => `<span class="stack-badge">${s}</span>`).join('')}</div>`
      : '';

    const links = project.links || {};
    const linksHtml = Object.entries(links)
      .filter(([, url]) => url)
      .map(([key, url]) => `<a href="${url}" class="project-link" target="_blank" rel="noopener noreferrer">${key}</a>`)
      .join('');

    const statusBadge = project.status
      ? `<span class="project-status project-status-${project.status}">${project.status}</span>`
      : '';

    return `
      <div class="card project-card">
        <div class="project-title-section">
          <div class="project-title-row">
            <h3>${project.title}</h3>
            ${statusBadge}
          </div>
          ${project.role ? `<p class="project-role">${project.role}</p>` : ''}
          ${project.one_liner ? `<p class="project-one-liner">${project.one_liner}</p>` : ''}
        </div>
        <div class="project-content">
          ${project.images ? `<img class="project-img" src="${project.images}" alt="${project.title}">` : ''}
          <div class="project-text-content">
            ${project.problem ? `<div class="project-field"><span class="project-field-label">Problem</span><p>${project.problem}</p></div>` : ''}
            ${project.approach ? `<div class="project-field"><span class="project-field-label">Approach</span><p>${project.approach}</p></div>` : ''}
            ${project.why_it_matters ? `<div class="project-field"><span class="project-field-label">Why it matters</span><p>${project.why_it_matters}</p></div>` : ''}
            ${stackHtml}
            ${linksHtml ? `<div class="project-links">${linksHtml}</div>` : ''}
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
  const featuredContainer = document.getElementById('research-featured');
  const featuredPanel = document.getElementById('research-featured-panel');
  if (featuredContainer) {
    const featuredPubs = (data.publications || []).filter(p => p.featured);
    if (featuredPubs.length) {
      featuredContainer.innerHTML = featuredPubs.map(pub => `
        <div class="research-featured-card">
          ${pub.driving_question ? `<p class="research-question">${pub.driving_question}</p>` : ''}
          ${pub.key_finding ? `<p class="research-finding">${pub.key_finding}</p>` : ''}
          ${pub.title ? `<p class="research-featured-title">Check out ${pub.link ? `<a href="${pub.link}" target="_blank" rel="noopener noreferrer"><em>"${pub.title}"</em></a>` : `<em>"${pub.title}"</em>`}</p>` : ''}
        </div>
      `).join('');
      if (featuredPanel) featuredPanel.style.display = '';
    }
  }

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


async function populateBeyondGallery(containerId, mediaFiles, allowVideos) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const entries = (mediaFiles || [])
    .filter(Boolean)
    .map(filename => ({ link: filename, filename }))
    .filter(item => {
      const extension = getExtension(item.filename);
      if (IMAGE_EXTENSIONS.has(extension)) return true;
      if (allowVideos && VIDEO_EXTENSIONS.has(extension)) return true;
      return false;
    });

  const mixedEntries = mixMediaByType(entries);
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
}

async function renderBeyond(data) {
  const introEl = document.getElementById('beyond-intro');
  const galleryEl = document.getElementById('beyond-gallery');
  if (!galleryEl) return;

  if (introEl && data.intro) {
    introEl.innerHTML = `${data.intro}${data.quote ? `<br><br>${data.quote}` : ''}`;
  }

  galleryEl.innerHTML = (data.sections || []).map(section => `
    <div class="beyond-section">
      <h3 class="beyond-section-label">${section.label}</h3>
      <div id="beyond-gallery-${section.id}" class="media-grid media-masonry"></div>
    </div>
  `).join('');

  await Promise.all((data.sections || []).map(section =>
    populateBeyondGallery(
      `beyond-gallery-${section.id}`,
      section.media,
      section.id === 'crossfit'
    )
  ));
}

async function renderAppContent(data) {
  renderHome(data.home);
  renderEducation(data.education);
  renderProjects(data.projects);
  renderTeaching(data.teaching);
  renderResearch(data.research);
  await renderBeyond(data.beyond);
  bindEducationAccordion();
  setupKeywordTooltips();
}

function setupKeywordTooltips() {
  const badges = Array.from(document.querySelectorAll('.keyword-badge[data-tooltip]'));
  if (!badges.length) return;

  let activeIndex = 0;

  /* ── Build DOM ── */
  const overlay = document.createElement('div');
  overlay.className = 'keyword-overlay';

  const backBtn = document.createElement('button');
  backBtn.className = 'keyword-overlay-back back-button';
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';

  const carousel = document.createElement('div');
  carousel.className = 'keyword-carousel';

  const track = document.createElement('div');
  track.className = 'keyword-carousel-track';

  const dotsEl = document.createElement('div');
  dotsEl.className = 'keyword-dots';

  badges.forEach((badge, i) => {
    const card = document.createElement('div');
    card.className = 'keyword-card';
    card.innerHTML = `
      <span class="keyword-card-label">${badge.textContent.trim()}</span>
      <p class="keyword-card-desc">${badge.dataset.tooltip}</p>
    `;
    track.appendChild(card);

    const dot = document.createElement('span');
    dot.className = 'keyword-dot';
    dotsEl.appendChild(dot);
  });

  carousel.appendChild(track);
  overlay.appendChild(backBtn);
  overlay.appendChild(carousel);
  overlay.appendChild(dotsEl);
  document.body.appendChild(overlay);

  const cards  = Array.from(track.children);
  const dotEls = Array.from(dotsEl.children);
  const MAX_CARD_W = 480;

  // Click on a peeking card to navigate to it
  cards.forEach((card, i) => {
    card.addEventListener('click', () => { if (i !== activeIndex) goTo(i); });
  });

  /* ── Position & slide ──
   * Cards are position:absolute within the track.
   * Active card: centered. Adjacent cards: peeking `peek` px at each edge.
   * step = (cw + cardW) / 2 - peek
   * card[i].left = (cw - cardW) / 2 + (i - activeIndex) * step
   */
  function goTo(index) {
    activeIndex = Math.max(0, Math.min(index, badges.length - 1));
    const cw = overlay.getBoundingClientRect().width;
    if (cw <= 0) return;
    const peek  = Math.min(60, cw * 0.12);
    const cardW = Math.min(MAX_CARD_W, cw - 2 * peek - 20);
    const gap   = (cw - cardW) / 2 - peek;

    cards.forEach(c => { c.style.width = `${cardW}px`; });
    track.style.gap = `${gap}px`;

    const offset = cw / 2 - cardW / 2 - activeIndex * (cardW + gap);
    track.style.transform = `translateX(${offset}px)`;
    cards.forEach((c, i) => c.classList.toggle('active', i === activeIndex));
    dotEls.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
  }

  function positionOverlay() {
    overlay.style.left   = '0';
    overlay.style.top    = '0';
    overlay.style.width  = '100vw';
    overlay.style.height = '100vh';
  }

  function showOverlay(index) {
    const wasVisible = overlay.classList.contains('visible');
    positionOverlay();
    overlay.classList.add('visible');
    if (dotNav) dotNav.classList.add('behind-overlay');
    if (!wasVisible) {
      track.style.transition = 'none';
      requestAnimationFrame(() => {
        goTo(index);
        requestAnimationFrame(() => { track.style.transition = ''; });
      });
    } else {
      goTo(index);
    }
  }

  /* ── Events ── */
  const dotNav = document.querySelector('.dot-nav');

  function hideOverlay() {
    overlay.classList.remove('visible');
    if (dotNav) dotNav.classList.remove('behind-overlay');
  }

  backBtn.addEventListener('click', hideOverlay);

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('visible')) return;
    if (e.key === 'ArrowRight') goTo(activeIndex + 1);
    else if (e.key === 'ArrowLeft')  goTo(activeIndex - 1);
    else if (e.key === 'Escape')     hideOverlay();
  });

  // Touch swipe
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? goTo(activeIndex + 1) : goTo(activeIndex - 1);
  });

  badges.forEach((badge, i) => {
    badge.addEventListener('click', () => showOverlay(i));
  });
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

  if (!contentArea || !content || !usesNestedScrollContainer()) {
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

  scrollTarget.addEventListener('scroll', scheduleRevealEvaluation, { passive: true });
  window.addEventListener('resize', scheduleRevealEvaluation, { passive: true });

  appState.revealCleanup = () => {
    scrollTarget.removeEventListener('scroll', scheduleRevealEvaluation);
    window.removeEventListener('resize', scheduleRevealEvaluation);
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
  if (!targets.length) return;
  bindRevealFallback();

  const newTargets = targets.filter(target => !target.classList.contains('reveal-item'));
  newTargets.forEach((target, index) => {
    target.classList.add('reveal-item');
    target.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
  });

  if (newTargets.length && newTargets[0]) {
    void newTargets[0].offsetHeight;
  }

  scheduleRevealEvaluation();
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
    clearTimeout(appState.resizeTimerId);
    appState.resizeTimerId = setTimeout(refreshResponsiveEffects, 150);
  }, { passive: true });

  appState.resizeBound = true;
}

/* -------------------------------------------------------------------------- */
/* Page Transitions                                                           */
/* -------------------------------------------------------------------------- */

function schedulePostTransitionRefresh() {
  waitForDomMount().then(refreshResponsiveEffects);
}

/* -------------------------------------------------------------------------- */
/* Bootstrap                                                                  */
/* -------------------------------------------------------------------------- */

async function init() {
  initThemeToggle();
  initSpotlight();
  bindResizeHandler();

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
