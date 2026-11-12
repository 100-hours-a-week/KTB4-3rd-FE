export function formatNotificationTime(createdAt: string, now = new Date()): string {
  const created = new Date(createdAt);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - created.getTime()) / 60_000));

  if (Number.isNaN(elapsedMinutes)) {
    return '';
  }
  if (elapsedMinutes < 1) {
    return '방금 전';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays}일 전`;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(created);
}
