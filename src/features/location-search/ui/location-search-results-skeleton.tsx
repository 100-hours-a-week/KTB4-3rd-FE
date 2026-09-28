import { Skeleton } from '@/shared/ui/skeleton';

const DEFAULT_ROW_COUNT = 8;

export type LocationSearchResultsSkeletonProps = {
  rowCount?: number;
};

export function LocationSearchResultsSkeleton({
  rowCount = DEFAULT_ROW_COUNT,
}: LocationSearchResultsSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="장소 검색 결과를 불러오는 중"
      className="flex flex-col"
      data-testid="location-search-results-skeleton"
      role="status"
    >
      {Array.from({ length: rowCount }, (_, index) => (
        <div
          className="flex h-[50px] flex-col justify-center border-b border-[var(--color-stroke-neutral-subtle)] px-5"
          key={index}
        >
          <Skeleton className="h-[14px] w-[120px]" />
          <Skeleton className="mt-[3px] h-[17px] w-[221px]" />
        </div>
      ))}
    </div>
  );
}
