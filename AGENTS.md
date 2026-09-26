# AGENTS.md

## 프로젝트 개요

모여타 프론트엔드 프로젝트입니다.

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Feature-Sliced Design
- TanStack Query
- Zustand
- Vitest
- Playwright
- Storybook

패키지 매니저는 pnpm만 사용합니다.

## 주요 디렉터리

```text
app/          # Next.js 라우팅, layout, special files, 전역 CSS
src/_app/     # 전역 Provider와 앱 초기화
src/_pages/   # 라우트 단위 화면
src/features/ # 사용자 행동과 비즈니스 기능
src/entities/ # 안정적인 도메인 객체
src/shared/   # 공통 UI, API, 타입, 유틸리티
tests/        # 테스트
```

`app/`은 Next.js 라우팅 용도로만 사용합니다.
재사용 가능한 화면 구현은 `src/`의 FSD 레이어에 둡니다.

## FSD 의존성 규칙

의존성 방향은 아래 방향만 허용합니다.

```text
_app → _pages → features → entities → shared
```

- 상위 레이어가 하위 레이어를 import할 수 있습니다.
- 하위 레이어가 상위 레이어를 import하면 안 됩니다.
- 같은 레이어의 다른 slice를 직접 import하지 않습니다.
- 순환 의존성을 만들지 않습니다.
- `src/widgets/` 레이어는 사용하지 않으며, 새 코드를 배치하지 않습니다.
- 공통 코드라는 이유만으로 무조건 `shared`에 넣지 않습니다.
- 실제 도메인 개념은 `entities`에 둡니다.
- 사용자 행동과 비즈니스 로직은 `features`에 둡니다.

## Import 규칙

- 다른 레이어나 slice를 import할 때는 `@/*` alias를 사용합니다.
- 여러 파일로 구성된 slice는 `index.ts`를 public API로 사용합니다.
- `export *` 형태의 무분별한 barrel export는 사용하지 않습니다.
- 내부 구현 파일을 외부에서 직접 참조하지 않습니다.
- `use client`는 필요한 가장 작은 컴포넌트에만 선언합니다.
- client component에서 server-only 코드를 import하지 않습니다.

## 상태와 API

- 서버 상태는 TanStack Query로 관리합니다.
- query key와 query function은 query factory로 관리합니다.
- 임의의 query key 배열을 컴포넌트에 직접 작성하지 않습니다.
- 전역 클라이언트 상태는 Zustand를 사용합니다.
- API client는 `src/shared/api`에 둡니다.
- 요청 함수와 응답 타입은 관련 endpoint 근처에 둡니다.
- 외부 API는 가능한 한 MSW mock으로 테스트합니다.

## UI 규칙

- 공통 UI는 `src/shared/ui`에 둡니다.
- 재사용 가능한 UI에는 Storybook story를 추가하거나 갱신합니다.
- 기존 디자인 토큰과 공통 컴포넌트를 우선 재사용합니다.
- 로딩, 에러, 빈 상태를 필요한 경우 함께 구현합니다.
- 전역 CSS는 `app/globals.css`에 둡니다.

## Git 및 PR 규칙

- 새 작업 브랜치의 base 브랜치와 PR target 브랜치는 항상 `develop`으로 한다. 작업 브랜치는 최신 `origin/develop`을 기준으로 생성한다.
- 커밋 메시지는 Conventional Commits 형식(`type: 한글 설명`)으로 작성합니다.
- 커밋 타입은 `feat`, `fix`, `docs`, `refactor`, `chore`, `test` 등 영어 표기를 사용합니다.
- 커밋 설명은 반드시 한글로 작성합니다.
- 예시: `feat: 회원가입 입력 필드 추가`, `docs: 프로젝트 작업 규칙 추가`
- 새 작업 브랜치는 항상 `develop` 브랜치를 기준으로 생성합니다.
- PR 제목은 항상 한글로 작성합니다.
- 모든 기능 브랜치의 PR 대상 브랜치는 `develop`으로 설정합니다.
- 변경사항은 먼저 `develop`에 병합하며, `main` 병합은 별도 요청이 있을 때만 진행합니다.
- PR 작성 전 저장소 이슈 목록에서 작업과 관련된 이슈를 검색합니다.
- 관련 이슈가 있으면 PR 본문에 `Refs #이슈번호` 또는 작업을 완료하는 경우 `Closes #이슈번호`로 연결합니다.
- 관련 이슈가 없으면 이슈를 새로 생성한 뒤 PR 본문에 연결합니다.
- 모든 PR은 관련 이슈 연결 여부를 확인한 뒤 작성합니다.
- Draft PR 작성 시 `.github/pull_request_template.md`를 사용합니다.
- PR 템플릿의 모든 항목을 빠짐없이 작성합니다.
- 테스트 체크리스트는 실제 실행 결과에 맞게 표시합니다.

### Storybook 드롭다운 검증

- `Select`와 드롭다운 메뉴는 Storybook에서 열었을 때 trigger 아래에 표시되어야 합니다.
- 공통 `Select`의 `Positioner`는 `side="bottom"`을 사용하고, 충돌 회피 때문에 위로 뒤집히지 않도록 아래 배치를 우선합니다.
- Select 관련 UI를 추가하거나 수정할 때는 메뉴가 trigger와 겹치지 않고 아래에 렌더링되는지 시각적으로 확인합니다.

## 작업 방식

작업 전 다음을 확인합니다.

1. 관련 파일과 기존 패턴을 먼저 탐색합니다.
2. 변경할 FSD 레이어와 slice를 결정합니다.
3. 필요한 범위만 수정합니다.
4. 변경 동작에 대한 테스트를 추가하거나 갱신합니다.
5. 검증 명령을 실행합니다.
6. 변경 파일과 검증 결과를 요약합니다.

요구사항이나 폴더 경계가 모호하면 임의로 구조를 만들지 말고 확인합니다.

## 검증 명령어

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

다음 상황에서는 추가 검증을 실행합니다.

- 사용자 흐름 변경: `pnpm test:e2e`
- 공통 UI 변경: `pnpm storybook` 또는 `pnpm build-storybook`
- 라우팅 또는 서버 설정 변경: `pnpm build`

## 금지 사항

- npm이나 yarn 사용 금지
- `src/views`, `src/app`, `src/styles`, 루트 `pages/` 생성 금지
- 검증되지 않은 대규모 폴더 이동 금지
- 비밀키와 `.env.local` 커밋 금지
- 요청 범위와 무관한 파일 수정 금지
- 기존 API나 상태 관리 패턴을 우회하는 임시 구현 금지

## 작업 결과 보고

작업 완료 시 다음을 보고합니다.

- 변경한 내용
- 주요 변경 파일
- 추가 또는 수정한 테스트
- 실행한 검증 명령
- 검증 결과
- 남아 있는 주의사항

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
