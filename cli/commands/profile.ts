import { Command } from 'commander';
import chalk from 'chalk';
import { ProfileManager } from '../../sdk/profile.js';
import { logSuccess, logError, logInfo, logWarning } from '../../utils/logger.js';

const profileManager = new ProfileManager();

// Profile commands
const profileCommand = new Command('profile')
  .description('Manage deployment profiles');

// List profiles
profileCommand
  .command('list')
  .description('List all deployment profiles')
  .action(() => {
    const profiles = profileManager.getAllProfiles();
    
    console.log(chalk.bold.cyan('\n📋 Deployment Profiles\n'));
    
    for (const profile of profiles) {
      console.log(chalk.white.bold(`   ${profile.name}`));
      console.log(chalk.gray(`      Gas Multiplier: ${profile.gasMultiplier || 1.0}`));
      console.log(chalk.gray(`      Gas Price Multiplier: ${profile.gasPriceMultiplier || 1.0}`));
      console.log(chalk.gray(`      Confirmations: ${profile.confirmations || 1}`));
      console.log(chalk.gray(`      Timeout: ${profile.timeout || 60000}ms`));
      console.log(chalk.gray(`      CREATE2: ${profile.useCreate2 ? 'Yes' : 'No'}`));
      if (profile.salt) {
        console.log(chalk.gray(`      Salt: ${profile.salt}`));
      }
      if (profile.excludeChains) {
        console.log(chalk.gray(`      Exclude: ${profile.excludeChains.join(', ')}`));
      }
      if (profile.onlyChains) {
        console.log(chalk.gray(`      Only: ${profile.onlyChains.join(', ')}`));
      }
      console.log('');
    }
  });

// Show profile
profileCommand
  .command('show <name>')
  .description('Show details of a specific profile')
  .action((name) => {
    const profile = profileManager.getProfile(name);
    
    if (!profile) {
      logError(`Profile "${name}" not found`);
      return;
    }
    
    console.log(chalk.bold.cyan(`\n📋 Profile: ${name}\n`));
    console.log(chalk.gray(`   Gas Multiplier: ${profile.gasMultiplier || 1.0}`));
    console.log(chalk.gray(`   Gas Price Multiplier: ${profile.gasPriceMultiplier || 1.0}`));
    console.log(chalk.gray(`   Confirmations: ${profile.confirmations || 1}`));
    console.log(chalk.gray(`   Timeout: ${profile.timeout || 60000}ms`));
    console.log(chalk.gray(`   CREATE2: ${profile.useCreate2 ? 'Yes' : 'No'}`));
    if (profile.salt) {
      console.log(chalk.gray(`   Salt: ${profile.salt}`));
    }
    if (profile.excludeChains) {
      console.log(chalk.gray(`   Exclude: ${profile.excludeChains.join(', ')}`));
    }
    if (profile.onlyChains) {
      console.log(chalk.gray(`   Only: ${profile.onlyChains.join(', ')}`));
    }
  });

// Create/update profile
profileCommand
  .command('create <name>')
  .description('Create or update a deployment profile')
  .option('--gas-multiplier <number>', 'Gas limit multiplier', parseFloat)
  .option('--gas-price-multiplier <number>', 'Gas price multiplier', parseFloat)
  .option('--confirmations <number>', 'Number of confirmations to wait', parseInt)
  .option('--timeout <number>', 'Transaction timeout in ms', parseInt)
  .option('--create2', 'Use CREATE2 for deployment')
  .option('--salt <salt>', 'Default salt for CREATE2')
  .option('--exclude <chains...>', 'Chains to exclude')
  .option('--only <chains...>', 'Only deploy to these chains')
  .action((name, options) => {
    const existingProfile = profileManager.getProfile(name);
    
    const profile = {
      name,
      gasMultiplier: options.gasMultiplier || existingProfile?.gasMultiplier,
      gasPriceMultiplier: options.gasPriceMultiplier || existingProfile?.gasPriceMultiplier,
      confirmations: options.confirmations || existingProfile?.confirmations,
      timeout: options.timeout || existingProfile?.timeout,
      useCreate2: options.create2 ?? existingProfile?.useCreate2,
      salt: options.salt || existingProfile?.salt,
      excludeChains: options.exclude || existingProfile?.excludeChains,
      onlyChains: options.only || existingProfile?.onlyChains,
    };
    
    profileManager.saveProfile(profile);
    logSuccess(`Profile "${name}" saved successfully`);
  });

// Delete profile
profileCommand
  .command('delete <name>')
  .description('Delete a deployment profile')
  .action((name) => {
    const deleted = profileManager.deleteProfile(name);
    
    if (deleted) {
      logSuccess(`Profile "${name}" deleted successfully`);
    } else {
      logError(`Profile "${name}" not found`);
    }
  });

// Group commands
const groupCommand = new Command('group')
  .description('Manage chain groups');

// List groups
groupCommand
  .command('list')
  .description('List all chain groups')
  .action(() => {
    const groups = profileManager.getAllChainGroups();
    
    console.log(chalk.bold.cyan('\n📦 Chain Groups\n'));
    
    for (const group of groups) {
      console.log(chalk.white.bold(`   ${group.name}`));
      if (group.chains.length > 0) {
        console.log(chalk.gray(`      Chains: ${group.chains.join(', ')}`));
      } else {
        console.log(chalk.gray(`      Chains: All configured chains`));
      }
      console.log('');
    }
  });

// Show group
groupCommand
  .command('show <name>')
  .description('Show chains in a group')
  .action((name) => {
    const group = profileManager.getChainGroup(name);
    
    if (!group) {
      logError(`Group "${name}" not found`);
      return;
    }
    
    console.log(chalk.bold.cyan(`\n📦 Group: ${name}\n`));
    if (group.chains.length > 0) {
      console.log(chalk.gray(`   Chains (${group.chains.length}):`));
      for (const chain of group.chains) {
        console.log(chalk.gray(`      - ${chain}`));
      }
    } else {
      console.log(chalk.gray(`   All configured chains`));
    }
  });

// Create/update group
groupCommand
  .command('create <name>')
  .description('Create or update a chain group')
  .requiredOption('--chains <chains...>', 'Chain names in this group')
  .action((name, options) => {
    const group = {
      name,
      chains: options.chains,
    };
    
    profileManager.saveChainGroup(group);
    logSuccess(`Chain group "${name}" saved with ${group.chains.length} chains`);
  });

// Delete group
groupCommand
  .command('delete <name>')
  .description('Delete a chain group')
  .action((name) => {
    const deleted = profileManager.deleteChainGroup(name);
    
    if (deleted) {
      logSuccess(`Chain group "${name}" deleted successfully`);
    } else {
      logError(`Group "${name}" not found`);
    }
  });

export { profileCommand, groupCommand };
