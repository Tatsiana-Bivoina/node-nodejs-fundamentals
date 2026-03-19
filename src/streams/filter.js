// Run: npm run streams:filter

import { Transform } from 'node:stream';

const getPatternFromArgs = () => {
  const args = process.argv.slice(2);
  const index = args.indexOf('--pattern');

  if (index === -1 || !args[index + 1]) {
    return '';
  }

  return args[index + 1];
};

const filter = () => {
  const pattern = getPatternFromArgs();

  const shouldMatchAll = pattern === '';

  let partialLine = '';

  const transformer = new Transform({
    decodeStrings: true,
    transform(chunk, _encoding, callback) {
      const text = partialLine + chunk.toString('utf8');
      const lines = text.split('\n');

      partialLine = lines.pop() ?? '';

      for (const line of lines) {
        if (shouldMatchAll || line.includes(pattern)) {
          this.push(line + '\n');
        }
      }

      callback();
    },
    flush(callback) {
      if (partialLine.length > 0) {
        if (shouldMatchAll || partialLine.includes(pattern)) {
          this.push(partialLine + '\n');
        }
      }
      callback();
    },
  });

  process.stdin.pipe(transformer).pipe(process.stdout);
};

filter();
