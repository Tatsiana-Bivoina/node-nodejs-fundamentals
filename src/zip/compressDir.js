// Run: npm run zip:compressDir

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { createBrotliCompress } from 'node:zlib';

const WORKSPACE_DIR_NAME = 'workspace';
const TO_COMPRESS_DIR_NAME = 'toCompress';
const COMPRESSED_DIR_NAME = 'compressed';
const ARCHIVE_NAME = 'archive.br';

const collectFilesRecursively = async (rootDir, currentDir = '') => {
  const dirPath = currentDir ? path.join(rootDir, currentDir) : rootDir;
  const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

  const files = [];

  for (const entry of entries) {
    const entryRelativePath = currentDir ? path.join(currentDir, entry.name) : entry.name;
    const entryFullPath = path.join(rootDir, entryRelativePath);

    if (entry.isDirectory()) {
      const nestedFiles = await collectFilesRecursively(rootDir, entryRelativePath);
      files.push(...nestedFiles);
    } else if (entry.isFile()) {
      files.push({
        absPath: entryFullPath,
        relPath: entryRelativePath.split(path.sep).join('/'),
      });
    }
  }

  return files;
};

const pipeFileIntoStream = (filePath, writable) =>
  new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);

    readStream.on('data', (chunk) => {
      const canContinue = writable.write(chunk);
      if (!canContinue) {
        readStream.pause();
        writable.once('drain', () => readStream.resume());
      }
    });

    readStream.on('end', () => resolve());
    readStream.on('error', (err) => reject(err));
  });

const compressDir = async () => {
  const cwd = process.cwd();
  const workspacePath = path.join(cwd, WORKSPACE_DIR_NAME);
  const toCompressPath = path.join(workspacePath, TO_COMPRESS_DIR_NAME);

  let toCompressStats;
  try {
    toCompressStats = await fsPromises.stat(toCompressPath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!toCompressStats.isDirectory()) {
    throw new Error('FS operation failed');
  }

  const compressedDirPath = path.join(workspacePath, COMPRESSED_DIR_NAME);
  await fsPromises.mkdir(compressedDirPath, { recursive: true });

  const archivePath = path.join(compressedDirPath, ARCHIVE_NAME);

  const brotli = createBrotliCompress();
  const archiveWriteStream = fs.createWriteStream(archivePath);

  brotli.pipe(archiveWriteStream);

  const files = await collectFilesRecursively(toCompressPath);

  for (const file of files) {
    const stats = await fsPromises.stat(file.absPath);

    const header = JSON.stringify({
      path: file.relPath,
      size: stats.size,
    });

    brotli.write(`${header}\n`);

    await pipeFileIntoStream(file.absPath, brotli);
  }

  brotli.end();

  await new Promise((resolve, reject) => {
    archiveWriteStream.on('finish', resolve);
    archiveWriteStream.on('error', reject);
  });
};

await compressDir();
