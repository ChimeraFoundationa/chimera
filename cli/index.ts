#!/usr/bin/env node

import { Command } from 'commander';
import { showBanner } from '../utils/banner.js';
import { chainCommands } from './commands/chain.js';
import { deployCommand } from './commands/deploy.js';
import { initCommand } from './commands/init.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
const packagePath = join(new URL('.', import.meta.url).pathname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

const program = new Command();

program
  .name('chimera')
  .description('The Omnichain Forge - A multichain Web3 development framework')
  .version(version);

// Add chain management commands
program.addCommand(chainCommands.add);
program.addCommand(chainCommands.list);
program.addCommand(chainCommands.remove);

// Add deployment command
program.addCommand(deployCommand);

// Add init command
program.addCommand(initCommand);

// Default command to show the banner
program.action(() => {
  showBanner();
  console.log('Ready to forge across chains. Use --help to see available commands.');
});

program.parse();
