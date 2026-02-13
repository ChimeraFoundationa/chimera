// tests/helpers/TestChainManager.js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse, stringify } from 'yaml';

export class TestChainManager {
  constructor() {
    const testConfigDir = join(homedir(), '.chimera-test');
    
    if (!existsSync(testConfigDir)) {
      mkdirSync(testConfigDir, { recursive: true });
    }

    this.configPath = join(testConfigDir, 'chains.yaml');

    if (!existsSync(this.configPath)) {
      this.createDefaultConfig();
    }
  }

  createDefaultConfig() {
    const defaultConfig = {
      chains: [
        {
          name: 'Test Ethereum Sepolia',
          rpc: 'https://rpc.sepolia.org',
          chainId: 11155111,
          explorer: 'https://sepolia.etherscan.io'
        },
        {
          name: 'Test Scroll Sepolia',
          rpc: 'https://sepolia-rpc.scroll.io',
          chainId: 534351,
          explorer: 'https://sepolia.scrollscan.com'
        }
      ]
    };

    writeFileSync(this.configPath, stringify(defaultConfig));
  }

  readConfig() {
    const fileContent = readFileSync(this.configPath, 'utf8');
    return parse(fileContent);
  }

  writeConfig(config) {
    writeFileSync(this.configPath, stringify(config));
  }

  async getChains() {
    const config = this.readConfig();
    return config.chains || [];
  }

  async addChain(chain) {
    const config = this.readConfig();

    const existingChain = config.chains.find((c) =>
      c.name === chain.name || c.chainId === chain.chainId
    );

    if (existingChain) {
      throw new Error(`Chain with name "${chain.name}" or chainId ${chain.chainId} already exists`);
    }

    config.chains.push(chain);
    this.writeConfig(config);
  }

  async removeChain(name) {
    const config = this.readConfig();

    const index = config.chains.findIndex((c) => c.name === name);

    if (index === -1) {
      throw new Error(`Chain "${name}" not found`);
    }

    config.chains.splice(index, 1);
    this.writeConfig(config);
  }
}