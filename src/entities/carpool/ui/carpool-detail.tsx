'use client';

import { useEffect, useState } from 'react';

import type { CarpoolRequestStatus, CarpoolUser } from '@/entities/carpool/model/carpool-request';
import {
  formatCarpoolDepartureAt,
  parseCarpoolDepartureTimestamp,
} from '@/entities/carpool/model/carpool-departure-time';
import { getCarpoolRequestAvailability } from '@/entities/carpool/model/carpool-request-availability';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { ResultSection } from '@/shared/ui/result-section';
import { Text } from '@/shared/ui/text';

type CarpoolDetailData = {
  status: string;
  host: CarpoolUser;
  origin_name: string;
  dest_name: string;
  departure_at: string;
  car_model: string;
  current_count: number;
  capacity: number;
  is_full: boolean;
  participants: CarpoolUser[];
  my_request?: { id: number; status: CarpoolRequestStatus };
};

export type CarpoolDetailProps =
  | { status: 'loading' }
  | { status: 'error'; errorMessage?: string; onRetry: () => void }
  | {
      status: 'content';
      carpool: CarpoolDetailData;
      isHost: boolean;
      isParticipant: boolean;
      isCheckingRequest: boolean;
      onRequestClick: () => void;
    };

const MAX_VISIBLE_PARTICIPANTS = 6;

function ParticipantAvatar({ participant }: { participant: CarpoolUser }) {
  if (participant.profile_image_url) {
    return (
      <Avatar alt={`${participant.name} 프로필`} size={36} src={participant.profile_image_url} />
    );
  }

  return (
    <span
      aria-label={`${participant.name} 참여자`}
      className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-brand-weak)] text-[var(--color-fg-brand)]"
      role="img"
    >
      <Text as="span" variant="t1Bold">
        {participant.name.slice(0, 2)}
      </Text>
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div
      aria-label="카풀 상세 불러오는 중"
      aria-live="polite"
      className="flex min-h-[436px] animate-pulse flex-col px-6"
      role="status"
    >
      <span className="mt-9 h-6 w-2/3 rounded bg-[var(--color-bg-neutral-weak)]" />
      <div className="mt-9 flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <span className="h-5 rounded bg-[var(--color-bg-neutral-weak)]" key={index} />
        ))}
      </div>
      <span className="mt-auto mb-12 h-11 rounded-full bg-[var(--color-bg-neutral-weak)]" />
    </div>
  );
}

function ErrorState({ errorMessage, onRetry }: { errorMessage?: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[436px] items-center justify-center px-4">
      <ResultSection
        buttons="primary"
        description={errorMessage ?? '카풀 상세를 불러오지 못했어요.'}
        primaryButtonProps={{ onClick: onRetry }}
        primaryLabel="다시 불러오기"
        size="medium"
        title="카풀 정보를 불러오지 못했어요"
      />
    </div>
  );
}

export function CarpoolDetail(props: CarpoolDetailProps) {
  const carpool = props.status === 'content' ? props.carpool : null;
  const departureTimestamp = carpool ? parseCarpoolDepartureTimestamp(carpool.departure_at) : null;
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  useEffect(() => {
    if (props.status !== 'content') {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const updateTime = () => setNowTimestamp(Date.now());
    const scheduleDepartureUpdate = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (departureTimestamp === null || departureTimestamp <= Date.now()) {
        return;
      }
      timeout = setTimeout(
        updateTime,
        Math.min(departureTimestamp - Date.now() + 1, 2_147_483_647),
      );
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTime();
        scheduleDepartureUpdate();
      }
    };

    window.addEventListener('focus', updateTime);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleDepartureUpdate();

    return () => {
      window.removeEventListener('focus', updateTime);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [props.status, departureTimestamp]);

  if (props.status === 'loading') {
    return <DetailSkeleton />;
  }
  if (props.status === 'error') {
    return <ErrorState errorMessage={props.errorMessage} onRetry={props.onRetry} />;
  }
  if (!carpool) {
    return null;
  }

  const { isCheckingRequest, isHost, isParticipant, onRequestClick } = props;
  const availability = getCarpoolRequestAvailability({
    departureTimestamp,
    isCheckingRequest,
    isFull: carpool.is_full,
    isHost,
    isParticipant,
    myRequestStatus: carpool.my_request?.status,
    nowTimestamp,
    status: carpool.status,
  });
  const visibleParticipants = carpool.participants.slice(0, MAX_VISIBLE_PARTICIPANTS);
  const hiddenParticipantCount = Math.max(
    0,
    carpool.participants.length - visibleParticipants.length,
  );
  const detailRows = [
    [
      '출발 시간',
      departureTimestamp === null
        ? '확인할 수 없어요.'
        : formatCarpoolDepartureAt(departureTimestamp),
    ],
    ['출발지', carpool.origin_name],
    ['목적지', carpool.dest_name],
    ['차종', carpool.car_model],
    ['현재 인원', `${carpool.current_count} / ${carpool.capacity}명`],
  ] as const;
  let availabilityNotice = null;

  if (availability.state === 'checking') {
    availabilityNotice = (
      <div aria-live="polite" className="mb-2 flex min-h-5 items-center justify-center gap-1.5">
        <Icon
          aria-hidden="true"
          className="animate-spin"
          color="var(--color-fg-neutral-muted)"
          name="clock3"
          size={14}
        />
        <Text color="fg.neutralMuted" variant="t3Regular">
          {availability.message}
        </Text>
      </div>
    );
  } else if (availability.state === 'disabled') {
    availabilityNotice = (
      <div aria-live="polite" className="mb-2 flex min-h-5 items-center justify-center gap-1.5">
        <Icon
          aria-hidden="true"
          color="var(--color-fg-critical)"
          name="exclamationmarkCircleFill"
          size={14}
        />
        <Text color="fg.critical" variant="t3Regular">
          {availability.message}
        </Text>
      </div>
    );
  }

  return (
    <article className="flex min-h-[436px] flex-col px-6 pb-0">
      <Text as="h2" className="mt-[35px] block break-words" color="fg.neutral" variant="t6Bold">
        {carpool.origin_name} → {carpool.dest_name}
      </Text>

      <dl className="mt-[44px] flex flex-col gap-3">
        {detailRows.map(([label, value]) => (
          <div className="grid grid-cols-[94px_minmax(0,1fr)] gap-3" key={label}>
            <dt>
              <Text as="span" color="fg.neutralMuted" variant="t3Regular">
                {label}
              </Text>
            </dt>
            <dd className="m-0 min-w-0 break-words">
              <Text as="span" color="fg.neutral" variant="t3Bold">
                {value}
              </Text>
            </dd>
          </div>
        ))}
      </dl>

      <section aria-label="참여자" className="mt-[48px]">
        <Text as="h3" className="block" color="fg.neutral" variant="t4Bold">
          참여자
        </Text>
        <ul className="mt-2 flex list-none flex-wrap gap-2 p-0" aria-label="카풀 참여자">
          {visibleParticipants.map((participant) => (
            <li key={participant.id}>
              <ParticipantAvatar participant={participant} />
            </li>
          ))}
          {hiddenParticipantCount > 0 ? (
            <li>
              <span
                aria-label={`외 ${hiddenParticipantCount}명`}
                className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--color-bg-neutral-weak)] text-[var(--color-fg-neutral-subtle)]"
              >
                +{hiddenParticipantCount}
              </span>
            </li>
          ) : null}
        </ul>
      </section>

      <div className="mt-auto pt-4 pb-0">
        {availabilityNotice}
        <Button
          className="!h-11 !min-h-11 !rounded-[22px]"
          disabled={!availability.canRequest}
          onClick={onRequestClick}
          type="button"
          variant="brand-solid"
          width="fill"
        >
          동행 요청하기
        </Button>
      </div>
    </article>
  );
}
