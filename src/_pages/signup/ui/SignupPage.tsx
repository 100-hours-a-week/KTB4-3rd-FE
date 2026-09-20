'use client';

import { useCallback, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  signupDefaultValues,
  signupSchema,
  type SignupFormValues,
} from '@/features/signup/model/signup-schema';
import { ProfileStep } from '@/features/signup/ui/ProfileStep';
import { TermsStep } from '@/features/signup/ui/TermsStep';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';
import { Button } from '@/shared/ui/button';

type SignupStep = 'profile' | 'terms';
const STEP_QUERY_VALUES = {
  profile: '1',
  terms: '2',
} as const;

function getSignupStep(stepQuery: string | null): SignupStep {
  return stepQuery === STEP_QUERY_VALUES.terms ? 'terms' : 'profile';
}

export function SignupPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepQuery = searchParams.get('step');
  const step = getSignupStep(stepQuery);
  const methods = useForm<SignupFormValues>({
    defaultValues: signupDefaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(signupSchema),
  });

  const getStepUrl = useCallback(
    (nextStep: SignupStep) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('step', STEP_QUERY_VALUES[nextStep]);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  useEffect(() => {
    if (stepQuery !== STEP_QUERY_VALUES[step]) {
      router.replace(getStepUrl(step), { scroll: false });
    }
  }, [getStepUrl, router, step, stepQuery]);

  const handleNext = async () => {
    const isProfileValid = await methods.trigger(['nickname', 'bank', 'accountNumber']);

    if (isProfileValid) {
      router.push(getStepUrl('terms'), { scroll: false });
    }
  };

  const handleSignup = (values: SignupFormValues) => {
    void values;
    // TODO: 회원가입 API를 연결합니다.
  };

  return (
    <FormProvider {...methods}>
      <PageLayout
        header={
          <Header
            title="회원가입"
            leftSlot={<BackButton href={step === 'terms' ? getStepUrl('profile') : '/login'} />}
          />
        }
        className="gap-15"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={methods.handleSubmit(handleSignup)}
        >
          {step === 'profile' ? <ProfileStep /> : <TermsStep />}

          {step === 'profile' ? (
            <Button
              type="button"
              variant="neutral-solid"
              width="fill"
              size="large"
              className="mt-auto"
              onClick={handleNext}
            >
              다음
            </Button>
          ) : null}
        </form>
      </PageLayout>
    </FormProvider>
  );
}
