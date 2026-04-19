import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

execSync('npx tsc', { cwd: __dirname, stdio: 'inherit' });

const distBin = join(__dirname, 'dist', 'bin');
mkdirSync(distBin, { recursive: true });
writeFileSync(join(distBin, 'teamspec.js'), readFileSync(join(__dirname, 'bin', 'teamspec.js')));
