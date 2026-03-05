// Run: npm run streams:split

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';

const SOURCE_FILE_NAME = 'source.txt';

const getLinesPerChunk = () => {
  const args = process.argv.slice(2);
  const index = args.indexOf('--lines');

  if (index === -1 || !args[index + 1]) {
    return 10;
  }

  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 10;
};

const split = async () => {
  const cwd = process.cwd();
  const sourcePath = path.join(cwd, SOURCE_FILE_NAME);

  try {
    await fsPromises.access(sourcePath, fsPromises.constants.R_OK);
  } catch {
    throw new Error('FS operation failed');
  }

  const linesPerChunk = getLinesPerChunk();

  const readStream = fs.createReadStream(sourcePath, { encoding: 'utf8' });

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  let currentChunkIndex = 0;
  let currentLineCount = 0;
  let currentWriteStream = null;

  const openNextChunk = () => {
    currentChunkIndex += 1;
    const chunkFileName = `chunk_${currentChunkIndex}.txt`;
    const chunkPath = path.join(cwd, chunkFileName);
    currentWriteStream = fs.createWriteStream(chunkPath, { encoding: 'utf8' });
    currentLineCount = 0;
  };

  openNextChunk();

  for await (const line of rl) {
    if (currentLineCount >= linesPerChunk) {
      currentWriteStream.end();
      openNextChunk();
    }

    currentWriteStream.write(line + '\n');
    currentLineCount += 1;
  }

  if (currentWriteStream) {
    currentWriteStream.end();
  }
};

await split();
