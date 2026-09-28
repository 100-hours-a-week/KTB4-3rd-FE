export enum BankCode {
  KB = 'kb',
  SHINHAN = 'shinhan',
  WOORI = 'woori',
  HANA = 'hana',
  NH = 'nh',
  IBK = 'ibk',
  KAKAO = 'kakao',
  TOSS = 'toss',
}

export const BANK_ACCOUNT_OPTIONS = [
  { value: BankCode.KB, label: 'KB국민은행' },
  { value: BankCode.SHINHAN, label: '신한은행' },
  { value: BankCode.WOORI, label: '우리은행' },
  { value: BankCode.HANA, label: '하나은행' },
  { value: BankCode.NH, label: '농협은행' },
  { value: BankCode.IBK, label: '기업은행' },
  { value: BankCode.KAKAO, label: '카카오뱅크' },
  { value: BankCode.TOSS, label: '토스뱅크' },
] as const satisfies readonly { value: BankCode; label: string }[];

export type User = {
  id: number;
  nickname: string;
  profile_image_url: string | null;
  has_bank_account: boolean;
};

export type SaveBankAccountPayload = {
  bank_name: BankCode;
  account_no: string;
};

export type BankAccountData = {
  bank_name: BankCode;
  account_no_masked: string;
};
