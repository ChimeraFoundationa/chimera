import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { logSuccess, logError, logInfo } from '../../utils/logger.js';
import { withSpinner } from '../../utils/spinner.js';
import { showBanner } from '../../utils/banner.js';

export const initCommand = new Command('init')
  .description('Initialize a new Chimera project with boilerplate files')
  .argument('[project-directory]', 'Project directory name (defaults to current directory)')
  .option('-f, --force', 'Force initialization even if directory is not empty')
  .action(async (projectDir, options) => {
    try {
      // Show banner at the start of init
      showBanner();
      
      const targetDir = projectDir ? join(process.cwd(), projectDir) : process.cwd();
      
      // Check if directory exists and is not empty
      if (existsSync(targetDir)) {
        const files = readdirSync(targetDir);
        if (files.length > 0 && !options.force) {
          logError(`Directory ${targetDir} is not empty. Use --force to initialize anyway.`);
          return;
        }
      } else {
        // Create the directory if it doesn't exist
        mkdirSync(targetDir, { recursive: true });
      }

      await withSpinner('Initializing Chimera project...', async () => {
        // Create directory structure
        createProjectStructure(targetDir);
        
        // Create boilerplate files
        createBoilerplateFiles(targetDir, projectDir || 'current directory');
      });

      console.log(chalk.green.bold('\n✨ Chimera project initialized successfully!'));
      
      // Show a cleaner, more concise message
      console.log(chalk.blue(`\n📁 Project created in: ${targetDir}`));
      console.log(chalk.blue(`\n🚀 Get started:`));
      console.log(chalk.gray(`   1. cd ${projectDir || '.'}`));
      console.log(chalk.gray(`   2. Add chains: chimera chain:add --name "Ethereum Sepolia" --chainId 11155111 --rpc https://rpc.sepolia.org`));
      console.log(chalk.gray(`   3. Create contracts in the contracts/ directory`));
      console.log(chalk.gray(`   4. Deploy: chimera deploy --contract YourContract.sol --network all`));
    } catch (error: any) {
      logError(`Failed to initialize project: ${error.message}`);
    }
  });

function createProjectStructure(projectDir: string): void {
  const directories = [
    join(projectDir, 'contracts'),
    join(projectDir, 'tests'),
    join(projectDir, 'scripts'),
    join(projectDir, 'config')
  ];

  directories.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}

function createBoilerplateFiles(projectDir: string, projectName: string): void {
  // Create package.json
  const packageJson = {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: 'A Chimera-powered multichain dApp',
    main: 'index.js',
    scripts: {
      'build': 'tsc',
      'test:js': 'node --test tests/**/*.test.js',
      'test:sol': 'echo "For Solidity tests, use: forge test (with Foundry) or npx hardhat test"',
      'test': 'npm run test:js',
      'deploy': 'chimera deploy --contract contracts/SimpleStorage.sol --network all'
    },
    keywords: ['web3', 'blockchain', 'ethereum', 'multichain'],
    author: '',
    license: 'MIT',
    dependencies: {
      'chimera-forge': '^0.1.0'
    }
  };

  writeFileSync(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create .gitignore
  const gitignore = `node_modules/
dist/
.env
*.log
coverage/
`;
  writeFileSync(join(projectDir, '.gitignore'), gitignore);

  // Create a sample contract
  const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SampleContract {
    uint256 public value;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(uint256 initialValue) {
        value = initialValue;
        owner = msg.sender;
    }

    function setValue(uint256 newValue) public onlyOwner {
        value = newValue;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}
`;
  writeFileSync(join(projectDir, 'contracts', 'SampleContract.sol'), sampleContract);

  // Create a sample test
  const sampleTest = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./SampleContract.sol";

contract SampleContractTest {
    SampleContract public sampleContract;

    function setUp() public {
        sampleContract = new SampleContract(42);
    }

    function testInitialValue() public view {
        require(sampleContract.getValue() == 42, "Initial value should be 42");
    }

    function testSetValue() public {
        sampleContract.setValue(100);
        require(sampleContract.getValue() == 100, "Value should be 100 after setting");
    }
}
`;
  writeFileSync(join(projectDir, 'tests', 'SampleContract.t.sol'), sampleTest);

  // Create a JavaScript test example for contract interactions
  const jsTestExample = `// Sample JavaScript test for contract interactions
// This demonstrates how to test contract interactions using web3 libraries
import assert from 'node:assert';
import { test } from 'node:test';

// Note: This is a template. You'll need to deploy contracts first and update addresses.
test('SampleContract should store values correctly', async () => {
  // This is a placeholder test - you'll need to connect to a deployed contract
  // and test actual interactions
  assert.ok(true); // Placeholder assertion
});

test('SampleContract value should be readable', () => {
  // Example test for contract functionality
  const initialValue = 42;
  assert.strictEqual(initialValue, 42, 'Initial value should be 42');
});
`;
  writeFileSync(join(projectDir, 'tests', 'sample-contract.interactions.test.js'), jsTestExample);

  // Create a deployment script example
  const deployScript = `// Sample deployment script
// You can use this as a reference for more complex deployments

console.log("Sample deployment script - customize as needed");
console.log("Run with: chimera deploy --contract contracts/SampleContract.sol --network all --args 100");
`;
  writeFileSync(join(projectDir, 'scripts', 'deploy.js'), deployScript);

  // Create a basic config file
  const configFile = `# Chimera Configuration
# Add your custom configurations here

# Example:
# default_network: "Ethereum Sepolia"
# gas_limit: 3000000
`;
  writeFileSync(join(projectDir, 'config', 'chimera.config'), configFile);

  // Create README.md for the project
  const projectReadme = `# ${projectName}

This is a [Chimera](https://github.com/ChimeraFoundationa/chimera)-powered multichain dApp.

## Getting Started

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Configure your chains:
   \`\`\`
   chimera chain:add --name "Ethereum Sepolia" --chainId 11155111 --rpc https://rpc.sepolia.org
   \`\`\`

3. Customize your contracts in the \`contracts/\` directory.

4. Deploy to all configured chains:
   \`\`\`
   chimera deploy --contract contracts/SampleContract.sol --network all --args 42
   \`\`\`

## Project Structure

- \`contracts/\`: Smart contracts
- \`tests/\`: Contract tests
- \`scripts/\`: Deployment scripts
- \`config/\`: Configuration files

## Learn More

Check out the [Chimera documentation](https://github.com/ChimeraFoundationa/chimera) to learn more about multichain development.
`;
  writeFileSync(join(projectDir, 'README.md'), projectReadme);
}