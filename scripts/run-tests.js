/* eslint-disable */
const { spawn } = require('child_process');
const http = require('http');

const fs = require('fs');
const path = require('path');

const port = 3001;
console.log(`Starting Next.js server on port ${port}...`);

// Load environment variables from .env if present
const env = { ...process.env };
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        // Remove quotes if present
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        env[key] = val.trim();
      }
    });
  }
} catch (err) {
  console.error('Failed to parse .env file:', err);
}

const server = spawn('npx', ['next', 'dev', '-p', String(port)], {
  shell: true,
  stdio: 'pipe',
  env: env
});

// We want to capture server error/output to print if the server crashes unexpectedly
let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});
server.stderr.on('data', (data) => {
  serverOutput += data.toString();
});

function cleanup() {
  console.log('Shutting down server...');
  server.kill('SIGTERM');
  // Extra measure to ensure the process is killed on Windows
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', server.pid, '/f', '/t'], { shell: true });
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(1);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(1);
});
process.on('exit', () => {
  cleanup();
});

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: port,
      path: '/api/customers',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
}

async function wait() {
  for (let i = 0; i < 30; i++) {
    const ok = await checkServer();
    if (ok) {
      console.log('Server is ready!');
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
    console.log('Waiting for Next.js server to start...');
  }
  console.error('Server failed to start within 30 seconds.');
  console.error('Server output:\n', serverOutput);
  return false;
}

async function run() {
  const ready = await wait();
  if (!ready) {
    cleanup();
    process.exit(1);
  }

  console.log('Running tests...');
  const tests = spawn('npx', ['tsx', 'scripts/test-endpoints.ts'], {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) }
  });

  tests.on('close', (code) => {
    if (code !== 0) {
      console.log('--- SERVER OUTPUT ---');
      console.log(serverOutput);
      console.log('---------------------');
    }
    cleanup();
    process.exit(code);
  });
}

run();
