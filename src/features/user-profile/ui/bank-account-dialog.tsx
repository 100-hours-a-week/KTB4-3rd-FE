'use client';

import { useState } from 'react';

import { BANK_ACCOUNT_OPTIONS, type BankCode } from '@/entities/user';
import { ApiError } from '@/shared/api/client';
import { Dialog, type DialogButtonProps } from '@/shared/ui/dialog';
import { Field } from '@/shared/ui/field';
import { InputField } from '@/shared/ui/input-field';
import { Select } from '@/shared/ui/select';
import { Text } from '@/shared/ui/text';

import { useSaveBankAccountMutation } from '@/features/user-profile/model/use-save-bank-account-mutation';

type BankAccountDialogProps = {
  open: boolean;
  onDismiss?: () => void;
  onOpenChange: (open: boolean) => void;
};

const bankOptions = BANK_ACCOUNT_OPTIONS.map(({ label, value }) => ({ label, value }));

export function BankAccountDialog({ open, onDismiss, onOpenChange }: BankAccountDialogProps) {
  const [bankCode, setBankCode] = useState<BankCode | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveBankAccountMutation = useSaveBankAccountMutation();

  const isAccountNumberValid = /^\d{10,14}$/.test(accountNumber);
  const canSubmit = bankCode !== null && isAccountNumberValid;
  const apiErrorField =
    saveBankAccountMutation.error instanceof ApiError ? saveBankAccountMutation.error.field : null;

  const resetForm = () => {
    setBankCode(null);
    setAccountNumber('');
    setErrorMessage(null);
    saveBankAccountMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean, notifyDismiss = true) => {
    if (!nextOpen) {
      resetForm();

      if (notifyDismiss) {
        onDismiss?.();
      }
    }

    onOpenChange(nextOpen);
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value.replace(/\D/g, '').slice(0, 14));
    setErrorMessage(null);
  };

  const handleSubmit: NonNullable<DialogButtonProps['onClick']> = (event) => {
    event.preventDefault();

    if (!bankCode || !isAccountNumberValid || saveBankAccountMutation.isPending) {
      return;
    }

    setErrorMessage(null);
    saveBankAccountMutation.mutate(
      { bank_name: bankCode, account_no: accountNumber },
      {
        onSuccess: () => handleOpenChange(false, false),
        onError: (error) => {
          setErrorMessage(error.message || '계좌 정보를 저장하지 못했어요. 다시 시도해주세요.');
        },
      },
    );
  };

  const bankErrorMessage = apiErrorField === 'bank_name' ? errorMessage : null;
  const accountErrorMessage = apiErrorField === 'account_no' ? errorMessage : null;
  const generalErrorMessage = apiErrorField ? null : errorMessage;

  return (
    <Dialog
      className="!w-[calc(100%-40px)] !max-w-[353px]"
      description="매칭을 시작하려면 정산 계좌 등록이 필요해요."
      open={open}
      primaryButtonProps={{
        disabled: !canSubmit,
        loading: saveBankAccountMutation.isPending,
        onClick: handleSubmit,
      }}
      primaryLabel="등록하기"
      title="정산 계좌를 등록해주세요"
      onOpenChange={handleOpenChange}
    >
      <div className="flex flex-col gap-4">
        <Field
          errorMessage={bankErrorMessage}
          inputSlot={
            <Select<BankCode>
              aria-label="은행명"
              invalid={Boolean(bankErrorMessage)}
              options={bankOptions}
              placeholder="은행을 선택해주세요"
              value={bankCode}
              onValueChange={(value) => {
                setBankCode(value);
                setErrorMessage(null);
              }}
            />
          }
          invalid={Boolean(bankErrorMessage)}
          label="은행명"
          required
        />
        <InputField
          aria-label="계좌번호"
          errorMessage={accountErrorMessage}
          inputMode="numeric"
          invalid={Boolean(accountErrorMessage)}
          label="계좌번호"
          placeholder="계좌번호를 입력해주세요"
          value={accountNumber}
          onValueChange={handleAccountNumberChange}
        />
        {generalErrorMessage ? (
          <Text color="fg.critical" variant="t3Regular">
            {generalErrorMessage}
          </Text>
        ) : null}
        {!isAccountNumberValid && accountNumber.length > 0 ? (
          <Text color="fg.critical" variant="t3Regular">
            계좌번호는 숫자 10~14자리로 입력해주세요
          </Text>
        ) : null}
      </div>
    </Dialog>
  );
}
