'use client';

import { Controller, useFormContext } from 'react-hook-form';

import { VStack } from '@/shared/ui/stack';

import { type BankCode } from '@/features/signup/model/bank';
import type { SignupFormValues } from '@/features/signup/model/signup-schema';
import { AccountNumberField } from './AccountNumberField';
import { BankSelectField } from './BankSelectField';
import { NicknameField } from './NicknameField';
import { ProfileImageField } from './ProfileImageField';

export function ProfileStep() {
  const { control } = useFormContext<SignupFormValues>();

  return (
    <VStack gap="dimension-x6">
      <Controller
        control={control}
        name="profile_image_key"
        render={({ field, fieldState }) => (
          <ProfileImageField
            errorMessage={fieldState.error?.message}
            invalid={fieldState.invalid}
            onChange={field.onChange}
            required
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="nickname"
        render={({ field, fieldState }) => (
          <NicknameField
            errorMessage={fieldState.error?.message}
            invalid={fieldState.invalid}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />

      <Controller
        control={control}
        name="bank_name"
        render={({ field, fieldState }) => (
          <BankSelectField
            errorMessage={fieldState.error?.message}
            invalid={fieldState.invalid}
            onChange={field.onChange}
            value={field.value as BankCode | null}
          />
        )}
      />

      <Controller
        control={control}
        name="account_no"
        render={({ field, fieldState }) => (
          <AccountNumberField
            errorMessage={fieldState.error?.message}
            invalid={fieldState.invalid}
            onChange={field.onChange}
            value={field.value}
          />
        )}
      />
    </VStack>
  );
}
