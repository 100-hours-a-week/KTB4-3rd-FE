import { access, cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standaloneRoot = resolve(projectRoot, '.next/standalone');
const staticSource = resolve(projectRoot, '.next/static');
const publicSource = resolve(projectRoot, 'public');

async function assertExists(path, description) {
  try {
    await access(path);
  } catch {
    throw new Error(`${description}을 찾을 수 없습니다. 먼저 pnpm build를 실행해주세요: ${path}`);
  }
}

await assertExists(standaloneRoot, '.next/standalone');
await assertExists(staticSource, '.next/static');
await assertExists(publicSource, 'public');

await cp(staticSource, resolve(standaloneRoot, '.next/static'), { recursive: true, force: true });
await cp(publicSource, resolve(standaloneRoot, 'public'), { recursive: true, force: true });
