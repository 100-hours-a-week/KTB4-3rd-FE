'use client';

import { useCallback, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  ProfileStep,
  TermsStep,
  signupDefaultValues,
  signupSchema,
  useSignupMutation,
  type SignupFormValues,
} from '@/features/signup';
import { ApiError } from '@/shared/api/client';
import { BackButton } from '@/shared/ui/back-button';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';
import { Button } from '@/shared/ui/button';

type SignupStep = 'profile' | 'terms';
const STEP_QUERY_VALUES = {
  profile: '1',
  terms: '2',
} as const;

const API_FIELD_TO_FORM_FIELD = {
  nickname: 'nickname',
  bank_name: 'bank',
  account_no: 'accountNumber',
  profile_image_key: 'profileImage',
  'agreements.service': 'serviceTerms',
  'agreements.location': 'locationTerms',
  'agreements.gender': 'genderTerms',
  'agreements.account_third_party': 'accountInfoTerms',
  'agreements.marketing': 'marketingTerms',
} as const satisfies Record<string, keyof SignupFormValues>;

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
  const { setError } = methods;
  const signupMutation = useSignupMutation();

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
    const isProfileValid = await methods.trigger([
      'profileImage',
      'nickname',
      'bank',
      'accountNumber',
    ]);

    if (isProfileValid) {
      router.push(getStepUrl('terms'), { scroll: false });
    }
  };

  useEffect(() => {
    const error = signupMutation.error;
    if (!(error instanceof ApiError) || !error.field) {
      return;
    }

    const formField = API_FIELD_TO_FORM_FIELD[error.field as keyof typeof API_FIELD_TO_FORM_FIELD];
    if (formField) {
      setError(formField, { type: 'server', message: error.message });
    }
  }, [setError, signupMutation.error]);

  const handleSignup = (values: SignupFormValues) => {
    signupMutation.mutate(values);
  };

  const submitError =
    signupMutation.error instanceof Error ? signupMutation.error.message : undefined;
  const submitSuccess = signupMutation.data?.message;

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
          {step === 'profile' ? (
            <ProfileStep />
          ) : (
            <TermsStep
              isSubmitting={signupMutation.isPending}
              submitError={submitError}
              submitSuccess={submitSuccess}
            />
          )}

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
