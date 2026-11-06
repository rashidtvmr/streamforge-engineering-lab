import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const assets = join(process.cwd(), 'dist', 'assets');
if (!existsSync(assets)) throw new Error('No production build found. Run npm run build first.');
const files = readdirSync(assets);
const bytes = (extension) => files
  .filter((file) => file.endsWith(extension))
  .reduce((sum, file) => sum + statSync(join(assets, file)).size, 0);
const js = bytes('.js');
const css = bytes('.css');
const limits = { js: 450 * 1024, css: 100 * 1024 };
console.info(`StreamForge asset budget: JavaScript ${js}/${limits.js} bytes, CSS ${css}/${limits.css} bytes`);
if (js === 0 || js > limits.js || css > limits.css) process.exitCode = 1;
