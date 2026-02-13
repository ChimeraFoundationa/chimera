import { Command } from 'commander';
import chalk from 'chalk';
import { Chimera } from '../../sdk/chimera.js';
import { logSuccess, logError, logHighlight } from '../../utils/logger.js';
import { withSpinner } from '../../utils/spinner.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const deployCommand = new Command('deploy')
  .description('Deploy a smart contract to one or more chains')
  .requiredOption('-c, --contract <contract>', 'Contract file name')
  .option('-n, --network <network>', 'Target network name or "all"', 'all')
  .option('-a, --args <args...>', 'Constructor arguments')
  .option('-p, --privateKey <privateKey>', 'Private key for the deployer wallet (overrides environment variable)')
  .action(async (options) => {
    try {
      const contractPath = path.join(__dirname, '../../../contracts/examples', options.contract);
      
      await withSpinner(`🔨 Forging ${options.contract} across the omnichain...`, async () => {
        const chimera = new Chimera();
        const privateKey = options.privateKey || process.env.PRIVATE_KEY;

        if (!privateKey) {
          logError('Private key not provided. Use the --privateKey flag or set the PRIVATE_KEY environment variable.');
          return Promise.reject(new Error('Private key is required.'));
        }

        const result = await chimera.deploy(contractPath, {
          to: options.network,
          args: options.args || [],
          privateKey: privateKey
        });
        
        return result;
      }).then((results) => {
        console.log(chalk.bold.cyan('\n🌉 ===== Omnichain Deployment Results =====\n'));
        if (Array.isArray(results)) {
          results.forEach((result, index) => {
            console.log(`${chalk.yellow.bold('📍 Chain:')} ${chalk.white(result.chain)}`);
            console.log(`${chalk.gray('   ├─ Address:')} ${chalk.cyan(result.address)}`);
            console.log(`${chalk.gray('   └─ Tx Hash:')} ${chalk.gray(result.txHash)}`);
            if (index < results.length - 1) {
                console.log('');
            }
          });
        } else {
          console.log(`${chalk.yellow.bold('📍 Chain:')} ${chalk.white(results.chain)}`);
          console.log(`${chalk.gray('   ├─ Address:')} ${chalk.cyan(results.address)}`);
          console.log(`${chalk.gray('   └─ Tx Hash:')} ${chalk.gray(results.txHash)}`);
        }
        console.log(chalk.bold.cyan('\n=============================================\n'));
        logSuccess('Your contract now lives across multiple chains!');
        
        // Suggest contract verification to the user
        console.log(chalk.yellow('\n📝 Next Step: Verify your contracts on the block explorers for transparency and security.'));
        console.log(chalk.yellow('   Visit the explorer URLs in your chain configuration to verify the source code.'));
      }).catch((error) => {
        if (error.message !== 'Private key is required.') {
            logError(`The forging process failed: ${error.message}`);
        }
      });
    } catch (error: any) {
      logError(`The forging process failed: ${error.message}`);
    }
  });
