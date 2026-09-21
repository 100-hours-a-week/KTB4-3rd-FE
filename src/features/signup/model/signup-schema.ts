import { z } from 'zod';

import { BankCode } from './bank';

const requiredAgreement = z.boolean().refine((checked) => checked, {
  message: '필수 약관에 동의해주세요.',
});

export const signupSchema = z
  .object({
    profileImage: z
      .custom<File | null>(
        (value) => value === null || (typeof File !== 'undefined' && value instanceof File),
        '프로필 이미지를 확인해주세요.',
      )
      .refine((file): boolean => file !== null, '프로필 이미지를 선택해주세요.')
      .refine((file) => file === null || file.type.startsWith('image/'), {
        message: '이미지 파일만 선택할 수 있어요.',
      })
      .refine((file) => file === null || file.size <= 5 * 1024 * 1024, {
        message: '프로필 이미지는 5MB 이하로 선택해주세요.',
      }),
    nickname: z
      .string()
      .trim()
      .regex(/^[가-힣A-Za-z0-9]{2,12}$/, '한글, 영문, 숫자만 사용할 수 있어요.'),
    bank: z.enum(BankCode).nullable(),
    accountNumber: z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || /^\d{10,14}$/.test(value.replaceAll('-', '')),
        '계좌번호는 숫자 10~14자리로 입력해주세요.',
      ),
    serviceTerms: requiredAgreement,
    locationTerms: requiredAgreement,
    genderTerms: requiredAgreement,
    accountInfoTerms: z.boolean(),
    marketingTerms: z.boolean(),
  })
  .superRefine((values, context) => {
    const hasBank = values.bank !== null;
    const hasAccountNumber = values.accountNumber.length > 0;

    if (hasBank === hasAccountNumber) {
      return;
    }

    const message = '출금 은행과 계좌번호를 함께 입력해주세요.';
    context.addIssue({
      code: 'custom',
      message,
      path: [hasBank ? 'accountNumber' : 'bank'],
    });
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const signupDefaultValues: SignupFormValues = {
  profileImage: null,
  nickname: '',
  bank: null,
  accountNumber: '',
  serviceTerms: false,
  locationTerms: false,
  genderTerms: false,
  accountInfoTerms: false,
  marketingTerms: false,
};
