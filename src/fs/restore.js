// Run: npm run fs:restore

import fs from 'node:fs/promises';
import path from 'node:path';

const SNAPSHOT_FILE_NAME = 'snapshot.json';
const RESTORED_DIR_NAME = 'workspace_restored';

const restore = async () => {
  const cwd = process.cwd();
  const snapshotPath = path.join(cwd, SNAPSHOT_FILE_NAME);
  const restoredRootPath = path.join(cwd, RESTORED_DIR_NAME);

  let snapshotContent;
  try {
    snapshotContent = await fs.readFile(snapshotPath, 'utf8');
  } catch {
    throw new Error('FS operation failed');
  }

  let snapshot;
  try {
    snapshot = JSON.parse(snapshotContent);
  } catch {
    throw new Error('FS operation failed');
  }

  try {
    const stats = await fs.stat(restoredRootPath);
    if (stats) {
      throw new Error('FS operation failed');
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw new Error('FS operation failed');
    }
  }

  await fs.mkdir(restoredRootPath, { recursive: false });

  const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];

  for (const entry of entries) {
    if (!entry || typeof entry.path !== 'string' || typeof entry.type !== 'string') {
      continue;
    }

    const targetPath = path.join(restoredRootPath, entry.path);

    if (entry.type === 'directory') {
      await fs.mkdir(targetPath, { recursive: true });
    } else if (entry.type === 'file') {
      const dirName = path.dirname(targetPath);
      await fs.mkdir(dirName, { recursive: true });

      const contentBase64 = typeof entry.content === 'string' ? entry.content : '';
      let buffer;
      try {
        buffer = Buffer.from(contentBase64, 'base64');
      } catch {
        throw new Error('FS operation failed');
      }

      await fs.writeFile(targetPath, buffer);
    }
  }
};

await restore();
