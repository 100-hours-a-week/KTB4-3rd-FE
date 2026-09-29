'use client';

import { Fab, type FabProps } from '@/shared/ui/fab';

export type PostCreateFabProps = FabProps;

export function PostCreateFab(props: PostCreateFabProps) {
  return <Fab {...props} />;
}
