#!/usr/bin/env node

import { Command } from 'commander';
import { showBanner } from '../utils/banner.js';
import { chainCommands } from './commands/chain.js';
import { deployCommand } from './commands/deploy.js';
import { initCommand } from './commands/init.js';
import { testCommand } from './commands/test.js';
import { profileCommand, groupCommand } from './commands/profile.js';
import { verifyCommand, verifySourceCommand } from './commands/verify.js';
import { deploymentsCommand } from './commands/deployments.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

const program = new Command();

program
  .name('chimera')
  .description('🐉 The Omnichain Forge - Deploy smart contracts across multiple chains in parallel')
  .version(version);

// Core commands
program.addCommand(chainCommands.add);
program.addCommand(chainCommands.list);
program.addCommand(chainCommands.remove);
program.addCommand(deployCommand);
program.addCommand(initCommand);
program.addCommand(testCommand);

// New omnichain commands
program.addCommand(profileCommand);
program.addCommand(groupCommand);
program.addCommand(verifyCommand);
program.addCommand(verifySourceCommand);
program.addCommand(deploymentsCommand);

// Default command to show the banner
program.action(() => {
  showBanner();
  console.log('  Ready to forge across chains.\n');
  console.log('  Quick Start:');
  console.log('    chimera deploy --contract MyContract.sol --network all');
  console.log('    chimera deploy --contract MyContract.sol --network testnet --create2');
  console.log('    chimera profile list');
  console.log('    chimera deployments summary\n');
  console.log('  Use --help to see all available commands.');
});

program.parse();
