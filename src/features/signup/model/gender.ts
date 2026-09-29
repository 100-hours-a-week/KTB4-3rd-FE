export enum GenderCode {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export const GENDER_OPTIONS = [
  { value: GenderCode.MALE, label: '남자' },
  { value: GenderCode.FEMALE, label: '여자' },
] satisfies { value: GenderCode; label: string }[];
