// Run: npm run fs:snapshot

import fs from 'node:fs/promises';
import path from 'node:path';

const WORKSPACE_DIR_NAME = 'workspace';
const SNAPSHOT_FILE_NAME = 'snapshot.json';

const snapshot = async () => {
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

  const entries = [];

  const toPosixPath = (p) => p.split(path.sep).join('/');

  const scanDirectory = async (dirPath, relativeBase) => {
    const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of dirEntries) {
      const entryAbsolutePath = path.join(dirPath, entry.name);
      const entryRelativePath = relativeBase
        ? `${relativeBase}/${entry.name}`
        : entry.name;
      const normalizedRelativePath = toPosixPath(entryRelativePath);

      if (entry.isDirectory()) {
        entries.push({
          path: normalizedRelativePath,
          type: 'directory',
        });

        await scanDirectory(entryAbsolutePath, entryRelativePath);
      } else if (entry.isFile()) {
        const fileStats = await fs.stat(entryAbsolutePath);
        const fileContent = await fs.readFile(entryAbsolutePath);

        entries.push({
          path: normalizedRelativePath,
          type: 'file',
          size: fileStats.size,
          content: fileContent.toString('base64'),
        });
      }
    }
  };

  await scanDirectory(workspacePath, '');

  const snapshotData = {
    rootPath: workspacePath,
    entries,
  };

  const snapshotFilePath = path.join(cwd, SNAPSHOT_FILE_NAME);
  await fs.writeFile(snapshotFilePath, JSON.stringify(snapshotData, null, 2), 'utf8');
};

await snapshot();
