// Run: npm run cp:execCommand

import { spawn } from 'node:child_process';

const execCommand = () => {
  const args = process.argv.slice(2);
  const commandString = args.join(' ').trim();

  if (!commandString) {
    console.error('No command provided');
    process.exit(1);
  }

  const child = spawn(commandString, {
    shell: true,
    env: { ...process.env },
  });

  if (child.stdout) {
    child.stdout.pipe(process.stdout);
  }

  if (child.stderr) {
    child.stderr.pipe(process.stderr);
  }

  if (child.stdin) {
    process.stdin.pipe(child.stdin);
  }

  child.on('close', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', () => {
    process.exit(1);
  });
};

execCommand();
