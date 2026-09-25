import { notFound } from 'next/navigation';

import { PostWritePage, type PostWriteType } from '@/_pages/post-write';

type PostWriteRouteProps = {
  searchParams: Promise<{
    type?: string | string[];
  }>;
};

function getPostWriteType(value: string | string[] | undefined): PostWriteType | null {
  const type = Array.isArray(value) ? value[0] : value;

  if (type === 'accompany' || type === 'community') {
    return type;
  }

  return null;
}

export default async function PostWriteRoute({ searchParams }: PostWriteRouteProps) {
  const params = await searchParams;
  const type = getPostWriteType(params.type);

  if (!type) {
    notFound();
  }

  return <PostWritePage type={type} />;
}
