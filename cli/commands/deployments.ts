import { Command } from 'commander';
import chalk from 'chalk';
import { Chimera } from '../../sdk/chimera.js';
import { ManifestManager } from '../../sdk/manifest.js';
import { logSuccess, logError, logInfo } from '../../utils/logger.js';

export const deploymentsCommand = new Command('deployments')
  .description('View and manage deployment history')
  .alias('dep');

// List all deployments
deploymentsCommand
  .command('list')
  .description('List all deployments from manifest')
  .option('--chain <chain>', 'Filter by chain name')
  .option('--contract <contract>', 'Filter by contract name')
  .option('--profile <profile>', 'Filter by profile')
  .option('--limit <number>', 'Limit results', parseInt)
  .action(async (options) => {
    const manifest = new ManifestManager();
    let deployments = manifest.getAllDeployments();

    // Apply filters
    if (options.chain) {
      deployments = deployments.filter(d => d.chain === options.chain);
    }

    if (options.contract) {
      deployments = deployments.filter(d => d.contractName === options.contract);
    }

    if (options.profile) {
      deployments = deployments.filter(d => d.profile === options.profile);
    }

    // Sort by timestamp (newest first)
    deployments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (options.limit) {
      deployments = deployments.slice(0, options.limit);
    }

    if (deployments.length === 0) {
      logInfo('No deployments found');
      return;
    }

    console.log(chalk.bold.cyan(`\n📋 Deployment History (${deployments.length} deployments)\n`));

    for (const deployment of deployments) {
      console.log(chalk.white.bold(`   ${deployment.contractName}`));
      console.log(chalk.gray(`      Chain: ${deployment.chain}`));
      console.log(chalk.gray(`      Address: ${chalk.cyan(deployment.address)}`));
      console.log(chalk.gray(`      TxHash: ${chalk.dim(deployment.txHash)}`));
      console.log(chalk.gray(`      Block: ${deployment.blockNumber}`));
      console.log(chalk.gray(`      Time: ${new Date(deployment.timestamp).toLocaleString()}`));
      if (deployment.profile) {
        console.log(chalk.gray(`      Profile: ${deployment.profile}`));
      }
      if (deployment.salt) {
        console.log(chalk.gray(`      CREATE2 Salt: ${deployment.salt}`));
      }
      console.log('');
    }
  });

// Show omnichain summary
deploymentsCommand
  .command('summary')
  .description('Show omnichain deployment summary')
  .option('--limit <number>', 'Number of sessions to show', parseInt)
  .action(async (options) => {
    const chimera = new Chimera();
    const limit = options.limit || 10;

    const summary = await chimera.getOmnichainSummary(limit);

    if (summary.length === 0) {
      logInfo('No omnichain deployments found');
      return;
    }

    console.log(chalk.bold.cyan(`\n🌉 Omnichain Deployment Summary\n`));

    for (const session of summary) {
      console.log(chalk.white.bold(`   ${session.contractName}`));
      console.log(chalk.gray(`      Time: ${new Date(session.timestamp).toLocaleString()}`));
      console.log(chalk.gray(`      Chains (${session.chains.length}): ${session.chains.join(', ')}`));
      console.log(chalk.gray('      Addresses:'));
      for (const [chain, address] of Object.entries(session.addresses)) {
        console.log(chalk.gray(`         ${chain}: ${chalk.cyan(address)}`));
      }
      console.log('');
    }
  });

// Export deployments
deploymentsCommand
  .command('export <file>')
  .description('Export deployments to a JSON file')
  .action((file) => {
    const manifest = new ManifestManager();
    manifest.exportToFile(file);
    logSuccess(`Deployments exported to ${file}`);
  });

// Import deployments
deploymentsCommand
  .command('import <file>')
  .description('Import deployments from a JSON file')
  .action((file) => {
    const manifest = new ManifestManager();
    try {
      const count = manifest.importFromFile(file);
      logSuccess(`Imported ${count} deployments from ${file}`);
    } catch (error: any) {
      logError(`Import failed: ${error.message}`);
    }
  });

// Clear deployments
deploymentsCommand
  .command('clear')
  .description('Clear all deployment history (use with caution)')
  .option('--force', 'Skip confirmation')
  .action((options) => {
    if (!options.force) {
      console.log(chalk.yellow.bold('\n⚠️  Warning: This will delete all deployment history!\n'));
      console.log(chalk.gray('   Run with --force to confirm.\n'));
      return;
    }

    const manifest = new ManifestManager();
    manifest.clearDeployments();
    logSuccess('All deployment history cleared');
  });

// Show latest deployment
deploymentsCommand
  .command('latest [contract]')
  .description('Show latest deployment')
  .option('--chain <chain>', 'Filter by chain')
  .action(async (contract, options) => {
    const chimera = new Chimera();

    if (!contract) {
      const summary = await chimera.getOmnichainSummary(1);
      if (summary.length === 0) {
        logInfo('No deployments found');
        return;
      }

      const latest = summary[0];
      console.log(chalk.bold.cyan('\n📍 Latest Omnichain Deployment\n'));
      console.log(chalk.gray(`   Contract: ${latest.contractName}`));
      console.log(chalk.gray(`   Time: ${new Date(latest.timestamp).toLocaleString()}`));
      console.log(chalk.gray(`   Chains: ${latest.chains.join(', ')}`));
      console.log(chalk.gray('   Addresses:'));
      for (const [chain, address] of Object.entries(latest.addresses)) {
        console.log(chalk.gray(`      ${chain}: ${chalk.cyan(address)}`));
      }
      return;
    }

    const deployment = await chimera.getLatestDeployment(contract, options.chain);

    if (!deployment) {
      logError(`No deployment found for "${contract}"`);
      return;
    }

    console.log(chalk.bold.cyan(`\n📍 Latest Deployment: ${contract}\n`));
    console.log(chalk.gray(`   Chain: ${deployment.chain}`));
    console.log(chalk.gray(`   Address: ${chalk.cyan(deployment.address)}`));
    console.log(chalk.gray(`   TxHash: ${chalk.dim(deployment.txHash)}`));
    console.log(chalk.gray(`   Block: ${deployment.blockNumber}`));
    console.log(chalk.gray(`   Time: ${new Date(deployment.timestamp).toLocaleString()}`));
    if (deployment.profile) {
      console.log(chalk.gray(`   Profile: ${deployment.profile}`));
    }
    if (deployment.salt) {
      console.log(chalk.gray(`   CREATE2: Yes (Salt: ${deployment.salt})`));
    }
  });
