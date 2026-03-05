// Run: npm run zip:decompressDir

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { createBrotliDecompress } from 'node:zlib';

const WORKSPACE_DIR_NAME = 'workspace';
const COMPRESSED_DIR_NAME = 'compressed';
const DECOMPRESSED_DIR_NAME = 'decompressed';
const ARCHIVE_NAME = 'archive.br';

const decompressDir = async () => {
  const cwd = process.cwd();
  const workspacePath = path.join(cwd, WORKSPACE_DIR_NAME);
  const compressedDirPath = path.join(workspacePath, COMPRESSED_DIR_NAME);
  const decompressedDirPath = path.join(workspacePath, DECOMPRESSED_DIR_NAME);
  const archivePath = path.join(compressedDirPath, ARCHIVE_NAME);

  let compressedStats;
  try {
    compressedStats = await fsPromises.stat(compressedDirPath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!compressedStats.isDirectory()) {
    throw new Error('FS operation failed');
  }

  let archiveStats;
  try {
    archiveStats = await fsPromises.stat(archivePath);
  } catch {
    throw new Error('FS operation failed');
  }

  if (!archiveStats.isFile()) {
    throw new Error('FS operation failed');
  }

  await fsPromises.mkdir(decompressedDirPath, { recursive: true });

  const compressedStream = fs.createReadStream(archivePath);
  const brotli = createBrotliDecompress();
  compressedStream.pipe(brotli);

  let state = 'header';
  let headerBuffer = Buffer.alloc(0);
  let currentWriteStream = null;
  let remainingBytes = 0;

  const ensureFileWriteStream = async (relativePath) => {
    const fullPath = path.join(decompressedDirPath, relativePath);
    const dirName = path.dirname(fullPath);
    await fsPromises.mkdir(dirName, { recursive: true });
    return fs.createWriteStream(fullPath);
  };

  try {
    for await (const chunk of brotli) {
      let offset = 0;

      while (offset < chunk.length) {
        if (state === 'header') {
          const newlineIndex = chunk.indexOf(0x0a, offset);

          if (newlineIndex === -1) {
            headerBuffer = Buffer.concat([headerBuffer, chunk.slice(offset)]);
            offset = chunk.length;
          } else {
            headerBuffer = Buffer.concat([
              headerBuffer,
              chunk.slice(offset, newlineIndex),
            ]);

            const headerStr = headerBuffer.toString('utf8');
            headerBuffer = Buffer.alloc(0);

            if (headerStr.trim().length === 0) {
              offset = newlineIndex + 1;
              continue;
            }

            let header;
            try {
              header = JSON.parse(headerStr);
            } catch {
              throw new Error('FS operation failed');
            }

            const relativePath = header.path;
            remainingBytes = header.size ?? 0;

            currentWriteStream = await ensureFileWriteStream(relativePath);

            state = 'body';
            offset = newlineIndex + 1;

            if (remainingBytes === 0) {
              currentWriteStream.end();
              currentWriteStream = null;
              state = 'header';
            }
          }
        } else if (state === 'body') {
          const bytesAvailable = Math.min(remainingBytes, chunk.length - offset);
          const slice = chunk.slice(offset, offset + bytesAvailable);

          currentWriteStream.write(slice);
          remainingBytes -= bytesAvailable;
          offset += bytesAvailable;

          if (remainingBytes === 0) {
            currentWriteStream.end();
            currentWriteStream = null;
            state = 'header';
          }
        }
      }
    }
  } finally {
    if (currentWriteStream) {
      currentWriteStream.end();
    }
  }
};

await decompressDir();
