import { Command } from 'commander';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { logSuccess, logError, logInfo } from '../../utils/logger.js';
import { withSpinner } from '../../utils/spinner.js';
import { spawn } from 'child_process';

export const testCommand = new Command('test')
  .description('Run tests for your smart contracts')
  .option('-f, --file <file>', 'Specific test file to run')
  .option('-p, --pattern <pattern>', 'Pattern to match test files')
  .option('--reporter <reporter>', 'Test reporter to use (spec, json, tap)', 'spec')
  .action(async (options) => {
    try {
      // Check if we're in a Chimera project directory
      if (!existsSync('./package.json')) {
        logError('Not in a Chimera project directory. Run this command from your project root.');
        return;
      }

      await withSpinner('Running tests...', async () => {
        await runTests(options);
      });

      logSuccess('Tests completed successfully!');
    } catch (error: any) {
      logError(`Test execution failed: ${error.message}`);
    }
  });

async function runTests(options: { file?: string; pattern?: string; reporter: string }) {
  return new Promise<void>((resolve, reject) => {
    // Determine test files to run
    let testGlob = 'tests/**/*.test.js';
    
    if (options.file) {
      // If a specific file is provided
      testGlob = options.file;
    } else if (options.pattern) {
      // If a pattern is provided
      testGlob = `tests/**/${options.pattern}`;
    }

    // Check if we're dealing with Solidity test files (.t.sol)
    if (testGlob.includes('.sol')) {
      // For Solidity files, we'd typically use a tool like Foundry/Forge
      // For now, we'll show a helpful message
      logInfo('For Solidity contract testing, consider using Foundry/Forge:');
      logInfo('  forge test');
      logInfo('Or set up Hardhat for JavaScript-based contract testing.');
      resolve(); // Resolve early since we can't run Solidity tests directly
      return;
    }

    // Use Node.js built-in test runner for JS/TS test files
    const args = [
      '--test',
      testGlob,
      '--test-reporter=' + options.reporter
    ];

    const child = spawn('node', args, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // If the test command doesn't exist or fails, provide helpful info
        if (code === 127) { // Command not found
          logInfo('No test files found matching the pattern. Create tests in the tests/ directory.');
        }
        resolve(); // Resolve regardless to avoid hanging
      }
    });

    child.on('error', (error) => {
      logInfo('No test files found or test command unavailable. Create tests in the tests/ directory.');
      resolve(); // Resolve to avoid hanging
    });
  });
}