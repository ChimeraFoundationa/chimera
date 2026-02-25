// tests/unit/chainManager.test.js
import assert from 'node:assert';
import { test } from 'node:test';
import { TestChainManager } from '../helpers/TestChainManager.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testConfigPath = path.join(os.homedir(), '.chimera-test', 'chains.yaml');

test('TestChainManager should initialize with default chains', async () => {
  const chainManager = new TestChainManager();
  
  const chains = await chainManager.getChains();
  assert.ok(Array.isArray(chains));
  assert.ok(chains.length >= 2); // At least Test Ethereum Sepolia and Test Scroll Sepolia
  
  // Clean up
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }
});

test('TestChainManager should add a new chain', async () => {
  const chainManager = new TestChainManager();
  
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
  
  // Clean up
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }
});

test('TestChainManager should remove a chain', async () => {
  const chainManager = new TestChainManager();
  
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
  
  // Clean up
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }
});

test('TestChainManager should prevent duplicate chains', async () => {
  const chainManager = new TestChainManager();
  
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
  
  // Clean up
  if (fs.existsSync(testConfigPath)) {
    fs.unlinkSync(testConfigPath);
  }
});