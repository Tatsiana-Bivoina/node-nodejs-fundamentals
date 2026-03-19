// Run: npm run streams:lineNumberer

import { Transform } from 'node:stream';

const lineNumberer = () => {
  let lineCounter = 1;
  let partialLine = '';

  const transformer = new Transform({
    decodeStrings: true,
    transform(chunk, _encoding, callback) {
      const text = partialLine + chunk.toString('utf8');
      const lines = text.split('\n');

      partialLine = lines.pop() ?? '';

      const prefixedLines = lines
        .map((line) => `${lineCounter++} | ${line}`)
        .join('\n');

      if (prefixedLines.length > 0) {
        this.push(prefixedLines + '\n');
      }

      callback();
    },
    flush(callback) {
      if (partialLine.length > 0) {
        this.push(`${lineCounter++} | ${partialLine}\n`);
      }
      callback();
    },
  });

  process.stdin.pipe(transformer).pipe(process.stdout);
};

lineNumberer();
