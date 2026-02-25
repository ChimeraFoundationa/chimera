import { Command } from 'commander';
import chalk from 'chalk';
import { Chimera } from '../../sdk/chimera.js';
import { verifyContractsBatch, getVerificationUrl, type VerificationRequest } from '../../sdk/verifier.js';
import { logSuccess, logError, logInfo, logWarning } from '../../utils/logger.js';
import { withSpinner } from '../../utils/spinner.js';
import { readFileSync, existsSync } from 'fs';
import { resolveContractPath } from '../../utils/resolver.js';

const verifyCommand = new Command('verify')
  .description('Verify deployed contracts on block explorers')
  .option('-c, --contract <name>', 'Contract name to verify (from manifest)')
  .option('-a, --address <address>', 'Contract address to verify')
  .option('-n, --network <network>', 'Network name for verification')
  .option('--chain <chain>', 'Alias for --network')
  .option('--api-key <key>', 'Block explorer API key (or set EXPLORER_API_KEY)')
  .option('--all', 'Verify all deployments from manifest')
  .option('--recent [number]', 'Verify recent deployments (default: 1)', parseInt)
  .option('--source <file>', 'Solidity source file (required for auto-verification)')
  .option('--compiler-version <version>', 'Compiler version (e.g., 0.8.19)', '0.8.19')
  .option('--optimization', 'Enable optimization')
  .option('--runs <number>', 'Optimization runs', parseInt)
  .option('--args <args>', 'Constructor arguments (ABI encoded)')
  .action(async (options) => {
    try {
      const apiKey = options.apiKey || process.env.EXPLORER_API_KEY;

      const chimera = new Chimera();
      const chains = await chimera.getChains();

      // Helper function to get chain config by name
      const getChainConfig = (chainName: string) => {
        return chains.find(c => c.name.toLowerCase() === chainName.toLowerCase());
      };

      // Auto-verification with source code
      if (options.source && (options.all || options.recent || options.contract || (options.address && options.network))) {
        if (!apiKey) {
          logError('API key required for auto-verification. Use --api-key or set EXPLORER_API_KEY env var.');
          return;
        }

        // Read and validate source file
        let sourcePath: string;
        try {
          sourcePath = resolveContractPath(options.source);
        } catch (error: any) {
          logError(`Source file not found: ${options.source}`);
          return;
        }

        const sourceCode = readFileSync(sourcePath, 'utf8');
        const contractName = options.contract || sourcePath.split('/').pop()?.replace('.sol', '') || 'Contract';
        const compilerVersion = options.compilerVersion || '0.8.19';
        const optimization = options.optimization || false;
        const runs = options.runs || 200;

        let deploymentsToVerify: { chain: string; address: string; explorer?: string }[] = [];

        if (options.all || options.recent) {
          // Get recent omnichain deployments
          const limit = options.recent || 1;
          const summary = await chimera.getOmnichainSummary(limit);

          if (summary.length === 0) {
            logError('No deployments found in manifest');
            return;
          }

          for (const deployment of summary) {
            for (const [chainName, address] of Object.entries(deployment.addresses)) {
              deploymentsToVerify.push({ chain: chainName, address, explorer: getChainConfig(chainName)?.explorer });
            }
          }
        } else if (options.contract) {
          // Get specific contract deployments
          const deployments = await chimera.getDeploymentHistory(options.contract);

          if (deployments.length === 0) {
            logError(`No deployments found for contract "${options.contract}"`);
            return;
          }

          deploymentsToVerify = deployments.map(d => ({
            chain: d.chain,
            address: d.address,
            explorer: getChainConfig(d.chain)?.explorer
          }));
        } else if (options.address && options.network) {
          // Single deployment
          deploymentsToVerify = [{
            chain: options.network,
            address: options.address,
            explorer: getChainConfig(options.network)?.explorer
          }];
        }

        console.log(chalk.bold.cyan('\n🔍 Auto-Verifying Contracts\n'));
        console.log(chalk.gray(`   Contract: ${contractName}`));
        console.log(chalk.gray(`   Source: ${sourcePath}`));
        console.log(chalk.gray(`   Version: v${compilerVersion}`));
        console.log(chalk.gray(`   Optimization: ${optimization ? `${runs} runs` : 'disabled'}`));
        console.log(chalk.gray(`   Chains: ${deploymentsToVerify.length}\n`));

        // Build verification requests
        const verificationRequests: VerificationRequest[] = deploymentsToVerify.map(d => ({
          chain: d.chain,
          chainId: getChainConfig(d.chain)?.chainId || 0,
          address: d.address,
          contractName: `${contractName}.sol:${contractName}`,
          sourceCode,
          compilerVersion,
          optimization,
          optimizationRuns: runs,
          constructorArgs: options.args,
          explorerUrl: d.explorer || '',
        }));

        await withSpinner('Submitting for verification...', async () => {
          const results = await verifyContractsBatch(verificationRequests, apiKey);

          const successful = results.filter(r => r.success);
          const failed = results.filter(r => !r.success);

          console.log(chalk.bold.cyan('\n📋 ===== Verification Results =====\n'));

          if (successful.length > 0) {
            console.log(chalk.green.bold(`   ✅ Successful: ${successful.length}\n`));
            for (const result of successful) {
              const url = result.explorerUrl ? getVerificationUrl(result.explorerUrl, result.address) : 'N/A';
              console.log(chalk.gray(`   ${result.chain}`));
              console.log(chalk.gray(`      Address: ${chalk.cyan(result.address)}`));
              console.log(chalk.gray(`      URL: ${url}\n`));
            }
          }

          if (failed.length > 0) {
            console.log(chalk.red.bold(`   ❌ Failed: ${failed.length}\n`));
            for (const result of failed) {
              console.log(chalk.gray(`   ${result.chain}`));
              console.log(chalk.gray(`      Address: ${result.address}`));
              console.log(chalk.gray(`      Error: ${chalk.red(result.message)}\n`));
            }
          }

          console.log(chalk.bold.cyan('===================================\n'));

          if (successful.length > 0) {
            logSuccess(`Successfully verified ${successful.length}/${results.length} contracts!`);
          }
        });

        return;
      }

      // Manual verification mode (no source file provided)
      if (!apiKey) {
        logWarning('No API key provided. Set EXPLORER_API_KEY env var or use --api-key flag.');
        logInfo('Visit https://docs.etherscan.io/ to get your API key');
      }

      if (options.all || options.recent) {
        // Show deployments for manual verification
        const limit = options.recent || 1;
        const summary = await chimera.getOmnichainSummary(limit);

        if (summary.length === 0) {
          logInfo('No deployments found in manifest');
          return;
        }

        console.log(chalk.bold.cyan('\n🔍 Recent Omnichain Deployments\n'));

        for (const deployment of summary) {
          console.log(chalk.white.bold(`   ${deployment.contractName}`));
          console.log(chalk.gray(`      Timestamp: ${deployment.timestamp}`));
          console.log(chalk.gray(`      Chains (${deployment.chains.length}):\n`));

          for (const chain of deployment.chains) {
            const address = deployment.addresses[chain];
            const chainConfig = getChainConfig(chain);
            const explorerUrl = chainConfig?.explorer ? getVerificationUrl(chainConfig.explorer, address) : 'N/A';

            console.log(chalk.gray(`      • ${chain}`));
            console.log(chalk.gray(`        Address: ${chalk.cyan(address)}`));
            console.log(chalk.gray(`        Explorer: ${explorerUrl}\n`));
          }
        }

        console.log(chalk.yellow('\n💡 Tip: Use --source <file> --api-key <key> for automatic verification\n'));
        return;
      }

      if (options.contract) {
        // Show specific contract deployments
        const deployments = await chimera.getDeploymentHistory(options.contract);

        if (deployments.length === 0) {
          logError(`No deployments found for contract "${options.contract}"`);
          return;
        }

        console.log(chalk.bold.cyan(`\n🔍 Deployments: ${options.contract}\n`));

        for (const deployment of deployments) {
          const chainConfig = getChainConfig(deployment.chain);
          const explorerUrl = chainConfig?.explorer ? getVerificationUrl(chainConfig.explorer, deployment.address) : 'N/A';

          console.log(chalk.gray(`   ${deployment.chain}`));
          console.log(chalk.gray(`      Address: ${chalk.cyan(deployment.address)}`));
          console.log(chalk.gray(`      TxHash: ${chalk.dim(deployment.txHash)}`));
          console.log(chalk.gray(`      Explorer: ${explorerUrl}\n`));
        }

        console.log(chalk.yellow('\n💡 Tip: Use --source <file> --api-key <key> for automatic verification\n'));
        return;
      }

      if (options.address && options.network) {
        // Show specific deployment
        const chainConfig = getChainConfig(options.network);
        const explorerUrl = chainConfig?.explorer ? getVerificationUrl(chainConfig.explorer, options.address) : 'N/A';

        console.log(chalk.bold.cyan('\n🔍 Contract Deployment\n'));
        console.log(chalk.gray(`   Network: ${options.network}`));
        console.log(chalk.gray(`   Address: ${chalk.cyan(options.address)}`));
        console.log(chalk.gray(`   Explorer: ${explorerUrl}\n`));

        console.log(chalk.yellow('💡 For automatic verification, provide:\n'));
        console.log(chalk.gray('   chimera verify \\'));
        console.log(chalk.gray('     --address ' + options.address));
        console.log(chalk.gray('     --network "' + options.network + '"'));
        console.log(chalk.gray('     --source contracts/Contract.sol'));
        console.log(chalk.gray('     --api-key YOUR_API_KEY\n'));
        return;
      }

      // No options provided - show help
      console.log(chalk.bold.cyan('\n📋 Contract Verification\n'));
      console.log(chalk.gray('Verify your deployed contracts on block explorers:\n'));

      console.log(chalk.white('   Manual verification (show deployment info):'));
      console.log(chalk.gray('      chimera verify --recent\n'));
      console.log(chalk.gray('      chimera verify --contract MyToken\n'));

      console.log(chalk.white('   Automatic verification (with API key):'));
      console.log(chalk.gray('      chimera verify --recent --source contracts/Token.sol --api-key KEY\n'));
      console.log(chalk.gray('      chimera verify --contract MyToken --source contracts/Token.sol --api-key KEY\n'));

      console.log(chalk.white('   Verify specific address:'));
      console.log(chalk.gray('      chimera verify --address 0x123... --network "Ethereum Sepolia"\n'));

      console.log(chalk.white('   Full auto-verification:'));
      console.log(chalk.gray('      chimera verify --recent \\'));
      console.log(chalk.gray('        --source contracts/Token.sol \\'));
      console.log(chalk.gray('        --api-key YOUR_API_KEY \\'));
      console.log(chalk.gray('        --optimization --runs 200\n'));
    } catch (error: any) {
      logError(`Verification failed: ${error.message}`);
    }
  });

// Subcommand to verify with source code (alias for verify --source)
const verifySourceCommand = new Command('verify:source')
  .description('Verify a contract with source code')
  .requiredOption('-a, --address <address>', 'Contract address')
  .requiredOption('-n, --network <network>', 'Network name')
  .requiredOption('--source <file>', 'Solidity source file')
  .option('--name <name>', 'Contract name (default: filename)')
  .option('--compiler-version <version>', 'Compiler version (e.g., 0.8.19)', '0.8.19')
  .option('--optimization', 'Enable optimization')
  .option('--runs <number>', 'Optimization runs', parseInt)
  .option('--args <args>', 'Constructor arguments (ABI encoded)')
  .option('--api-key <key>', 'Block explorer API key (or set EXPLORER_API_KEY)')
  .action(async (options) => {
    try {
      const apiKey = options.apiKey || process.env.EXPLORER_API_KEY;

      if (!apiKey) {
        logError('API key required. Use --api-key or set EXPLORER_API_KEY env var.');
        return;
      }

      // Read source file
      let sourcePath: string;
      try {
        sourcePath = resolveContractPath(options.source);
      } catch (error: any) {
        logError(`Source file not found: ${options.source}`);
        return;
      }

      const sourceCode = readFileSync(sourcePath, 'utf8');
      const contractName = options.name || sourcePath.split('/').pop()?.replace('.sol', '') || 'Contract';
      const compilerVersion = options.compilerVersion || '0.8.19';
      const optimization = options.optimization || false;
      const runs = options.runs || 200;

      const chimera = new Chimera();
      const chains = await chimera.getChains();
      const chainConfig = chains.find(c => c.name.toLowerCase() === options.network.toLowerCase());

      if (!chainConfig) {
        logError(`Chain "${options.network}" not found in configuration`);
        return;
      }

      console.log(chalk.bold.cyan('\n🔍 Verifying Contract\n'));
      console.log(chalk.gray(`   Contract: ${contractName}`));
      console.log(chalk.gray(`   Address: ${options.address}`));
      console.log(chalk.gray(`   Network: ${chainConfig.name}`));
      console.log(chalk.gray(`   Version: v${compilerVersion}`));
      console.log(chalk.gray(`   Optimization: ${optimization ? `${runs} runs` : 'disabled'}\n`));

      const verificationRequest: VerificationRequest = {
        chain: chainConfig.name,
        chainId: chainConfig.chainId,
        address: options.address,
        contractName: `${contractName}.sol:${contractName}`,
        sourceCode,
        compilerVersion,
        optimization,
        optimizationRuns: runs,
        constructorArgs: options.args,
        explorerUrl: chainConfig.explorer || '',
      };

      await withSpinner('Submitting for verification...', async () => {
        const { verifyContract } = await import('../../sdk/verifier.js');
        const result = await verifyContract(verificationRequest, apiKey);

        if (result.success) {
          console.log(chalk.green('\n   ✅ Verification successful!\n'));
          const url = result.explorerUrl ? getVerificationUrl(result.explorerUrl, result.address) : 'N/A';
          console.log(chalk.gray(`   Explorer: ${url}\n`));
          logSuccess('Contract verified on block explorer!');
        } else {
          console.log(chalk.red('\n   ❌ Verification failed\n'));
          console.log(chalk.gray(`   Error: ${result.message}\n`));
          logError(result.message);
        }
      });
    } catch (error: any) {
      logError(`Verification failed: ${error.message}`);
    }
  });

export { verifyCommand, verifySourceCommand };
