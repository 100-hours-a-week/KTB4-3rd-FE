import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

let workerStartPromise: Promise<void> | null = null;

export function startMockApi() {
  if (!workerStartPromise) {
    workerStartPromise = worker
      .start({ onUnhandledRequest: 'bypass' })
      .then(() => undefined)
      .catch((error: unknown) => {
        workerStartPromise = null;
        throw error;
      });
  }

  return workerStartPromise;
}
