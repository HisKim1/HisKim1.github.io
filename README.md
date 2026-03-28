# Hisu Kim Portfolio

이 저장소는 GitHub Pages로 배포되는 단일 페이지 포트폴리오 사이트입니다.
현재 활성 엔트리 포인트는 `index.html` 하나이며, 주요 콘텐츠는 `data/*.json`에서 읽고 `js/main.js`가 DOM을 렌더링합니다.

## 현재 구조

```text
.
├── index.html
├── README.md
├── CLAUDE.md
├── autotester.py
├── css/
│   ├── style.css
│   └── research.css
├── data/
│   ├── home.json
│   ├── education.json
│   ├── projects.json
│   ├── teaching.json
│   ├── research.json
│   └── media.json
├── images/
│   └── 포트폴리오 이미지 / 동영상 에셋
├── js/
│   └── main.js
├── pages/        # 현재 비어 있음
└── snippets/     # 현재 비어 있음
```

## 파일 관계

### 1. 진입점

- `index.html`
  - 사이트의 유일한 HTML 엔트리 포인트
  - 테마 초기값을 인라인 스크립트로 먼저 적용
  - `css/style.css`, Font Awesome, Lenis CDN, `js/main.js`를 로드
  - `#content-area`, `#fun-fact`, dot navigation (`.layout` 내부 flex 컬럼), theme toggle 등의 기본 골격을 가짐

### 2. 스타일 계층

- `css/style.css`
  - 전체 레이아웃, 테마, 카드 UI, 반응형 타이포, 스크롤바, reveal/hover 애니메이션 담당
  - 포트폴리오의 메인 스타일 파일
- `css/research.css`
  - publication / conference / APA list 관련 보조 스타일
  - `style.css` 상단에서 `@import`로 포함됨

### 3. 데이터 계층

- `data/home.json`
  - 좌측 프로필 영역의 이름, 프로필 이미지, 키워드, 자기소개 문단
- `data/education.json`
  - 학력 카드와 extracurricular accordion 데이터
- `data/projects.json`
  - 프로젝트 카드 데이터
- `data/teaching.json`
  - teaching 카드 데이터
- `data/research.json`
  - publications, conferences, experience 데이터
- `data/media.json`
  - Fun Fact 페이지의 CrossFit / Dance 갤러리에서 사용할 이미지/비디오 파일명 목록

### 4. 렌더링 / 동작 계층

- `js/main.js`
  - 사이트의 메인 애플리케이션 스크립트
  - 역할이 다음 3개로 나뉨
    - Data Fetching & Rendering
    - UI Interactions
    - Animations & Scrolling
  - `data/*.json` fetch
  - `render*` 함수로 DOM 생성 (진입점: `renderAppContent`)
  - theme toggle, dot nav, keyword overlay, fun fact page 전환 처리
  - Lenis 초기화
  - IntersectionObserver 기반 scroll reveal 초기화

### 5. 정적 에셋

- `images/`
  - 프로필 이미지
  - 프로젝트 썸네일
  - Fun Fact 갤러리 이미지 / 비디오
  - `data/media.json`와 직접 연결됨

### 6. 기타 파일

- `autotester.py`
  - GPU 모니터링용 SSH 스크립트 (사이트와 무관)
- `CLAUDE.md`
  - Claude Code 작업 가이드 문서
- `pages/`, `snippets/`
  - 현재 비어 있으며 사이트 렌더링 경로에서 사용되지 않음

## 실제 렌더링 흐름

1. `index.html`이 기본 레이아웃과 mount target을 만든다.
2. `js/main.js`가 `data/*.json`을 읽는다.
3. 각 섹션별 렌더 함수가 `innerHTML`로 카드와 리스트를 생성한다.
4. DOM 생성이 끝난 뒤 Lenis, scroll reveal, dot nav, scroll background를 초기화한다.
5. 사용자가 theme toggle / dot nav / fun fact page를 조작하면 `main.js`가 UI 상태를 갱신한다.

## 수정 가이드

### 콘텐츠만 수정할 때

- 프로필 / 소개: `data/home.json`
- 학력 / extracurricular: `data/education.json`
- 프로젝트: `data/projects.json`
- teaching: `data/teaching.json`
- research / publication / experience: `data/research.json`
- Fun Fact 갤러리 목록: `data/media.json`
- 실제 미디어 파일: `images/`

### UI/레이아웃을 수정할 때

- HTML 구조: `index.html`
- 스타일: `css/style.css`, `css/research.css`
- 동작/애니메이션/렌더링: `js/main.js`

## 앞으로 참고할 핵심 포인트

- 빌드 시스템 없음. `python3 -m http.server 8080` 또는 `npx serve .`로 로컬 미리보기 (fetch() 때문에 file:// 불가).
- 콘텐츠 수정은 `data/*.json`만 건드리면 됨. JS 렌더러가 자동으로 반영.
- 레이아웃은 `sidebar | content-area | dot-nav` 3열 flex 구조 (`dot-nav`는 `position: fixed` 아님).
- keyword badge 클릭 시 전체 화면 오버레이(carousel) 표시 — `setupKeywordTooltips()`가 담당.
- project 카드는 container query 기반으로 460px 이하에서 세로 레이아웃으로 전환.
- Exchange Student 토글 하위 카드는 degree chip을 렌더링하지 않음 (`hideDegreeChip` 옵션).
- UI 버그 디버깅 순서: `index.html` mount target → `js/main.js` 렌더 함수 → `css/style.css` 클래스.
