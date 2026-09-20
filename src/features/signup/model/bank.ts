export enum BankCode {
  KB = 'KB',
  SHINHAN = 'SHINHAN',
  WOORI = 'WOORI',
  HANA = 'HANA',
  NH = 'NH',
  IBK = 'IBK',
  KAKAO = 'KAKAO',
  TOSS = 'TOSS',
}

export const BANK_OPTIONS = [
  { value: BankCode.KB, label: '국민은행' },
  { value: BankCode.SHINHAN, label: '신한은행' },
  { value: BankCode.WOORI, label: '우리은행' },
  { value: BankCode.HANA, label: '하나은행' },
  { value: BankCode.NH, label: '농협은행' },
  { value: BankCode.IBK, label: '기업은행' },
  { value: BankCode.KAKAO, label: '카카오뱅크' },
  { value: BankCode.TOSS, label: '토스뱅크' },
] satisfies { value: BankCode; label: string }[];

export const BANK_NAME_BY_CODE: Record<BankCode, string> = {
  [BankCode.KB]: 'KB국민은행',
  [BankCode.SHINHAN]: '신한은행',
  [BankCode.WOORI]: '우리은행',
  [BankCode.HANA]: '하나은행',
  [BankCode.NH]: '농협은행',
  [BankCode.IBK]: '기업은행',
  [BankCode.KAKAO]: '카카오뱅크',
  [BankCode.TOSS]: '토스뱅크',
};
