import Clarity from '@microsoft/clarity';

let isInitialized = false;

export function initClarity(): void {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (isInitialized || !projectId) {
    return;
  }

  Clarity.init(projectId);
  isInitialized = true;
}
