import Image from 'next/image';
import Link from 'next/link';

import { TaglineReveal } from './tagline-reveal';

const benefits = [
  {
    number: '01',
    title: '붐비는 이동을 함께 나눠요',
    description: '같은 방향으로 가는 사람을 찾아 혼자 이동하는 부담을 덜어보세요.',
    detail: '주변 동행 지도에서 확인하기',
  },
  {
    number: '02',
    title: '택시비 부담을 나눠요',
    description: '출발지와 도착지, 시간이 비슷한 사람과 택시팟으로 연결돼요.',
    detail: '비슷한 일정의 이용자 자동 매칭',
  },
  {
    number: '03',
    title: '다음 이동을 미리 정해요',
    description: '주변 동행을 살펴보고 탑승 위치와 출발 시간을 함께 조율해요.',
    detail: '모집부터 채팅까지 한 흐름으로',
  },
];

const features = [
  {
    symbol: '✎',
    title: '커뮤니티',
    description: '교통 상황과 출퇴근 정보를 나누고 다른 이용자의 실시간 제보를 확인해요.',
  },
  {
    symbol: '⌖',
    title: '지도 기반 탐색',
    description: '전국 지도를 살펴보고 등록된 동행 모집글과 카풀 정보를 한눈에 확인해요.',
  },
  {
    symbol: '🚕',
    title: '택시팟 자동 매칭',
    description:
      '출발지와 도착지, 출발 시간이 비슷한 이용자를 연결해 택시비를 나눌 수 있도록 도와요.',
  },
  {
    symbol: '↗',
    title: '동행 모집과 참여',
    description: '원하는 출퇴근 시간과 경로를 등록해 동행자를 모집하거나 기존 모집에 참여해요.',
  },
  {
    symbol: '•••',
    title: '실시간 채팅',
    description: '매칭이 이어지면 채팅방에서 탑승 위치와 출발 시간을 조율해요.',
  },
  {
    symbol: '☆',
    title: '평가와 신고',
    description: '이동 후 동승자를 평가하고 부적절한 이용자나 채팅을 신고할 수 있어요.',
  },
];

const steps = [
  {
    number: '01',
    title: '경로와 시간을 살펴봐요',
    description: '전국 지도를 보고 등록된 동행 모집글과 카풀 정보를 확인해요.',
  },
  {
    number: '02',
    title: '맞는 동행을 찾거나 모집해요',
    description: '비슷한 출발지와 목적지, 시간대의 택시팟을 찾거나 직접 동행을 모집해요.',
  },
  {
    number: '03',
    title: '채팅으로 함께 이동을 준비해요',
    description: '매칭된 이용자와 탑승 위치와 출발 시간을 맞춰요.',
  },
];

const faqs = [
  {
    question: '모여타는 어떤 서비스인가요?',
    answer:
      '모여타는 혼자 이동하기 부담스러운 순간에 같은 방향으로 가는 사람을 연결하는 지도 기반 동행 매칭 서비스예요.',
  },
  {
    question: '어느 지역의 지도를 볼 수 있나요?',
    answer:
      '국내 전역의 지도를 볼 수 있어요. 등록된 동행 모집글과 카풀 정보는 지도에서 확인할 수 있어요.',
  },
  {
    question: '택시팟은 어떻게 매칭되나요?',
    answer:
      '출발지와 도착지, 출발 시간이 비슷한 이용자를 연결해 함께 이동하고 택시비 부담을 나눌 수 있도록 도와요.',
  },
  {
    question: '매칭 기준은 어떻게 되나요?',
    answer:
      '출발지와 목적지 경로가 비슷한 이용자를 매칭해요. 같은 성별의 이용자끼리 매칭되어 더 편안하게 이용할 수 있어요.',
  },
  {
    question: '직접 동행자를 모집할 수 있나요?',
    answer: '원하는 출퇴근 시간과 경로를 등록해 동행자를 모집하거나 기존 모집에 참여할 수 있어요.',
  },
  {
    question: '매칭된 뒤에는 어떻게 약속을 정하나요?',
    answer: '매칭이 이어지면 채팅방이 자동으로 만들어져 탑승 위치와 출발 시간을 조율할 수 있어요.',
  },
  {
    question: '이동 후 이용자를 평가하거나 신고할 수 있나요?',
    answer: '이동이 끝난 뒤 동승자를 평가하고 부적절한 이용자나 채팅을 신고할 수 있어요.',
  },
  {
    question: '커뮤니티에서는 무엇을 나눌 수 있나요?',
    answer: '교통 상황과 출퇴근 정보를 공유하고 다른 이용자의 실시간 제보를 확인할 수 있어요.',
  },
];

function RoutePreview() {
  return (
    <div
      aria-label="전국 지도에서 출발지와 도착지를 잇는 동행 경로 미리보기"
      className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-3xl bg-[#eaf5f8] p-6 shadow-[0_32px_80px_-48px_rgba(26,28,32,0.45)] sm:p-8"
      role="img"
    >
      <div aria-hidden="true" className="absolute inset-0 opacity-70">
        <svg className="h-full w-full" fill="none" viewBox="0 0 640 480">
          <path d="M-20 110C95 130 135 44 245 63S405 144 660 78" stroke="#fff" strokeWidth="28" />
          <path
            d="M-25 345C105 295 137 368 260 328S460 238 660 306"
            stroke="#fff"
            strokeWidth="34"
          />
          <path d="M105 -20C142 90 92 170 145 256S205 380 183 510" stroke="#fff" strokeWidth="22" />
          <path
            d="M445 -20C410 90 486 148 435 231S390 383 455 510"
            stroke="#fff"
            strokeWidth="26"
          />
          <path
            d="M115 78C205 118 234 182 296 214S385 276 497 335"
            stroke="#0099ff"
            strokeDasharray="8 13"
            strokeLinecap="round"
            strokeWidth="8"
          />
          <circle cx="115" cy="78" r="18" fill="#fff" />
          <circle cx="115" cy="78" r="10" fill="#0099ff" />
          <circle cx="497" cy="335" r="18" fill="#fff" />
          <circle cx="497" cy="335" r="10" fill="#1a1c20" />
        </svg>
      </div>
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs rounded-2xl bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-[var(--color-fg-neutral-subtle)]">
              비슷한 경로의 동행을 찾아요
            </p>
            <p className="mt-2 text-xl font-bold text-[var(--color-fg-neutral)]">
              출발지에서 목적지까지
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-fg-neutral-muted)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-bg-brand-solid)]" />
              경로와 출발 시간을 맞춰 함께 이동하기
            </div>
          </div>
          <div aria-hidden="true" className="hidden rounded-2xl bg-white/90 p-4 shadow-md sm:block">
            <Image alt="" height={28} src="/logos/logo_symbol.svg" width={28} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8">
      <Link
        aria-label="모여타 소개 페이지 처음으로"
        className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-stroke-focus-ring)]"
        href="/about"
      >
        <Image alt="모여타" height={30} priority src="/logos/logo_full.svg" width={122} />
      </Link>
      <Link
        className="rounded-full bg-[var(--color-bg-brand-solid)] px-5 py-3 text-sm font-semibold text-white transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-stroke-focus-ring)] active:translate-y-px sm:px-6 sm:text-base"
        href="/"
      >
        주변 동행 살펴보기
      </Link>
    </header>
  );
}

export function AboutPage() {
  return (
    <div className="min-h-dvh overflow-hidden bg-white text-[var(--color-fg-neutral)]">
      <a
        className="sr-only rounded-lg bg-white px-4 py-3 text-[var(--color-fg-neutral)] focus:not-sr-only focus:fixed focus:top-6 focus:left-6 focus:z-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-stroke-focus-ring)]"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <AboutHeader />
      <main id="main-content">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-8 pb-20 sm:px-8 sm:pb-24 lg:grid-cols-[1fr_1.08fr] lg:gap-16 lg:pt-16 lg:pb-32">
          <div className="max-w-2xl">
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance text-[var(--color-fg-neutral)] sm:text-6xl lg:text-7xl">
              같은 방향의 사람과
              <br />
              함께 이동해요
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-[var(--color-fg-neutral-muted)] sm:text-xl">
              혼자 이동하기 부담스러운 순간, 모여타가 내 경로와 시간에 맞는 카풀이나 택시팟을 찾아
              연결해요.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="rounded-full bg-[var(--color-bg-brand-solid)] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200/70 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-stroke-focus-ring)] active:translate-y-px"
                href="/"
              >
                주변 동행 살펴보기
              </Link>
              <p className="text-sm text-[var(--color-fg-neutral-subtle)]">
                전국 지도를 살펴보고 등록된 동행 정보를 확인해요
              </p>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm font-medium text-[var(--color-fg-neutral-muted)]">
              <span aria-hidden="true" className="flex -space-x-2">
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#cce9ff] text-xs text-[#005c99]">
                  카풀
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#fff2e1] text-[10px] text-[#805512]">
                  택시팟
                </span>
              </span>
              카풀부터 택시팟, 커뮤니티까지
            </div>
          </div>
          <RoutePreview />
        </section>

        <section
          aria-label="모여타가 해결하려는 이동의 불편"
          className="bg-[var(--color-bg-layer-fill)] px-6 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-2xl">
              <p className="mb-4 text-sm font-semibold text-[var(--color-fg-brand-contrast)]">
                함께 이동할 방법이 필요할 때
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                기다림과 이동 부담을 나눠요
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[var(--color-fg-neutral-muted)]">
                출퇴근 시간에는 버스와 지하철이 붐비고, 정류장 대기와 환승에도 시간이 걸려요. 택시는
                편리하지만 비용이 부담되고, 같은 방향으로 가는 사람을 알아도 서로 연결되기
                어려웠어요.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              {benefits.map((benefit) => (
                <article className="rounded-3xl bg-white p-6 shadow-sm sm:p-8" key={benefit.number}>
                  <p className="mb-10 text-sm font-semibold text-[var(--color-fg-brand)]">
                    {benefit.number}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{benefit.title}</h3>
                  <p className="mt-4 min-h-20 text-base leading-relaxed text-[var(--color-fg-neutral-muted)]">
                    {benefit.description}
                  </p>
                  <p className="mt-6 border-t border-[var(--color-stroke-neutral-subtle)] pt-4 text-sm font-semibold text-[var(--color-fg-neutral)]">
                    {benefit.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 text-sm font-semibold text-[var(--color-fg-brand-contrast)]">
              모여타 핵심 기능
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              동행을 찾고 이동을 준비하는 모든 과정
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                className="rounded-3xl border border-[var(--color-stroke-neutral-subtle)] p-6 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 sm:p-8"
                key={feature.title}
              >
                <span
                  aria-hidden="true"
                  className="mb-8 inline-flex text-3xl text-[var(--color-fg-brand)]"
                >
                  {feature.symbol}
                </span>
                <h3 className="text-xl font-bold tracking-tight">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--color-fg-neutral-muted)]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:py-32">
          <div>
            <p className="mb-4 text-sm font-semibold text-[var(--color-fg-brand-contrast)]">
              이용 방법
            </p>
            <h2 className="max-w-lg text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              찾고, 확인하고, 함께 정해요
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-fg-neutral-muted)]">
              지도에서 주변 수요를 확인하고, 경로와 시간대가 맞는 사람과 함께 이동을 준비해요.
            </p>
          </div>
          <ol className="divide-y divide-[var(--color-stroke-neutral-subtle)]">
            {steps.map((step) => (
              <li
                className="grid grid-cols-[3rem_1fr] gap-4 py-6 first:pt-0 last:pb-0"
                key={step.number}
              >
                <span className="pt-1 text-sm font-semibold text-[var(--color-fg-brand)]">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--color-fg-neutral-muted)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-[#f3faff] px-6 py-20 sm:px-8 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <p className="mb-6 text-sm font-semibold text-[var(--color-fg-brand-contrast)]">
              모여타와 함께
            </p>
            <TaglineReveal text="기약 없는 기다림 대신, 함께 갈 다음 이동 방법을 찾아요." />
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 sm:px-8 sm:py-24">
          <div className="mb-10">
            <p className="mb-4 text-sm font-semibold text-[var(--color-fg-brand-contrast)]">
              자주 묻는 질문
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              시작하기 전에 확인해요
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-stroke-neutral-subtle)] border-y border-[var(--color-stroke-neutral-subtle)]">
            {faqs.map((faq) => (
              <details className="group py-5" key={faq.question}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-stroke-focus-ring)] [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="text-2xl font-normal text-[var(--color-fg-brand)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pt-4 text-base leading-relaxed text-[var(--color-fg-neutral-muted)]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-[var(--color-bg-neutral-solid)] px-6 py-20 text-center text-white sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-sm font-semibold text-sky-200">다음 이동부터 함께</p>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              같은 방향의 동행을 찾아보세요
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75">
              전국 지도에서 등록된 카풀과 택시팟을 살펴보고 함께 이동할 방법을 골라보세요.
            </p>
            <Link
              className="mt-8 inline-flex rounded-full bg-white px-6 py-4 text-base font-semibold text-[var(--color-fg-neutral)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-stroke-focus-ring)] active:translate-y-px"
              href="/"
            >
              주변 동행 살펴보기
            </Link>
          </div>
        </section>
      </main>
      <footer className="px-6 py-8 text-center text-sm text-[var(--color-fg-neutral-subtle)]">
        <p>모여타 · 같은 방향으로 함께 가는 방법</p>
      </footer>
    </div>
  );
}
