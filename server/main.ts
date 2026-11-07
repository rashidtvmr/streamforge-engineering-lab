import { createApp } from './app.ts';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { openPlatformDatabase } from './platform/database.ts';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const staticDir = resolve(process.cwd(), 'dist');
const host = process.env.HOST ?? '127.0.0.1';
if (host !== '127.0.0.1' && host !== '0.0.0.0') throw new Error('Unsupported HOST');
const database = openPlatformDatabase(resolve(process.env.STREAMFORGE_DB ?? 'data/streamforge.sqlite'));
const server = createApp({ staticDir: existsSync(staticDir) ? staticDir : undefined, database });
server.on('close', () => database.close());
server.listen(port, host, () => {
  console.info(`StreamForge API running at http://${host}:${port}`);
});
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
