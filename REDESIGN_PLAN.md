# HisKim1.github.io — 개편 계획서

> **목표:** "함께 연구하고 싶은 대학원생" — 학문적 깊이와 인간적 온기를 동시에 전달하는 연구자 홈페이지
> **원칙:** UX 흐름 재설계 + 코드 확장성 확보, CSS/디자인은 최대한 유지

---

## 0. 현재 구조 진단

### 0-1. 정보 구조 문제

```
현재 섹션 순서:
Education → Publications/Conferences/Experience → Teaching → Projects
```

이건 채용 이력서 목차다. 방문자(교수, 공동연구자, 동료 대학원생)가 실제로 궁금한 순서가 아니다.

```
방문자가 실제로 궁금한 순서:
이 사람이 뭘 연구하는가 → 지금 뭘 만들고 있는가 → 같이 하면 어떤 사람인가 → 배경/스펙
```

### 0-2. 코드 구조 문제

현재 `js/main.js` 하나에 렌더링 + UI + 애니메이션이 전부 섞여 있다.
섹션이 늘거나 JSON 스키마가 바뀌면 `main.js` 전체를 건드려야 한다.

### 0-3. 콘텐츠 문제

| 현재 | 문제 |
|------|------|
| keyword badge → overlay로 철학 숨김 | 가장 좋은 문장이 클릭해야만 보임 |
| fun-fact가 별도 hidden 페이지 | 친근함이 메인 흐름에서 단절됨 |
| Projects가 "currently preparing" 수준 | 연구자가 아닌 학생처럼 보임 |
| Publications가 APA 리스트만 | 연구 관점과 질문이 없음 |
| Hero가 이름 + 학적 나열 | 첫인상이 없음 |

---

## 1. 새로운 정보 구조

### 1-1. 섹션 순서 재배열

```
[새 순서]
Hero (sidebar 고정)
↓
Now          ← NEW: 지금 뭘 하고 있는지 (연구 현황)
↓
Research     ← 기존 Publications/Conferences를 재구성
↓
Projects     ← Case-study 형식으로 재작성
↓
Teaching     ← 한 문단 추가
↓
Background   ← 기존 Education을 축소·흡수
↓
Beyond Lab   ← 기존 fun-fact를 메인 스트림으로 편입
```

### 1-2. dot-nav 변경

```html
<!-- 현재 -->
Education / Research / Teaching / Projects

<!-- 변경 후 -->
Now / Research / Projects / Teaching / About
```

---

## 2. 파일별 변경 계획

### 2-1. `data/` 스키마 재설계

#### 신규: `data/now.json`

```json
{
  "headline": "What I'm working on right now",
  "updated": "2025-06",
  "items": [
    {
      "type": "research",
      "title": "GraphLatentCast",
      "status": "active",
      "one_liner": "Why do graph-based weather models produce geometrically distorted forecasts?",
      "current_focus": "Manifold trajectory analysis of latent space curvature in GenCast",
      "collaborators": [],
      "link": ""
    },
    {
      "type": "reading",
      "title": "Paper I'm currently digesting",
      "note": "선택적으로 읽고 있는 논문 한 편 메모"
    }
  ]
}
```

> **Why:** "지금 이 사람이 살아있다"는 신호를 가장 먼저 보낸다.
> 방문자가 느끼는 건 "이 사람은 지금 이 문제에 꽂혀 있구나"다.

---

#### 수정: `data/home.json`

```json
// 추가할 필드
{
  "eyebrow": "Atmospheric Science × Trustworthy AI",
  "headline": "I study how deep learning weather models fail — and what the geometry of that failure looks like.",
  "hero_summary": "기상 예측은 보편 서비스다. 나는 AI 모델이 정확해 보이면서도 물리적으로 틀릴 수 있다는 걸 latent space의 기하학적 구조로 이해하고 싶다.",
  "cta": [
    { "label": "See my research", "href": "#research" },
    { "label": "Get in touch", "href": "mailto:tomm1203@gm.gist.ac.kr" }
  ]
  // 기존 keywords, paragraphs는 유지
}
```

> **Why:** keyword overlay에 숨어있던 철학을 첫 화면에 노출한다.
> eyebrow + headline + 2줄 요약이 세트로 나와야 "관점이 있는 연구자"로 보인다.

---

#### 수정: `data/research.json`

```json
// 기존 publications 배열 각 항목에 추가
{
  "featured": true,             // NEW: featured 카드 여부
  "driving_question": "Do diffusion-based ensembles reproduce physically realistic error growth?",
  "key_finding": "Good forecast skill ≠ physically coherent uncertainty across scales.",
  // 기존 title, authors, venue, year 유지
}
```

> **Why:** Publications 위에 featured research 카드 1~2개를 뽑아내기 위해.
> 리스트만 있으면 참고문헌처럼 보인다. 질문이 붙으면 연구처럼 보인다.

---

#### 수정: `data/projects.json`

```json
// 기존 항목을 case-study 구조로 확장
{
  "title": "GraphLatentCast",
  "role": "Lead researcher",
  "one_liner": "Identifying geometric distortion mechanisms in graph-based weather model latent spaces.",
  "problem": "Graph neural network weather models like GenCast produce blurry forecasts. The cause isn't just the loss function — it may be a geometric property of how the latent manifold evolves.",
  "approach": "Manifold trajectory analysis: curvature, intrinsic dimension, and off-manifold projection across forecast lead times.",
  "why_it_matters": "If we can locate where the geometry breaks down, we can intervene — not just retrain.",
  "status": "active",
  "stack": ["PyTorch", "PyG", "GenCast", "ERA5"],
  "links": { "code": "", "poster": "", "paper": "" }
  // 기존 썸네일 이미지 필드 유지
}
```

---

#### 수정: `data/teaching.json`

```json
// 각 항목에 추가
{
  "teaching_note": "I try to show structure first, then technique. Abstract ideas feel less intimidating when you see the skeleton first."
  // 기존 course, role, term 유지
}
```

---

#### 신규: `data/beyond.json` (기존 media.json 대체 or 병합)

```json
{
  "intro": "CrossFit teaches me to keep moving when I'm exhausted. Dance teaches me that precision and rhythm aren't opposites. Both shape how I do research.",
  "sections": [
    {
      "id": "crossfit",
      "label": "💪 CrossFit",
      "media": []   // 기존 media.json crossfit 배열 이동
    },
    {
      "id": "dance",
      "label": "💃 Dance",
      "media": []   // 기존 media.json dance 배열 이동
    }
  ]
}
```

> **Why:** `media.json`은 파일 목록만 있고 문맥이 없다.
> 한 문장의 intro만 추가해도 취미가 "연구자의 결"을 보여주는 장치가 된다.

---

### 2-2. `index.html` 변경

#### 섹션 추가 및 순서 변경

```html
<!-- 현재 main 내부 순서 -->
<section id="education">
<section id="research">
<section id="teaching">
<section id="projects">

<!-- 변경 후 -->
<section id="now">          <!-- NEW -->
<section id="research">     <!-- featured card 추가 -->
<section id="projects">     <!-- 순서 앞으로 -->
<section id="teaching">
<section id="background">   <!-- education → background로 rename -->
<section id="beyond-lab">   <!-- fun-fact를 메인으로 편입, hidden 제거 -->
```

#### sidebar home-section에 hero 요소 추가

```html
<!-- 현재 -->
<div id="home-section"></div>

<!-- 변경 후: JS 렌더러가 eyebrow/headline/cta를 여기 주입 -->
<div id="home-section">
  <p id="hero-eyebrow" class="hero-eyebrow"></p>
  <h1 id="hero-headline" class="hero-headline"></h1>
  <p id="hero-summary" class="hero-summary"></p>
  <div id="hero-cta" class="hero-cta"></div>
</div>
```

#### dot-nav 변경

```html
<!-- 변경 후 -->
<a class="dot-item" data-section="now">Now</a>
<a class="dot-item" data-section="research">Research</a>
<a class="dot-item" data-section="projects">Projects</a>
<a class="dot-item" data-section="teaching">Teaching</a>
<a class="dot-item" data-section="background">About</a>
```

#### fun-fact → beyond-lab 인라인 편입

```html
<!-- 현재: style="display:none" hidden 페이지 -->
<section id="fun-fact" class="fun-fact-page" style="display: none;">

<!-- 변경 후: content-scroll-body 안에 일반 섹션으로 -->
<section id="beyond-lab" aria-label="Beyond the Lab">
  <div class="section-glass-panel">
    <h2>Beyond the Lab</h2>
    <p id="beyond-intro"></p>
    <div id="beyond-gallery"></div>
  </div>
</section>
```

> `showFunFactPage()` / `showMainPage()` 함수 및 Back 버튼 제거.

---

### 2-3. `js/main.js` 리팩터링

#### 현재 구조 문제

```
main.js (단일 파일)
├── fetch + render 로직 (renderHome, renderEducation, ...)
├── UI 로직 (theme toggle, dot nav, keyword overlay)
└── 애니메이션 (Lenis, IntersectionObserver)
```

콘텐츠 수정 시 렌더 함수를 찾으러 UI/애니메이션 코드를 함께 헤쳐야 한다.

#### 제안 구조

```
js/
├── main.js          ← 진입점만 (init 호출, 순서 조율)
├── render/
│   ├── home.js      ← renderHome() (hero eyebrow/headline/cta 포함)
│   ├── now.js       ← renderNow()  ← NEW
│   ├── research.js  ← renderResearch() (featured card + list)
│   ├── projects.js  ← renderProjects() (case-study 카드)
│   ├── teaching.js  ← renderTeaching()
│   ├── background.js← renderBackground() (기존 education)
│   └── beyond.js    ← renderBeyond() (기존 fun-fact gallery)
└── ui/
    ├── theme.js     ← theme toggle
    ├── nav.js       ← dot nav + scroll active state
    ├── reveal.js    ← IntersectionObserver scroll reveal
    └── overlay.js   ← keyword badge overlay (기존 setupKeywordTooltips)
```

> **점진적 마이그레이션 가능:** 한 번에 다 안 옮겨도 된다.
> `main.js`에서 `import`만 바꾸면 되므로, 섹션 하나씩 분리해도 동작한다.

#### `main.js` 최종 형태 (목표)

```js
import { renderHome }       from './render/home.js';
import { renderNow }        from './render/now.js';
import { renderResearch }   from './render/research.js';
import { renderProjects }   from './render/projects.js';
import { renderTeaching }   from './render/teaching.js';
import { renderBackground } from './render/background.js';
import { renderBeyond }     from './render/beyond.js';

import { initTheme }   from './ui/theme.js';
import { initNav }     from './ui/nav.js';
import { initReveal }  from './ui/reveal.js';
import { initOverlay } from './ui/overlay.js';

async function init() {
  await Promise.all([
    renderHome(),
    renderNow(),
    renderResearch(),
    renderProjects(),
    renderTeaching(),
    renderBackground(),
    renderBeyond(),
  ]);
  initTheme();
  initNav();
  initReveal();
  initOverlay();
}

document.addEventListener('DOMContentLoaded', init);
```

> **주의:** ES module import를 쓰려면 `index.html`에서
> `<script src="js/main.js" type="module">` 로 변경 필요.

---

## 3. 카피라이팅 방향

### Hero headline 원칙

| 피해야 할 톤 | 권장 톤 |
|---|---|
| "I am a passionate researcher..." | 문제 중심 한 문장 |
| "I have always been fascinated by..." | 현재형, 능동태 |
| 형용사 남발 | 동사 중심 |

**제안 headline 후보:**

```
"I study how deep learning weather models fail —
 and what the geometry of that failure tells us."

"When an AI forecast looks right, is it actually
 behaving like the atmosphere? That's my question."

"I stare at latent spaces until they confess
 something about the atmosphere."
```

### Beyond the Lab intro 예시

```
CrossFit teaches me to keep moving under load.
Dance teaches me that precision and rhythm aren't opposites.
Both remind me that good work takes time to feel natural.
```

### Teaching note 예시

```
I try to show structure before technique.
When students see the skeleton of an idea first,
the math feels less like a wall.
```

---

## 4. 작업 우선순위 (Claude Code에게 전달할 순서)

### Phase 1 — 콘텐츠 레이어 (JSON만 수정, 코드 변경 없음)

1. `data/home.json`에 `eyebrow`, `headline`, `hero_summary`, `cta` 추가
2. `data/research.json` 각 항목에 `driving_question`, `key_finding`, `featured` 추가
3. `data/projects.json`을 case-study 구조로 재작성
4. `data/now.json` 신규 생성
5. `data/beyond.json` 신규 생성 (media.json 내용 흡수)

### Phase 2 — 구조 레이어 (index.html 수정)

1. `fun-fact` hidden 섹션 → `beyond-lab` 인라인 섹션으로 교체
2. `education` → `background` 섹션으로 rename
3. `now` 섹션 추가 (research 위에)
4. 섹션 순서: now → research → projects → teaching → background → beyond-lab
5. dot-nav 업데이트
6. sidebar `home-section`에 hero placeholder 추가

### Phase 3 — 렌더링 레이어 (main.js 수정)

1. `renderHome()`에 eyebrow/headline/cta 렌더링 추가
2. `renderNow()` 신규 작성
3. `renderResearch()`에 featured card 렌더링 추가
4. `renderProjects()`를 case-study 카드 형식으로 수정
5. `renderBeyond()` 신규 작성, `showFunFactPage()` 제거
6. dot-nav 레이블 업데이트

### Phase 4 — 코드 구조 레이어 (선택적, 장기)

1. `js/render/` 디렉터리 분리
2. `js/ui/` 디렉터리 분리
3. `index.html` script 태그 `type="module"` 추가

---

## 5. Claude Code에게 전달할 프롬프트

```
내 GitHub Pages 홈페이지(HisKim1/HisKim1.github.io)를 개편하려 해.
목표는 "함께 연구하고 싶은 대학원생"처럼 보이는 것 — 학문적 깊이 + 인간적 온기.
기술 스택은 순수 HTML/CSS/Vanilla JS + JSON 데이터 구조이고, 빌드 시스템은 없어.
REDESIGN_PLAN.md를 참고해서 Phase 1부터 순서대로 진행해줘.

시작 전에 다음을 확인해줘:
1. data/home.json 현재 스키마
2. data/research.json 현재 구조
3. data/projects.json 현재 구조
4. js/main.js의 renderHome, renderResearch, renderProjects 함수 시그니처

각 Phase가 끝날 때마다 변경 사항 요약해줘.
Phase 간에 로컬 서버(python3 -m http.server 8080)로 확인 포인트도 알려줘.
```

---

## 6. 변경하지 않는 것

- CSS 디자인 전체 (color, typography, glass-panel, animation)
- Lenis smooth scroll
- keyword badge overlay (home.json keywords 유지)
- theme toggle (dark/light)
- 반응형 레이아웃 구조 (sidebar | content | dot-nav)
- 기존 social links (email, GitHub, LinkedIn, Instagram)
- `autotester.py` (사이트와 무관)

---

*마지막 업데이트: 2026-03-29*
