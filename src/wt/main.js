// Run: npm run wt:main

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Worker } from 'node:worker_threads';

const DATA_FILE_NAME = 'data.json';

const readNumbers = async (cwd) => {
  const dataPath = path.join(cwd, DATA_FILE_NAME);
  const content = await fs.readFile(dataPath, 'utf8');
  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error('data.json must contain an array');
  }

  return parsed.map((value) => Number(value));
};

const splitIntoChunks = (array, chunksCount) => {
  const chunks = Array.from({ length: chunksCount }, () => []);

  array.forEach((value, index) => {
    const bucket = index % chunksCount;
    chunks[bucket].push(value);
  });

  return chunks;
};

const runWorker = (workerPath, payload) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(workerPath);

    worker.once('message', (result) => {
      resolve(result);
    });

    worker.once('error', (err) => {
      reject(err);
    });

    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    worker.postMessage(payload);
  });

const kWayMerge = (sortedArrays) => {
  const indices = sortedArrays.map(() => 0);
  const result = [];

  while (true) {
    let minValue = Infinity;
    let minArrayIndex = -1;

    for (let i = 0; i < sortedArrays.length; i += 1) {
      const arr = sortedArrays[i];
      const idx = indices[i];

      if (idx < arr.length) {
        const value = arr[idx];
        if (value < minValue) {
          minValue = value;
          minArrayIndex = i;
        }
      }
    }

    if (minArrayIndex === -1) {
      break;
    }

    result.push(minValue);
    indices[minArrayIndex] += 1;
  }

  return result;
};

const main = async () => {
  const cwd = process.cwd();
  const numbers = await readNumbers(cwd);

  const cores = Math.max(1, os.cpus().length || 1);
  const chunksCount = Math.min(cores, numbers.length || 1);

  const chunks = splitIntoChunks(numbers, chunksCount);

  const workerPath = path.join(cwd, 'src', 'wt', 'worker.js');

  const promises = chunks.map((chunk) => runWorker(workerPath, chunk));
  const sortedChunks = await Promise.all(promises);

  const finalSorted = kWayMerge(sortedChunks);
  console.log(finalSorted);
};

await main();
