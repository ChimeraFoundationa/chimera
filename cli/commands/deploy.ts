import { Command } from 'commander';
import chalk from 'chalk';
import { Chimera } from '../../sdk/chimera.js';
import { ProfileManager } from '../../sdk/profile.js';
import { resolveContractPath, validateContractFile } from '../../utils/resolver.js';
import { logSuccess, logError, logInfo, logWarning } from '../../utils/logger.js';
import { withSpinner } from '../../utils/spinner.js';
import path from 'path';

const profileManager = new ProfileManager();

export const deployCommand = new Command('deploy')
  .description('Deploy a smart contract to one or more chains')
  .requiredOption('-c, --contract <contract>', 'Contract file path or name (e.g., Token.sol, contracts/MyToken.sol)')
  .option('-n, --network <network>', 'Target network name, "all", or chain group (testnet/mainnet/l2)', 'all')
  .option('-a, --args <args...>', 'Constructor arguments')
  .option('-p, --privateKey <privateKey>', 'Private key (overrides PRIVATE_KEY env var)')
  .option('--create2', 'Use CREATE2 for deterministic addresses across chains')
  .option('--salt <salt>', 'Salt for CREATE2 deployment (hex string)')
  .option('--profile <profile>', 'Deployment profile (dev/staging/prod)')
  .option('--no-manifest', 'Do not save deployment to manifest')
  .option('--chains <chains...>', 'Specific chains to deploy to')
  .option('--exclude <chains...>', 'Chains to exclude from deployment')
  .option('--verify', 'Verify contracts on block explorers after deployment')
  .option('--explorer-key <key>', 'Block explorer API key for verification')
  .action(async (options) => {
    try {
      // Resolve contract path
      let contractPath: string;
      try {
        contractPath = resolveContractPath(options.contract);
      } catch (error: any) {
        logError(error.message);
        return;
      }

      // Validate contract file
      const validation = validateContractFile(contractPath);
      if (!validation.valid) {
        logError(`Invalid contract file: ${validation.error}`);
        return;
      }

      const contractName = path.basename(contractPath);

      // Apply profile settings if specified
      if (options.profile) {
        const profile = profileManager.getProfile(options.profile);
        if (!profile) {
          logWarning(`Profile "${options.profile}" not found. Using default settings.`);
        } else {
          logInfo(`Using profile: ${options.profile}`);
          if (profile.useCreate2 && !options.create2) {
            options.create2 = true;
            logInfo('CREATE2 enabled by profile');
          }
          if (profile.salt && !options.salt) {
            options.salt = profile.salt;
          }
          if (profile.excludeChains) {
            options.exclude = profile.excludeChains;
          }
          if (profile.onlyChains) {
            options.chains = profile.onlyChains;
          }
        }
      }

      // Check for private key
      const privateKey = options.privateKey || process.env.PRIVATE_KEY;
      if (!privateKey) {
        logError('Private key not provided. Use --privateKey or set PRIVATE_KEY env var.');
        return;
      }

      // Determine deployment mode
      const deploymentMode = options.create2 ? 'CREATE2' : 'Standard';
      const networkTarget = options.network === 'all' ? 'all chains' : options.network;

      console.log(chalk.bold.cyan('\n🔨 Omnichain Deployment Configuration\n'));
      console.log(chalk.gray(`   Contract: ${chalk.white(contractPath)}`));
      console.log(chalk.gray(`   Mode: ${chalk.white(deploymentMode)}`));
      console.log(chalk.gray(`   Target: ${chalk.white(networkTarget)}`));
      if (options.chains) {
        console.log(chalk.gray(`   Chains: ${chalk.white(options.chains.join(', '))}`));
      }
      if (options.exclude) {
        console.log(chalk.gray(`   Excluded: ${chalk.white(options.exclude.join(', '))}`));
      }
      if (options.create2) {
        console.log(chalk.gray(`   Salt: ${chalk.white(options.salt || 'default')}`));
      }
      if (options.profile) {
        console.log(chalk.gray(`   Profile: ${chalk.white(options.profile)}`));
      }
      console.log('');

      await withSpinner(`🚀 Deploying ${contractName} across the omnichain...`, async () => {
        const chimera = new Chimera();

        // Parse constructor args
        const args = options.args ? options.args.map((arg: string) => {
          // Try to parse as number or boolean
          if (/^\d+$/.test(arg)) return BigInt(arg);
          if (/^\d+\.\d+$/.test(arg)) return parseFloat(arg);
          if (arg === 'true') return true;
          if (arg === 'false') return false;
          return arg; // Keep as string
        }) : [];

        const result = await chimera.deploy(contractPath, {
          to: options.network,
          args,
          privateKey,
          useCreate2: options.create2,
          salt: options.salt,
          profile: options.profile,
          saveManifest: options.manifest !== false,
          chains: options.chains,
          excludeChains: options.exclude,
        });

        return result;
      }).then((result) => {
        // Display results
        console.log(chalk.bold.cyan('\n🌉 ===== Omnichain Deployment Results =====\n'));
        console.log(chalk.gray(`   Total Chains: ${result.total}`));
        console.log(chalk.gray(`   Successful: ${chalk.green(result.successful.toString())}`));
        console.log(chalk.gray(`   Failed: ${chalk.red(result.failed.toString())}\n`));

        if (result.successful > 0) {
          console.log(chalk.green.bold('   Successful Deployments:\n'));
          result.results
            .filter(r => r.success)
            .forEach((r, index) => {
              console.log(chalk.gray(`   ${index + 1}. ${chalk.white(r.chain)}`));
              console.log(chalk.gray(`      Address: ${chalk.cyan(r.address)}`));
              console.log(chalk.gray(`      TxHash: ${chalk.dim(r.txHash)}\n`));
            });
        }

        if (result.failed > 0) {
          console.log(chalk.red.bold('   Failed Deployments:\n'));
          result.results
            .filter(r => !r.success)
            .forEach((r, index) => {
              console.log(chalk.gray(`   ${index + 1}. ${chalk.white(r.chain || 'Unknown')}`));
              console.log(chalk.gray(`      Error: ${chalk.red(r.error)}\n`));
            });
        }

        console.log(chalk.bold.cyan('=============================================\n'));

        if (result.successful > 0) {
          logSuccess(`Successfully deployed to ${result.successful}/${result.total} chains!`);

          if (options.manifest !== false) {
            logInfo('Deployment saved to manifest (~/.chimera/deployments.json)');
          }
        }

        // Handle verification if requested
        if (options.verify && result.successful > 0) {
          console.log(chalk.yellow('\n📝 Initiating contract verification...\n'));
          // Verification logic would be called here
          logInfo('Verification feature coming soon. Use `chimera verify` command for manual verification.');
        }
      }).catch((error) => {
        if (error.message !== 'Private key is required.') {
          logError(`Deployment failed: ${error.message}`);
        }
      });
    } catch (error: any) {
      logError(`Deployment failed: ${error.message}`);
    }
  });
