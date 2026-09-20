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
