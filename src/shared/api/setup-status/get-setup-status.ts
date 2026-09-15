export type SetupStatus = {
  framework: string;
  styling: string;
  architecture: string;
};

export function getSetupStatus(): Promise<SetupStatus> {
  return Promise.resolve({
    framework: 'Next.js App Router',
    styling: 'Tailwind CSS v4',
    architecture: 'Feature-Sliced Design',
  });
}
