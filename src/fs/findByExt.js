// Run: npm run fs:findByExt -- --ext <extension>
// Examples: npm run fs:findByExt              (default .txt)
//           npm run fs:findByExt -- --ext js

import fs from 'node:fs/promises';
import path from 'node:path';

const WORKSPACE_DIR_NAME = 'workspace';

const parseExtensionArg = () => {
  const args = process.argv.slice(2);

  let rawExt;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--ext' && args[i + 1]) {
      rawExt = args[i + 1];
      i += 1;
    }
  }

  const normalized = rawExt ?? '.txt';
  return normalized.startsWith('.') ? normalized : `.${normalized}`;
};

const findByExt = async () => {
  const cwd = process.cwd();
  const workspacePath = path.resolve(cwd, WORKSPACE_DIR_NAME);

  let stats;
  try {
    stats = await fs.stat(workspacePath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!stats.isDirectory()) {
    throw new Error('FS operation failed');
  }

  const targetExt = parseExtensionArg();
  const result = [];

  const toPosixPath = (p) => p.split(path.sep).join('/');

  const scanDirectory = async (dirPath, relativeBase) => {
    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of dirEntries) {
      const entryAbsolutePath = path.join(dirPath, entry.name);
      const entryRelativePath = relativeBase
        ? `${relativeBase}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        await scanDirectory(entryAbsolutePath, entryRelativePath);
      } else if (entry.isFile()) {
        if (entry.name.endsWith(targetExt)) {
          result.push(toPosixPath(entryRelativePath));
        }
      }
    }
  };

  await scanDirectory(workspacePath, '');

  result.sort((a, b) => a.localeCompare(b));
  for (const p of result) {
    console.log(p);
  }
};

await findByExt();
