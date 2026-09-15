# 모여타 Frontend

Next.js App Router, React, TypeScript, Tailwind CSS 기반의 프론트엔드 시작점입니다.

## 시작하기

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다. API 기본 주소는
`NEXT_PUBLIC_API_BASE_URL`로 설정합니다.

GA4는 `NEXT_PUBLIC_GA_ID`, Sentry는 `NEXT_PUBLIC_SENTRY_DSN`(브라우저)과 `SENTRY_DSN`(서버)을
`.env.local`에 설정하면 활성화됩니다. 값이 비어 있으면 SDK가 초기화되지 않습니다. Sentry 운영
소스맵 업로드가 필요할 때만 `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`를 추가합니다.

## 프로젝트 구조

```text
app/          # Next.js App Router 라우트, special files, 전역 CSS
src/
├── _app/      # FSD app 레이어: 전역 Provider와 앱 초기화
├── _pages/    # FSD pages 레이어: 화면 단위 slice
├── widgets/   # 여러 기능을 조합한 화면 블록
├── features/  # 사용자 행동 단위 기능
├── entities/  # 도메인 객체
└── shared/    # 공통 UI, API, 타입, 유틸리티, 클라이언트 스토어
```

Next.js의 예약 폴더와 FSD 레이어 이름이 충돌하지 않도록 Next 라우팅 폴더는 프로젝트 루트의
`app/`에 두고, FSD의 `app`, `pages` 레이어는 각각 `_app`, `_pages`로 구성합니다.

서버 상태는 `src/shared/api`의 query factory를 통해 TanStack Query로 관리하고, 전역 클라이언트
상태는 Zustand에서 관리합니다. Base UI primitive는 `src/shared/ui`에서 프로젝트 스타일과 함께
조합합니다.

## 주요 명령어

| 명령어              | 설명                  |
| ------------------- | --------------------- |
| `pnpm dev`          | 개발 서버 실행        |
| `pnpm build`        | 프로덕션 빌드         |
| `pnpm typecheck`    | TypeScript 타입 검사  |
| `pnpm lint`         | Oxlint 정적 분석      |
| `pnpm format`       | Oxfmt 포맷팅          |
| `pnpm format:check` | 포맷 검사             |
| `pnpm test`         | Vitest 단위 테스트    |
| `pnpm test:e2e`     | Playwright E2E 테스트 |
| `pnpm storybook`    | Storybook 실행        |

MSW 브라우저 워커가 필요할 때는 다음 명령을 한 번 실행합니다.

```bash
pnpm exec msw init public/ --save
```

## 브라우저 지원

모여타의 브라우저 지원 및 QA 기준은 [`browser-support-scope.md`](./browser-support-scope.md)를 따릅니다.
