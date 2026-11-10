let initialization: Promise<void> | null = null;

export function initClarity(): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!projectId || typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (!initialization) {
    initialization = import('@microsoft/clarity')
      .then(({ default: clarity }) => clarity.init(projectId))
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  return initialization;
}
