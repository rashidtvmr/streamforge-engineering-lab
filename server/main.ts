import { createApp } from './app.ts';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const staticDir = resolve(process.cwd(), 'dist');
const server = createApp({ staticDir: existsSync(staticDir) ? staticDir : undefined });
server.listen(port, '127.0.0.1', () => {
  console.info(`StreamForge API running at http://127.0.0.1:${port}`);
});
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
