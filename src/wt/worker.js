import { parentPort } from 'worker_threads';

// Receive array from main thread
// Sort in ascending order
// Send back to main thread

if (!parentPort) {
  throw new Error('Worker must be run as a worker thread');
}

parentPort.on('message', (data) => {
  if (!Array.isArray(data)) {
    parentPort.postMessage([]);
    return;
  }

  const sorted = [...data].sort((a, b) => Number(a) - Number(b));
  parentPort.postMessage(sorted);
});
