// Run: npm run cli:interactive

import readline from 'node:readline';

const PROMPT = '> ';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT,
  });

  const printGoodbyeAndExit = () => {
    console.log('Goodbye!');
    rl.close();
    process.exit(0);
  };

  rl.on('line', (line) => {
    const command = line.trim();

    switch (command) {
      case 'uptime':
        console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
        break;
      case 'cwd':
        console.log(process.cwd());
        break;
      case 'date':
        console.log(new Date().toISOString());
        break;
      case 'exit':
        printGoodbyeAndExit();
        return;
      default:
        if (command !== '') {
          console.log('Unknown command');
        }
        break;
    }

    rl.prompt();
  });

  rl.on('SIGINT', () => {
    printGoodbyeAndExit();
  });

  rl.on('close', () => {
    console.log('Goodbye!');
  });

  rl.prompt();
};

interactive();
