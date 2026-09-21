'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';

import type { SignupFormValues } from '@/features/signup/model/signup-schema';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Divider } from '@/shared/ui/divider';
import { Text } from '@/shared/ui/text';
import { VStack } from '@/shared/ui/stack';

const agreementFields = [
  'serviceTerms',
  'locationTerms',
  'genderTerms',
  'accountInfoTerms',
  'marketingTerms',
] as const;

const requiredAgreementFields = ['serviceTerms', 'locationTerms', 'genderTerms'] as const;

export type TermsStepProps = {
  isSubmitting?: boolean;
  submitError?: string;
  submitSuccess?: string;
};

export function TermsStep({ isSubmitting = false, submitError, submitSuccess }: TermsStepProps) {
  const { control, formState, setValue } = useFormContext<SignupFormValues>();
  const values = useWatch({ control });
  const isAllAgreed = agreementFields.every((field) => values[field]);
  const hasRequiredAgreementError = requiredAgreementFields.some(
    (field) => formState.errors[field],
  );

  const handleAllAgreementChange = (checked: boolean) => {
    agreementFields.forEach((field) => {
      setValue(field, checked, { shouldDirty: true, shouldValidate: true });
    });
  };

  return (
    <>
      <Text variant="t8Bold" className="mt-[20%]">
        서비스 이용을 위해 <br /> 약관 동의를 진행해주세요.
      </Text>

      <VStack className="mt-[20%]">
        <Checkbox
          checked={isAllAgreed}
          label="전체 동의"
          onCheckedChange={handleAllAgreementChange}
          requirement={null}
        />
        <Divider color="neutral-muted" />

        <Controller
          control={control}
          name="serviceTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              id="service-terms"
              label="서비스 이용약관 동의"
              onCheckedChange={field.onChange}
              requirement="required"
            />
          )}
        />
        <Controller
          control={control}
          name="locationTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              id="location-terms"
              label="위치기반서비스 이용약관 및 위치정보 수집·이용 동의"
              onCheckedChange={field.onChange}
              requirement="required"
            />
          )}
        />
        <Controller
          control={control}
          name="genderTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              id="gender-terms"
              label="성별 정보 수집·이용 동의"
              onCheckedChange={field.onChange}
              requirement="required"
            />
          )}
        />
        <Controller
          control={control}
          name="accountInfoTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              id="account-info-terms"
              label="정산을 위한 계좌정보 제3자 제공 동의"
              onCheckedChange={field.onChange}
              requirement="optional"
            />
          )}
        />
        <Controller
          control={control}
          name="marketingTerms"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              id="marketing-terms"
              label="마케팅 정보 수신 동의"
              onCheckedChange={field.onChange}
              requirement="optional"
            />
          )}
        />

        {hasRequiredAgreementError ? (
          <Text color="fg.critical" variant="t3Regular">
            필수 약관에 동의해주세요.
          </Text>
        ) : null}
      </VStack>

      {submitError ? (
        <Text as="p" role="alert" color="fg.critical" variant="t3Regular" className="mt-4">
          {submitError}
        </Text>
      ) : null}
      {submitSuccess ? (
        <Text as="p" role="status" color="fg.positive" variant="t3Regular" className="mt-4">
          {submitSuccess}
        </Text>
      ) : null}

      <Button
        type="submit"
        width="fill"
        size="large"
        className="mt-auto"
        loading={isSubmitting}
        disabled={Boolean(submitSuccess)}
      >
        회원가입하기
      </Button>
    </>
  );
}
