// Run: npm run cli:progress -- --duration 5000 --interval 100 --length 30 --color #04afee

const DEFAULT_DURATION_MS = 5000;
const DEFAULT_INTERVAL_MS = 100;
const DEFAULT_BAR_LENGTH = 30;

const parseArgs = () => {
  const args = process.argv.slice(2);

  const getNumberOption = (name, defaultValue) => {
    const index = args.indexOf(name);
    if (index === -1 || !args[index + 1]) {
      return defaultValue;
    }

    const value = Number(args[index + 1]);
    return Number.isFinite(value) && value > 0 ? value : defaultValue;
  };

  const getStringOption = (name) => {
    const index = args.indexOf(name);
    if (index === -1 || !args[index + 1]) {
      return undefined;
    }
    return args[index + 1];
  };

  const duration = getNumberOption('--duration', DEFAULT_DURATION_MS);
  const interval = getNumberOption('--interval', DEFAULT_INTERVAL_MS);
  const length = getNumberOption('--length', DEFAULT_BAR_LENGTH);
  const color = getStringOption('--color');

  return { duration, interval, length, color };
};

const parseHexColor = (hex) => {
  if (typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return null;

  const normalized = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) {
    return null;
  }

  return { r, g, b };
};

const createColorWrapper = (hex) => {
  const rgb = parseHexColor(hex);
  if (!rgb) {
    return (text) => text;
  }

  const colorPrefix = `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
  const reset = '\x1b[0m';

  return (text) => `${colorPrefix}${text}${reset}`;
};

const progress = () => {
  const { duration, interval, length, color } = parseArgs();

  const barLength = Math.max(1, Math.floor(length));
  const colorize = createColorWrapper(color);

  const start = Date.now();

  const render = () => {
    const elapsed = Date.now() - start;
    const ratio = Math.min(elapsed / duration, 1);
    const percent = Math.round(ratio * 100);

    const filledLength = Math.round(barLength * ratio);
    const emptyLength = barLength - filledLength;

    const filled = colorize('█'.repeat(filledLength));
    const empty = ' '.repeat(emptyLength);

    const bar = `[${filled}${empty}] ${percent}%`;
    process.stdout.write(`\r${bar}`);

    if (ratio >= 1) {
      clearInterval(timer);
      process.stdout.write('\nDone!\n');
    }
  };

  render();
  const timer = setInterval(render, interval);
};

progress();
