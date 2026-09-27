'use client';

import { useCallback, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  ProfileStep,
  TermsStep,
  signupDefaultValues,
  signupSchema,
  useNicknameAvailabilityMutation,
  useSignupMutation,
  type SignupFormValues,
} from '@/features/signup';
import { ApiError } from '@/shared/api/client';
import { BackButton } from '@/shared/ui/back-button';
import {
  bottomActionFixedClassName,
  bottomActionScrollPaddingImportantClassName,
} from '@/shared/ui/bottom-action-button';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';
import { Button } from '@/shared/ui/button';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

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
  const { setError } = methods;
  const nicknameAvailabilityMutation = useNicknameAvailabilityMutation();
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
    methods.clearErrors('nickname');

    const isProfileValid = await methods.trigger([
      'profile_image_key',
      'nickname',
      'gender',
      'bank_name',
      'account_no',
    ]);

    if (!isProfileValid) {
      return;
    }

    const nickname = methods.getValues('nickname').trim();
    const delayNoticeTimer = setTimeout(() => {
      useSnackbarStore
        .getState()
        .showSnackbar('닉네임 확인이 지연되고 있어요. 잠시만 기다려주세요.');
    }, 5000);

    try {
      const { data } = await nicknameAvailabilityMutation.mutateAsync(nickname);

      if (!data.available) {
        setError('nickname', {
          type: 'server',
          message: '이미 사용 중인 닉네임이에요',
        });
        return;
      }

      router.push(getStepUrl('terms'), { scroll: false });
    } catch (error) {
      setError('nickname', {
        type: 'server',
        message: error instanceof Error ? error.message : '닉네임 확인에 실패했어요.',
      });
    } finally {
      clearTimeout(delayNoticeTimer);
    }
  };

  useEffect(() => {
    const error = signupMutation.error;
    if (!(error instanceof ApiError) || !error.field) {
      return;
    }

    setError(error.field as FieldPath<SignupFormValues>, {
      type: 'server',
      message: error.message,
    });
  }, [setError, signupMutation.error]);

  const handleSignup = (values: SignupFormValues) => {
    signupMutation.mutate(values, {
      onSuccess: () => router.replace('/', { scroll: false }),
    });
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
        contentClassName={bottomActionScrollPaddingImportantClassName}
      >
        <form
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
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
              className={bottomActionFixedClassName}
              loading={nicknameAvailabilityMutation.isPending}
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
