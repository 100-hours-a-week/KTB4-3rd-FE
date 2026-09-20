import { http, HttpResponse } from 'msw';

export const healthHandlers = [
  http.get('*/api/health', () =>
    HttpResponse.json({
      status: 'ok',
    }),
  ),
];
