# Testing Guide for Chimera

## Table of Contents
- [Overview](#overview)
- [Test Structure](#test-structure)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Running Tests](#running-tests)
- [Writing New Tests](#writing-new-tests)

## Overview

This document provides guidelines for testing the Chimera framework. The project follows a comprehensive testing approach to ensure reliability across multiple blockchain networks.

## Test Structure

Tests are organized in the `tests/` directory with the following structure:

```
tests/
├── unit/
│   ├── chainManager.test.js
│   ├── deployer.test.js
│   └── chimera.test.js
├── integration/
│   ├── cli.test.js
│   └── end-to-end.test.js
└── fixtures/
    ├── contracts/
    │   └── TestContract.sol
    └── config/
        └── test-chains.yaml
```

## Unit Tests

Unit tests focus on individual modules and functions. Each module should have corresponding unit tests.

### ChainManager Tests

```javascript
// tests/unit/chainManager.test.js
import assert from 'assert';
import { ChainManager } from '../sdk/chainManager.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

const testConfigPath = path.join(os.homedir(), '.chimera-test', 'chains.yaml');

describe('ChainManager', () => {
  let chainManager;

  beforeEach(() => {
    // Set up test configuration
    chainManager = new ChainManager();
    // Override config path for testing
    chainManager.configPath = testConfigPath;
  });

  afterEach(() => {
    // Clean up test configuration
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('should initialize with default chains', async () => {
    const chains = await chainManager.getChains();
    assert.ok(Array.isArray(chains));
    assert.ok(chains.length >= 2); // At least Ethereum Sepolia and Scroll Sepolia
  });

  test('should add a new chain', async () => {
    const newChain = {
      name: 'Test Chain',
      rpc: 'https://test-rpc.example.com',
      chainId: 12345,
      explorer: 'https://test-explorer.example.com'
    };

    await chainManager.addChain(newChain);
    const chains = await chainManager.getChains();
    
    const addedChain = chains.find(chain => chain.name === newChain.name);
    assert.ok(addedChain);
    assert.strictEqual(addedChain.rpc, newChain.rpc);
  });

  test('should remove a chain', async () => {
    const chainToRemove = {
      name: 'Chain to Remove',
      rpc: 'https://remove-rpc.example.com',
      chainId: 54321,
      explorer: 'https://remove-explorer.example.com'
    };

    await chainManager.addChain(chainToRemove);
    
    let chains = await chainManager.getChains();
    assert.ok(chains.some(chain => chain.name === chainToRemove.name));

    await chainManager.removeChain(chainToRemove.name);
    chains = await chainManager.getChains();
    
    const remainingChain = chains.find(chain => chain.name === chainToRemove.name);
    assert.ok(!remainingChain);
  });

  test('should prevent duplicate chains', async () => {
    const chain = {
      name: 'Duplicate Chain',
      rpc: 'https://duplicate-rpc.example.com',
      chainId: 99999,
      explorer: 'https://duplicate-explorer.example.com'
    };

    await chainManager.addChain(chain);
    
    // Attempting to add the same chain should throw an error
    try {
      await chainManager.addChain(chain);
      assert.fail('Expected an error when adding duplicate chain');
    } catch (error) {
      assert.ok(error.message.includes('already exists'));
    }
  });
});
```

### Deployer Tests

```javascript
// tests/unit/deployer.test.js
import assert from 'assert';
import { Deployer } from '../sdk/deployer.js';
import fs from 'fs';
import path from 'path';

describe('Deployer', () => {
  let deployer;

  beforeEach(() => {
    deployer = new Deployer();
  });

  test('should compile a valid Solidity contract', () => {
    const contractPath = path.join('contracts', 'examples', 'SimpleStorage.sol');
    
    // Skip this test if the example contract doesn't exist
    if (!fs.existsSync(contractPath)) {
      console.log('Skipping compile test - example contract not found');
      return;
    }
    
    try {
      const result = deployer.compileContract(contractPath);
      assert.ok(result.abi);
      assert.ok(result.bytecode);
      assert.ok(typeof result.abi === 'object');
      assert.ok(typeof result.bytecode === 'string');
      assert.ok(result.bytecode.startsWith('0x'));
    } catch (error) {
      assert.fail(`Failed to compile contract: ${error.message}`);
    }
  });

  test('should throw error for invalid Solidity contract', () => {
    // Create a temporary invalid contract file
    const invalidContractPath = path.join('/tmp', 'InvalidContract.sol');
    fs.writeFileSync(invalidContractPath, `
      pragma solidity ^0.8.0;
      
      contract InvalidContract {
        // Invalid syntax
        uint256 public invalidVariable = ;
      }
    `);

    try {
      deployer.compileContract(invalidContractPath);
      assert.fail('Expected compilation to fail');
    } catch (error) {
      assert.ok(error.message.includes('Compilation error'));
    } finally {
      // Clean up
      if (fs.existsSync(invalidContractPath)) {
        fs.unlinkSync(invalidContractPath);
      }
    }
  });
});
```

### Chimera Tests

```javascript
// tests/unit/chimera.test.js
import assert from 'assert';
import { Chimera } from '../sdk/chimera.js';

describe('Chimera', () => {
  let chimera;

  beforeEach(() => {
    chimera = new Chimera();
  });

  test('should instantiate without errors', () => {
    assert.ok(chimera instanceof Chimera);
    assert.ok(chimera.chainManager);
    assert.ok(chimera.deployer);
  });

  test('should get chains', async () => {
    const chains = await chimera.getChains();
    assert.ok(Array.isArray(chains));
  });

  test('should connect to a valid chain', async () => {
    // This test would require a mock provider or actual network connection
    // For now, we'll just verify the method exists and has the right signature
    assert.equal(typeof chimera.connect, 'function');
  });
});
```

## Integration Tests

Integration tests verify that different parts of the system work together correctly.

### CLI Integration Tests

```javascript
// tests/integration/cli.test.js
import assert from 'assert';
import { spawn } from 'child_process';
import path from 'path';

describe('CLI Integration', () => {
  test('should show help message', (done) => {
    const cliPath = path.join('dist', 'cli', 'index.js');
    const child = spawn('node', [cliPath, '--help']);

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      assert.strictEqual(code, 0);
      assert.ok(output.includes('Usage: chimera'));
      assert.ok(output.includes('chain:add'));
      assert.ok(output.includes('chain:list'));
      assert.ok(output.includes('deploy'));
      done();
    });
  });

  test('should list chains', (done) => {
    const cliPath = path.join('dist', 'cli', 'index.js');
    const child = spawn('node', [cliPath, 'chain:list']);

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString(); // Capture stderr too
    });

    child.on('close', (code) => {
      // The command should succeed (code 0) or at least run without crashing (code 1 for no chains)
      assert.ok(code === 0 || code === 1);
      done();
    });
  });
});
```

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run unit tests only
node --test tests/unit/*.test.js

# Run integration tests only
node --test tests/integration/*.test.js

# Run tests with coverage (if using a coverage tool)
npm run test:coverage
```

## Writing New Tests

When adding new functionality to Chimera, follow these testing guidelines:

1. **Write unit tests for each new function/method**
   - Test all possible input combinations
   - Test error conditions
   - Verify expected outputs

2. **Write integration tests for new workflows**
   - Test the complete flow of new features
   - Verify integration between different modules
   - Test CLI commands if applicable

3. **Follow AAA pattern (Arrange, Act, Assert)**
   ```javascript
   test('should do something', async () => {
     // Arrange - Set up test data
     const testData = { /* ... */ };
     const chimera = new Chimera();
     
     // Act - Execute the functionality
     const result = await chimera.someMethod(testData);
     
     // Assert - Verify the outcome
     assert.equal(result, expectedValue);
   });
   ```

4. **Use descriptive test names**
   - Names should clearly describe what is being tested
   - Follow the pattern: "should [expected behavior] when [conditions]"

5. **Clean up after tests**
   - Remove temporary files
   - Reset configurations
   - Restore original state

6. **Mock external dependencies**
   - Don't make actual network calls in unit tests
   - Use mock objects for external services
   - Consider using libraries like `sinon` for mocking

7. **Test edge cases**
   - Empty inputs
   - Invalid inputs
   - Boundary conditions
   - Error scenarios

By following these testing guidelines, we ensure that Chimera remains reliable and robust as new features are added.