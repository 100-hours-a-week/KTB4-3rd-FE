import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteOwnedCar,
  getOwnedCars,
  updateOwnedCar,
  type OwnedCarRegistrationPayload,
} from '@/entities/owned-car';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

const payload: OwnedCarRegistrationPayload = {
  model: '아반떼',
  number: '12가3456',
};

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('보유 차량 관리 API', () => {
  it('차량 목록 조회는 GET 경로와 인증 헤더를 전달한다', async () => {
    const requestSpy = vi.fn<(request: Request) => void>();
    server.use(
      http.get('*/users/me/cars', ({ request }) => {
        requestSpy(request);
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { cars: [{ id: 12, model: '아반떼', number: '12가3456' }] },
        });
      }),
    );

    const response = await getOwnedCars('mock-access-token');

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy.mock.calls[0][0].method).toBe('GET');
    expect(requestSpy.mock.calls[0][0].headers.get('authorization')).toBe(
      'Bearer mock-access-token',
    );
    expect(response.data.cars).toEqual([{ id: 12, model: '아반떼', number: '12가3456' }]);
  });

  it('차량 수정은 id 경로와 payload를 PUT으로 전달한다', async () => {
    const requestSpy = vi.fn<(request: Request) => void>();
    server.use(
      http.put('*/users/me/cars/12', async ({ request }) => {
        requestSpy(request.clone());
        return HttpResponse.json({
          message: '차량 정보가 수정되었습니다',
          data: { updatedAt: '2026-10-26T03:00:00' },
        });
      }),
    );

    const response = await updateOwnedCar('mock-access-token', 12, payload);
    const request = requestSpy.mock.calls[0][0];

    expect(request.method).toBe('PUT');
    expect(request.headers.get('authorization')).toBe('Bearer mock-access-token');
    expect(await request.json()).toEqual(payload);
    expect(response.data.updatedAt).toBe('2026-10-26T03:00:00');
  });

  it('차량 삭제는 id 경로에 DELETE를 호출하고 204 응답을 처리한다', async () => {
    const requestSpy = vi.fn<(request: Request) => void>();
    server.use(
      http.delete('*/users/me/cars/12', ({ request }) => {
        requestSpy(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(deleteOwnedCar('mock-access-token', 12)).resolves.toBeUndefined();

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy.mock.calls[0][0].method).toBe('DELETE');
    expect(requestSpy.mock.calls[0][0].headers.get('authorization')).toBe(
      'Bearer mock-access-token',
    );
  });
});
