// Wrapper: run RN CLI config and always exit 0 so Gradle is happy
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const cli = path.join(root, 'node_modules', '.bin', 'react-native');

try {
  const out = execFileSync(process.execPath, [cli, 'config'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 64 * 1024 * 1024,
  });
  process.stdout.write(out);
} catch (e) {
  if (e.stdout) process.stdout.write(e.stdout);
  else process.exit(1);
}
process.exit(0);
