import type { OwnedCar } from '@/entities/owned-car';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

export type OwnedCarCardProps = {
  car: OwnedCar;
  disabled?: boolean;
  onDelete: () => void;
  onEdit: () => void;
};

export function OwnedCarCard({ car, disabled = false, onDelete, onEdit }: OwnedCarCardProps) {
  return (
    <article
      aria-label="등록된 차량 정보"
      className="rounded-[16px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Text as="h2" color="fg.neutral" variant="t6Bold">
            내 차량
          </Text>
          <dl className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Text as="dt" color="fg.neutralMuted" variant="t4Regular">
                차종
              </Text>
              <Text as="dd" className="truncate" color="fg.neutral" variant="t4Bold">
                {car.model}
              </Text>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Text as="dt" color="fg.neutralMuted" variant="t4Regular">
                차량 번호
              </Text>
              <Text as="dd" className="truncate" color="fg.neutral" variant="t4Bold">
                {car.number}
              </Text>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button className="flex-1" disabled={disabled} variant="neutral-weak" onClick={onEdit}>
          수정
        </Button>
        <Button className="flex-1" disabled={disabled} variant="neutral-outline" onClick={onDelete}>
          삭제
        </Button>
      </div>
    </article>
  );
}
