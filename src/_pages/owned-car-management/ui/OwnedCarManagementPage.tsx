'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import {
  OwnedCarCard,
  OwnedCarEditDialog,
  useDeleteOwnedCarMutation,
  useOwnedCarListQuery,
  useUpdateOwnedCarMutation,
} from '@/features/owned-car-management';
import { useAuthStore, selectIsAuthenticated } from '@/entities/auth';
import type { OwnedCar, OwnedCarRegistrationPayload } from '@/entities/owned-car';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BackButton } from '@/shared/ui/back-button';
import { Dialog } from '@/shared/ui/dialog';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { PageLayout } from '@/shared/ui/page-layout';
import { ResultSection } from '@/shared/ui/result-section';
import { Skeleton } from '@/shared/ui/skeleton';
import { Text } from '@/shared/ui/text';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function OwnedCarListLoading() {
  return (
    <section aria-busy="true" aria-label="등록된 차량 정보를 불러오는 중" className="pt-8">
      <Skeleton className="h-[180px] w-full rounded-[16px]" />
    </section>
  );
}

type OwnedCarDeleteDialogProps = {
  errorMessage: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function OwnedCarDeleteDialog({
  errorMessage,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: OwnedCarDeleteDialogProps) {
  return (
    <Dialog
      buttons="primarySecondary"
      description="삭제한 차량 정보는 카풀 등록에 사용할 수 없어요."
      disablePointerDismissal={isDeleting}
      open={open}
      primaryButtonProps={{
        loading: isDeleting,
        onClick: (event) => {
          event.preventDefault();
          onConfirm();
        },
      }}
      primaryLabel="삭제하기"
      primaryVariant="critical-solid"
      secondaryButtonProps={{ disabled: isDeleting }}
      showCloseButton={false}
      title="차량 정보를 삭제할까요?"
      onOpenChange={(nextOpen) => {
        if (isDeleting && !nextOpen) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <div aria-live="polite" className="min-h-5">
        {errorMessage ? (
          <Text color="fg.critical" variant="t3Regular">
            {errorMessage}
          </Text>
        ) : null}
      </div>
    </Dialog>
  );
}

function LoginRequiredContent({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <ResultSection
        buttons="primary"
        icon={<Icon color="var(--color-fg-neutral-muted)" name="info" size={60} />}
        primaryButtonProps={{ onClick: onLogin }}
        primaryLabel="로그인하기"
        size="medium"
        title="로그인이 필요해요"
        description="내 차량 정보를 확인하려면 로그인해주세요."
      />
    </div>
  );
}

export function OwnedCarManagementPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const ownedCarQuery = useOwnedCarListQuery();
  const updateMutation = useUpdateOwnedCarMutation();
  const deleteMutation = useDeleteOwnedCarMutation();
  const [editingCar, setEditingCar] = useState<OwnedCar | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OwnedCar | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const closeEditDialog = () => {
    if (updateMutation.isPending) {
      return;
    }

    setEditingCar(null);
    setUpdateError(null);
    updateMutation.reset();
  };

  const closeDeleteDialog = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteTarget(null);
    setDeleteError(null);
    deleteMutation.reset();
  };

  const handleUpdate = (payload: OwnedCarRegistrationPayload) => {
    if (!editingCar || updateMutation.isPending) {
      return;
    }

    setUpdateError(null);
    updateMutation.mutate(
      { carId: editingCar.id, payload },
      {
        onError: (error) => {
          setUpdateError(
            getErrorMessage(error, '차량 정보를 저장하지 못했어요. 다시 시도해주세요.'),
          );
        },
        onSuccess: () => {
          closeEditDialog();
          useSnackbarStore.getState().showSnackbar('차량 정보가 수정되었어요.', 'positive');
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget || deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onError: (error) => {
        setDeleteError(getErrorMessage(error, '차량 정보를 삭제하지 못했어요. 다시 시도해주세요.'));
      },
      onSuccess: () => {
        closeDeleteDialog();
        useSnackbarStore.getState().showSnackbar('차량 정보가 삭제되었어요.', 'positive');
      },
    });
  };

  let content: ReactNode;

  if (!isAuthenticated) {
    content = <LoginRequiredContent onLogin={() => router.push('/login')} />;
  } else if (ownedCarQuery.isPending) {
    content = <OwnedCarListLoading />;
  } else if (ownedCarQuery.isError) {
    content = (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <ResultSection
          buttons="primary"
          description="잠시 후 다시 시도해주세요."
          icon={
            <Icon color="var(--color-fg-critical)" name="exclamationmarkCircleFill" size={60} />
          }
          primaryButtonProps={{ onClick: () => void ownedCarQuery.refetch() }}
          primaryLabel="다시 불러오기"
          size="medium"
          title="차량 정보를 불러올 수 없어요"
        />
      </div>
    );
  } else {
    const cars = ownedCarQuery.data?.data.cars ?? [];

    content =
      cars.length > 0 ? (
        <section aria-label="등록된 차량" className="flex flex-col gap-4 pt-8">
          {cars.map((car) => (
            <OwnedCarCard
              car={car}
              disabled={updateMutation.isPending || deleteMutation.isPending}
              key={car.id}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(car);
              }}
              onEdit={() => {
                setUpdateError(null);
                setEditingCar(car);
              }}
            />
          ))}
        </section>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <ResultSection
            description="카풀을 운행할 차량을 등록하면 여기에서 관리할 수 있어요."
            icon={<Icon color="var(--color-fg-neutral-muted)" name="info" size={60} />}
            size="medium"
            title="등록된 차량이 없어요"
          />
        </div>
      );
  }

  return (
    <PageLayout
      className="relative"
      contentClassName="relative !overflow-y-auto"
      header={<Header leftSlot={<BackButton href="/" />} title="내 차량 관리" />}
    >
      {content}
      {editingCar ? (
        <OwnedCarEditDialog
          car={editingCar}
          errorMessage={updateError ?? undefined}
          isSubmitting={updateMutation.isPending}
          key={editingCar.id}
          open
          onOpenChange={(open) => {
            if (!open) {
              closeEditDialog();
            }
          }}
          onSubmit={handleUpdate}
        />
      ) : null}
      <OwnedCarDeleteDialog
        errorMessage={deleteError}
        isDeleting={deleteMutation.isPending}
        open={deleteTarget !== null}
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      />
    </PageLayout>
  );
}
