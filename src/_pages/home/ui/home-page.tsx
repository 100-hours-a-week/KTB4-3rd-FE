'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Code2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { sendAnalyticsEvent } from '@/shared/analytics/google-analytics';
import { setupStatusQueries } from '@/shared/api/setup-status';
import { usePostDetailStore } from '@/shared/model/stores/post-detail-store';

import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';

const setupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해 주세요.'),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export function HomePage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { data: setupStatus } = useQuery(setupStatusQueries.detail());
  const { closePostDetail, open, openPostDetail } = usePostDetailStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  });

  const onSubmit = ({ email }: SetupFormValues) => {
    setSubmittedEmail(email);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar alt="모여타 기본 프로필" size="sm" />
          <span className="text-sm font-bold tracking-tight text-slate-900">모여타</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
          Frontend starter
        </span>
      </header>

      <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-800">
            <Sparkles className="size-3.5" />
            Ready to build
          </div>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            함께 이동하고,
            <br />
            함께 연결되는 서비스
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            위키의 기술 스택과 FSD 방향을 반영한 초기 화면입니다. 이곳에서 기능별 slice를 확장해
            나갈 수 있습니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Dialog.Root
              open={open}
              onOpenChange={(nextOpen) => {
                if (nextOpen) {
                  sendAnalyticsEvent('starter_dialog_opened', { source: 'home' });
                  openPostDetail({ type: 'COMMUNITY', id: 1 });
                } else {
                  closePostDetail();
                }
              }}
            >
              <Dialog.Trigger
                render={
                  <Button type="button">
                    초기 구성 확인
                    <ArrowRight className="size-4" />
                  </Button>
                }
              />
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-950/40" />
                <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(calc(100%-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none">
                  <Dialog.Title className="text-lg font-bold text-slate-950">
                    초기 환경이 준비됐어요
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-slate-600">
                    서버 데이터는 TanStack Query, 클라이언트 상태는 Zustand에서 분리해 관리할 수
                    있습니다.
                  </Dialog.Description>
                  <div className="mt-6 flex justify-end">
                    <Dialog.Close render={<Button type="button" variant="secondary" />}>
                      확인
                    </Dialog.Close>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
            <Button
              type="button"
              variant="ghost"
              onClick={() => document.getElementById('email')?.focus()}
            >
              다음 단계 시작
            </Button>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-sky-300">Setup status</p>
              <h2 className="mt-2 text-2xl font-bold">기본 환경 구성 완료</h2>
            </div>
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <div className="mt-8 space-y-3">
            {setupStatus
              ? Object.entries(setupStatus).map(([label, value]) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-xl bg-white/10 px-4 py-3 text-sm"
                    key={label}
                  >
                    <span className="text-slate-300">{label}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))
              : null}
          </div>
          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-300">
            <Code2 className="size-4 text-sky-300" />
            <span>TypeScript strict mode enabled</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold text-slate-900">개발 소식 받기</p>
            <p className="mt-1 text-sm text-slate-500">RHF + Zod가 연결된 폼 예제입니다.</p>
          </div>
          <form
            className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="email">
                이메일
              </label>
              <input
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm transition outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                id="email"
                placeholder="you@example.com"
                type="email"
                {...register('email')}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-rose-600" id="email-error">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <Button type="submit">구독하기</Button>
          </form>
        </div>
        {submittedEmail ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            {submittedEmail} 주소를 저장했어요.
          </p>
        ) : null}
      </section>
    </main>
  );
}
