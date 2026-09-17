import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
// Use npm's JavaScript entry point, avoiding Windows .cmd shell execution.
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'pack', '--ignore-scripts', '--pack-destination', 'dist', ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
