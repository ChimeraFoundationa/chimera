#!/usr/bin/env node

import { Command } from 'commander';
import { showBanner } from '../utils/banner.js';
import { chainCommands } from './commands/chain.js';
import { deployCommand } from './commands/deploy.js';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('chimera')
  .description('The Omnichain Forge - A multichain Web3 development framework')
  .version('0.1.0');

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
