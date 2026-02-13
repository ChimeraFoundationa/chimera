// tests/integration/cli.test.js
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import path from 'node:path';

test('CLI should show help message', async () => {
  return new Promise((done, reject) => {
    const cliPath = path.join(process.cwd(), 'dist', 'cli', 'index.js');
    const child = spawn('node', [cliPath, '--help']);

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      try {
        // The help command should have exit code 0
        assert.strictEqual(code, 0, `Expected exit code 0, got ${code}. Output: ${output}`);
        assert.ok(output.includes('Usage: chimera'), `Output should include 'Usage: chimera', got: ${output}`);
        assert.ok(output.includes('chain:add'), `Output should include 'chain:add', got: ${output}`);
        assert.ok(output.includes('chain:list'), `Output should include 'chain:list', got: ${output}`);
        assert.ok(output.includes('deploy'), `Output should include 'deploy', got: ${output}`);
        done();
      } catch (error) {
        reject(error);
      }
    });
  });
});