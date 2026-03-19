// Run: npm run hash:verify

import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

const CHECKSUMS_FILE_NAME = 'checksums.json';

const computeFileHash = async (filePath) => {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);

  await pipeline(stream, hash);

  return hash.digest('hex');
};

const verify = async () => {
  const cwd = process.cwd();
  const checksumsPath = path.join(cwd, CHECKSUMS_FILE_NAME);

  let checksumsContent;
  try {
    checksumsContent = await fs.readFile(checksumsPath, 'utf8');
  } catch {
    throw new Error('FS operation failed');
  }

  let checksums;
  try {
    checksums = JSON.parse(checksumsContent);
  } catch {
    throw new Error('FS operation failed');
  }

  const entries = Object.entries(checksums);

  for (const [fileName, expectedHash] of entries) {
    const filePath = path.join(cwd, fileName);

    let actualHash;
    try {
      actualHash = await computeFileHash(filePath);
    } catch {
      console.log(`${fileName} — FAIL`);
      continue;
    }

    if (actualHash === expectedHash) {
      console.log(`${fileName} — OK`);
    } else {
      console.log(`${fileName} — FAIL`);
    }
  }
};

await verify();
