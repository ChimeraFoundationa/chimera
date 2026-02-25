import { Command } from 'commander';
import chalk from 'chalk';
import { ChainManager } from '../../sdk/chainManager.js';
import { logSuccess, logError, logInfo } from '../../utils/logger.js';
import { withSpinner } from '../../utils/spinner.js';

export const chainCommands = {
  add: new Command('chain:add')
    .description('Add a new chain to the configuration')
    .requiredOption('-n, --name <name>', 'Chain name')
    .requiredOption('-i, --chainId <chainId>', 'Chain ID', parseInt)
    .requiredOption('-r, --rpc <rpc>', 'RPC URL')
    .option('-e, --explorer <explorer>', 'Block explorer URL')
    .action(async (options) => {
      try {
        await withSpinner('Adding chain...', async () => {
          const chainManager = new ChainManager();
          await chainManager.addChain({
            name: options.name,
            chainId: options.chainId,
            rpc: options.rpc,
            explorer: options.explorer || ''
          });
        });
        
        logSuccess(`Chain "${options.name}" added successfully!`);
      } catch (error: any) {
        logError(`Failed to add chain: ${error.message}`);
      }
    }),

  list: new Command('chain:list')
    .description('List all configured chains')
    .action(async () => {
      try {
        const chainManager = new ChainManager();
        const chains = await chainManager.getChains();
        
        if (chains.length === 0) {
          logInfo('No chains configured. Use "chimera chain:add" to add a chain.');
          return;
        }
        
        console.log(chalk.cyan('\nConfigured Chains:\n'));
        
        chains.forEach((chain, index) => {
          console.log(`${index + 1}. ${chalk.bold(chain.name)}`);
          console.log(`   Chain ID: ${chain.chainId}`);
          console.log(`   RPC: ${chain.rpc}`);
          if (chain.explorer) {
            console.log(`   Explorer: ${chain.explorer}`);
          }
          console.log('');
        });
      } catch (error: any) {
        logError(`Failed to list chains: ${error.message}`);
      }
    }),

  remove: new Command('chain:remove')
    .description('Remove a chain from the configuration')
    .requiredOption('-n, --name <name>', 'Chain name')
    .action(async (options) => {
      try {
        await withSpinner('Removing chain...', async () => {
          const chainManager = new ChainManager();
          await chainManager.removeChain(options.name);
        });
        
        logSuccess(`Chain "${options.name}" removed successfully!`);
      } catch (error: any) {
        logError(`Failed to remove chain: ${error.message}`);
      }
    })
};
