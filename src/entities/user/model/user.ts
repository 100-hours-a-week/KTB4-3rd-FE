export const BANK_ACCOUNT_BANK_NAMES = [
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '카카오뱅크',
  '토스뱅크',
] as const;

export type BankAccountBankName = (typeof BANK_ACCOUNT_BANK_NAMES)[number];

export type User = {
  id: number;
  nickname: string;
  profile_image_url: string | null;
  has_bank_account: boolean;
};

export type SaveBankAccountPayload = {
  bank_name: BankAccountBankName;
  account_no: string;
};

export type BankAccountData = {
  bank_name: BankAccountBankName;
  account_no_masked: string;
};
