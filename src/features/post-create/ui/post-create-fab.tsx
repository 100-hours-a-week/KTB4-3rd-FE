'use client';

import { useRouter } from 'next/navigation';

import { Fab, type FabProps } from '@/shared/ui/fab';

const POST_LOCATION_ROUTE = '/post/create/location';

export type PostCreateFabProps = Omit<FabProps, 'onClick'>;

export function PostCreateFab(props: PostCreateFabProps) {
  const router = useRouter();

  return <Fab {...props} onClick={() => router.push(POST_LOCATION_ROUTE)} />;
}
