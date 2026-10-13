import localFont from 'next/font/local';

export const pretendard = localFont({
  src: '../public/fonts/Pretendard-Regular-UI.woff2',
  weight: '400',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  variable: '--font-pretendard',
  declarations: [
    { prop: 'font-family', value: 'pretendard' },
    {
      prop: 'unicode-range',
      value:
        'U+20-7E, U+B7, U+D7, U+2022, U+2026, U+203A, U+2190-2193, U+3131-3163, U+AC00-D7A3, U+1F4E2',
    },
  ],
});

export const pretendardMedium = localFont({
  src: '../public/fonts/Pretendard-Medium-UI.woff2',
  weight: '500',
  display: 'swap',
  preload: false,
  declarations: [
    { prop: 'font-family', value: 'pretendard' },
    {
      prop: 'unicode-range',
      value:
        'U+20-7E, U+B7, U+D7, U+2022, U+2026, U+203A, U+2190-2193, U+3131-3163, U+AC00-D7A3, U+1F4E2',
    },
  ],
});

export const pretendardBold = localFont({
  src: '../public/fonts/Pretendard-Bold-UI.woff2',
  weight: '700',
  display: 'swap',
  preload: false,
  declarations: [
    { prop: 'font-family', value: 'pretendard' },
    {
      prop: 'unicode-range',
      value:
        'U+20-7E, U+B7, U+D7, U+2022, U+2026, U+203A, U+2190-2193, U+3131-3163, U+AC00-D7A3, U+1F4E2',
    },
  ],
});
