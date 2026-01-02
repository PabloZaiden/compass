import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const rootDir = dirname(__dirname);
export const repoDir = path.resolve(rootDir, '..');
