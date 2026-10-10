import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
import {
  carpoolRequestDecisionMutationKeys,
  type CarpoolRequestDecisionConfirmedHandler,
  carpoolRequestReviewQueries,
  useCarpoolRequestDecisionOutcome,
  useCarpoolRequestDecisionMutation,
} from '@/features/carpool-request-review';
import { useAuthStore } from '@/entities/auth';
import {
  carpoolMutationQueryKeys,
  chatRoomMutationQueryKeys,
} from '@/shared/api/carpool-mutation-query-keys';
import { server } from '@/shared/api/mocks/server';
import { useCarpoolRequestDecisionStore } from '@/features/carpool-request-review/model/carpool-request-decision-store';
import { userProfileQueries } from '@/features/user-profile';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function requestDetail(status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' = 'PENDING') {
  return {
    message: '조회에 성공했습니다',
    data: {
      id: 88,
      carpool_id: 51,
      status,
      content: '함께 가고 싶습니다',
      requester: { id: 9, name: '이루디', profile_image_url: null },
      created_at: '2026-10-10T08:10:00.000Z',
    },
  };
}

const decisionVariables = { viewerId: 7, carpoolId: 51, requestId: 88 } as const;
const listKey = (direction: 'SENT' | 'RECEIVED', viewerId = 7) =>
  [...carpoolRequestQueryKeys.listPrefix(viewerId), direction] as const;
const detailKey = (viewerId = 7) =>
  carpoolRequestReviewQueries.detail({ ...decisionVariables, viewerId, enabled: true }).queryKey;
const decisionResponse = (status: 'ACCEPTED' | 'REJECTED') =>
  HttpResponse.json({
    message: '요청을 처리했습니다',
    data:
      status === 'ACCEPTED'
        ? { id: 88, status, chat_room_id: 620, current_count: 2, capacity: 4 }
        : { id: 88, status },
  });
function renderDecisionMutation(
  queryClient: QueryClient,
  viewerId = 7,
  options: { onDecisionConfirmed?: CarpoolRequestDecisionConfirmedHandler } = {},
) {
  return renderHook(() => useCarpoolRequestDecisionMutation(viewerId, options), {
    wrapper: createWrapper(queryClient),
  });
}

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
  useAuthStore.getState().setVerifiedViewerId('mock-access-token', 7);
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.getState().clearTokens();
  useCarpoolRequestDecisionStore.setState({ outcomes: {}, inFlight: {} });
});

describe('카풀 요청 상세·처리 query', () => {
  it('상세 캐시를 사용자, 카풀, 요청 ID 조합으로 나눈다', () => {
    const query = (viewerId: number, carpoolId: number, requestId: number) =>
      carpoolRequestReviewQueries.detail({
        viewerId,
        carpoolId,
        requestId,
        enabled: true,
      }).queryKey;

    expect(query(7, 51, 88)).not.toEqual(query(8, 51, 88));
    expect(query(7, 51, 88)).not.toEqual(query(7, 52, 88));
    expect(query(7, 51, 88)).not.toEqual(query(7, 51, 89));
    expect(
      carpoolRequestReviewQueries.detail({
        viewerId: null,
        carpoolId: 51,
        requestId: 88,
        enabled: true,
      }).enabled,
    ).toBe(false);
  });

  it('상세 query가 지정한 카풀과 요청 ID의 endpoint를 조회한다', async () => {
    const requestedPath = vi.fn<(pathname: string) => void>();
    server.use(
      http.get('*/carpools/:carpoolId/join-requests/:requestId', ({ request }) => {
        requestedPath(new URL(request.url).pathname);
        return HttpResponse.json(requestDetail());
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const response = await queryClient.fetchQuery(
      carpoolRequestReviewQueries.detail({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        enabled: true,
      }),
    );

    expect(requestedPath).toHaveBeenCalledWith(
      expect.stringMatching(/\/carpools\/51\/join-requests\/88$/),
    );
    expect(response.data).toMatchObject({ id: 88, carpool_id: 51, status: 'PENDING' });
  });

  it('현재 사용자 응답으로 access token에 연결된 viewerId를 검증한다', async () => {
    useAuthStore.getState().setVerifiedViewerId('mock-access-token', 999);
    server.use(
      http.get('*/users/me', () =>
        HttpResponse.json({
          message: '내 정보 조회에 성공했습니다',
          data: {
            id: 7,
            name: '이루디',
            profile_image_url: null,
            email: 'rudi@example.com',
          },
        }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await queryClient.fetchQuery(userProfileQueries.current());

    expect(useAuthStore.getState().verifiedViewerId).toBe(7);
  });

  it.each(['ACCEPTED', 'REJECTED'] as const)(
    '%s 성공 시 확정 callback을 호출하고 상세 상태를 반영한다',
    async (status) => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: true }, queries: { retry: false } },
      });
      const receivedKey = listKey('RECEIVED');
      const sentKey = listKey('SENT');
      const otherViewerKey = listKey('RECEIVED', 8);
      const requestKey = detailKey();
      queryClient.setQueryData(receivedKey, {
        pages: [
          {
            data: {
              direction: 'RECEIVED',
              items: [{ id: 88 }, { id: 90 }],
              next_cursor: 'next',
            },
          },
        ],
        pageParams: [undefined],
      });
      queryClient.setQueryData(sentKey, {
        pages: [{ data: { direction: 'SENT', items: [{ id: 88 }], next_cursor: null } }],
        pageParams: [undefined],
      });
      queryClient.setQueryData(otherViewerKey, { pages: [], pageParams: [] });
      queryClient.setQueryData(requestKey, requestDetail());
      const relatedKeys = [
        carpoolMutationQueryKeys.detail(7, 51),
        carpoolMutationQueryKeys.pins(),
        carpoolMutationQueryKeys.nearby(),
        chatRoomMutationQueryKeys.all(),
      ];
      relatedKeys.forEach((queryKey) => queryClient.setQueryData(queryKey, { value: 'stale' }));
      const requestCount = vi.fn<() => void>();
      const onDecisionConfirmed = vi.fn<CarpoolRequestDecisionConfirmedHandler>();
      server.use(
        http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
          requestCount();
          return decisionResponse(status);
        }),
      );
      const { result } = renderDecisionMutation(queryClient, 7, { onDecisionConfirmed });

      await result.current.mutateAsync({
        ...decisionVariables,
        status,
      });

      expect(requestCount).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryData(receivedKey)).toMatchObject({
        pages: [{ data: { items: [{ id: 88 }, { id: 90 }], next_cursor: 'next' } }],
      });
      expect(queryClient.getQueryData(sentKey)).toMatchObject({
        pages: [{ data: { items: [{ id: 88 }] } }],
      });
      expect(queryClient.getQueryData(requestKey)).toMatchObject({ data: { status } });
      expect(queryClient.getQueryState(receivedKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(sentKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(otherViewerKey)?.isInvalidated).toBe(false);
      expect(onDecisionConfirmed).toHaveBeenCalledWith(
        { viewerId: 7, carpoolId: 51, requestId: 88 },
        status,
      );
      relatedKeys.forEach((queryKey) => {
        expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(status === 'ACCEPTED');
      });
      expect(queryClient.getMutationCache().getAll()[0]?.options.mutationKey).toEqual(
        carpoolRequestDecisionMutationKeys.decide(7),
      );
    },
  );

  it('PATCH 실패는 자동 재전송하지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: true } } });
    const requestCount = vi.fn<() => void>();
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
        requestCount();
        return HttpResponse.json(
          { message: '서버 오류가 발생했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        );
      }),
    );
    const { result } = renderDecisionMutation(queryClient);

    await expect(
      result.current.mutateAsync({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        status: 'REJECTED',
      }),
    ).rejects.toMatchObject({ status: 500 });

    await waitFor(() => expect(requestCount).toHaveBeenCalledTimes(1));
  });

  it('화면의 viewerId와 mutation 변수의 viewerId가 다르면 PATCH를 보내지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const patchCount = vi.fn<() => void>();
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
        patchCount();
        return decisionResponse('ACCEPTED');
      }),
    );
    const { result } = renderDecisionMutation(queryClient, 8);

    await expect(
      result.current.mutateAsync({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        status: 'ACCEPTED',
      }),
    ).rejects.toThrow('현재 로그인한 사용자 정보를 확인할 수 없습니다.');

    expect(patchCount).not.toHaveBeenCalled();
  });

  it('access token에 검증된 viewerId가 다르면 mutation은 PATCH를 보내지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const patchCount = vi.fn<() => void>();
    useAuthStore.getState().setAccessToken('account-b-token');
    useAuthStore.getState().setVerifiedViewerId('account-b-token', 8);
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
        patchCount();
        return decisionResponse('ACCEPTED');
      }),
    );
    const { result } = renderDecisionMutation(queryClient);

    await expect(
      result.current.mutateAsync({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        status: 'ACCEPTED',
      }),
    ).rejects.toThrow('현재 로그인한 사용자 정보를 확인할 수 없습니다.');

    expect(patchCount).not.toHaveBeenCalled();
  });

  it('상세 query는 viewerId와 인증된 현재 사용자가 다르면 요청하지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const requestCount = vi.fn<() => void>();
    server.use(
      http.get('*/carpools/:carpoolId/join-requests/:requestId', () => {
        requestCount();
        return HttpResponse.json(requestDetail());
      }),
    );

    await expect(
      queryClient.fetchQuery(
        carpoolRequestReviewQueries.detail({
          viewerId: 8,
          carpoolId: 51,
          requestId: 88,
          enabled: true,
        }),
      ),
    ).rejects.toThrow('현재 로그인한 사용자 정보를 확인할 수 없습니다.');

    expect(requestCount).not.toHaveBeenCalled();
  });

  it('계정이 바뀐 뒤 이전 PATCH 응답은 새 사용자의 캐시나 화면 callback을 갱신하지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const requestCount = vi.fn<() => void>();
    const viewerBDetailKey = carpoolMutationQueryKeys.detail(8, 51);
    queryClient.setQueryData(viewerBDetailKey, { data: { current_count: 4 } });
    let releasePatch: (() => void) | undefined;
    const patchGate = new Promise<void>((resolve) => {
      releasePatch = resolve;
    });
    const onDecisionConfirmed = vi.fn<CarpoolRequestDecisionConfirmedHandler>();
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', async () => {
        requestCount();
        await patchGate;
        return decisionResponse('ACCEPTED');
      }),
    );
    const { result } = renderDecisionMutation(queryClient, 7, { onDecisionConfirmed });

    const pendingDecision = result.current.mutateAsync({
      viewerId: 7,
      carpoolId: 51,
      requestId: 88,
      status: 'ACCEPTED',
    });
    await waitFor(() => expect(requestCount).toHaveBeenCalledOnce());
    useAuthStore.getState().setAccessToken('account-b-token');
    useAuthStore.getState().setVerifiedViewerId('account-b-token', 8);
    releasePatch?.();

    await expect(pendingDecision).resolves.toMatchObject({ data: { status: 'ACCEPTED' } });

    expect(onDecisionConfirmed).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(viewerBDetailKey)).toMatchObject({
      data: { current_count: 4 },
    });
    expect(queryClient.getQueryState(viewerBDetailKey)?.isInvalidated).toBe(false);
  });

  it('확정 callback 실패가 서버 결정 결과를 불명확 상태로 바꾸지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const onDecisionConfirmed = vi
      .fn<CarpoolRequestDecisionConfirmedHandler>()
      .mockRejectedValue(new Error('목록 갱신 실패'));
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () =>
        HttpResponse.json({
          message: '요청을 수락했습니다',
          data: { id: 88, status: 'ACCEPTED', chat_room_id: 620, current_count: 2, capacity: 4 },
        }),
      ),
    );
    const { result } = renderDecisionMutation(queryClient, 7, { onDecisionConfirmed });

    await expect(
      result.current.mutateAsync({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        status: 'ACCEPTED',
      }),
    ).resolves.toMatchObject({ data: { status: 'ACCEPTED' } });

    expect(onDecisionConfirmed).toHaveBeenCalledOnce();
    expect(useCarpoolRequestDecisionStore.getState().outcomes).toEqual({});
  });

  it('처리 중 같은 요청의 두 번째 PATCH를 막는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const patchCount = vi.fn<() => void>();
    let releasePatch: (() => void) | undefined;
    const patchGate = new Promise<void>((resolve) => {
      releasePatch = resolve;
    });
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', async () => {
        patchCount();
        await patchGate;
        return decisionResponse('ACCEPTED');
      }),
    );
    const variables = { viewerId: 7, carpoolId: 51, requestId: 88 };
    const { result } = renderDecisionMutation(queryClient);

    const firstRequest = result.current.mutateAsync({ ...variables, status: 'ACCEPTED' });
    await waitFor(() => expect(patchCount).toHaveBeenCalledTimes(1));
    await expect(result.current.mutateAsync({ ...variables, status: 'REJECTED' })).rejects.toThrow(
      '이미 이 요청을 처리하고 있습니다.',
    );
    expect(patchCount).toHaveBeenCalledTimes(1);

    releasePatch?.();
    await firstRequest;
    expect(Object.values(useCarpoolRequestDecisionStore.getState().inFlight)).toEqual([]);
  });

  it.each(['ACCEPTED', 'REJECTED', 'EXPIRED'] as const)(
    '결과 불명확 시 PENDING 동안 반대 PATCH를 막고 %s 확정 조회 후 잠금을 푼다',
    async (terminalStatus) => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: true }, queries: { retry: false } },
      });
      const patchCount = vi.fn<() => void>();
      const detailCount = vi.fn<() => void>();
      let detailStatus: 'PENDING' | typeof terminalStatus = 'PENDING';
      const variables = decisionVariables;
      const receivedKey = listKey('RECEIVED');
      queryClient.setQueryData(receivedKey, {
        pages: [{ data: { direction: 'RECEIVED', items: [{ id: 88 }], next_cursor: null } }],
        pageParams: [undefined],
      });
      server.use(
        http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
          patchCount();
          return HttpResponse.json(
            { message: '서버 오류가 발생했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
            { status: 500 },
          );
        }),
        http.get('*/carpools/:carpoolId/join-requests/:requestId', () => {
          detailCount();
          return HttpResponse.json(requestDetail(detailStatus));
        }),
      );
      const onDecisionConfirmed = vi.fn<CarpoolRequestDecisionConfirmedHandler>();
      const { result } = renderHook(
        () => ({
          mutation: useCarpoolRequestDecisionMutation(7, { onDecisionConfirmed }),
          outcome: useCarpoolRequestDecisionOutcome(variables, { onDecisionConfirmed }),
        }),
        { wrapper: createWrapper(queryClient) },
      );

      await expect(
        result.current.mutation.mutateAsync({ ...variables, status: 'ACCEPTED' }),
      ).rejects.toMatchObject({
        status: 500,
      });

      expect(detailCount).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryState(receivedKey)?.isInvalidated).toBe(false);
      expect(onDecisionConfirmed).not.toHaveBeenCalled();
      await expect(
        result.current.mutation.mutateAsync({ ...variables, status: 'REJECTED' }),
      ).rejects.toThrow('처리 결과를 확인한 뒤 다시 시도할 수 있습니다.');
      expect(patchCount).toHaveBeenCalledTimes(1);
      detailStatus = terminalStatus;
      await expect(result.current.outcome.checkOutcome()).resolves.toBe(terminalStatus);
      expect(detailCount).toHaveBeenCalledTimes(2);
      expect(onDecisionConfirmed).toHaveBeenCalledWith(variables, terminalStatus);
      expect(result.current.outcome.isOutcomeUncertain).toBe(false);
      expect(queryClient.getQueryData(receivedKey)).toMatchObject({
        pages: [{ data: { items: [{ id: 88 }], next_cursor: null } }],
      });
      expect(queryClient.getQueryState(receivedKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryData(detailKey())).toMatchObject({
        data: { status: terminalStatus },
      });
    },
  );
});
