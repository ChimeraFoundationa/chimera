import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse, stringify } from 'yaml';

export interface ChainConfig {
  name: string;
  rpc: string;
  chainId: number;
  explorer?: string;
}

export class ChainManager {
  private configPath: string;

  constructor() {
    const configDir = join(homedir(), '.chimera');
    
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    this.configPath = join(configDir, 'chains.yaml');
    
    if (!existsSync(this.configPath)) {
      this.createDefaultConfig();
    }
  }

  private createDefaultConfig(): void {
    const defaultConfig = {
      chains: [
        {
          name: 'Ethereum Sepolia',
          rpc: 'https://rpc.sepolia.org',
          chainId: 11155111,
          explorer: 'https://sepolia.etherscan.io'
        },
        {
          name: 'Scroll Sepolia',
          rpc: 'https://sepolia-rpc.scroll.io',
          chainId: 534351,
          explorer: 'https://sepolia.scrollscan.com'
        }
      ]
    };
    
    writeFileSync(this.configPath, stringify(defaultConfig));
  }

  private readConfig(): any {
    const fileContent = readFileSync(this.configPath, 'utf8');
    return parse(fileContent);
  }

  private writeConfig(config: any): void {
    writeFileSync(this.configPath, stringify(config));
  }

  async getChains(): Promise<ChainConfig[]> {
    const config = this.readConfig();
    return config.chains || [];
  }

  async addChain(chain: ChainConfig): Promise<void> {
    const config = this.readConfig();
    
    const existingChain = config.chains.find((c: ChainConfig) => 
      c.name === chain.name || c.chainId === chain.chainId
    );
    
    if (existingChain) {
      throw new Error(`Chain with name "${chain.name}" or chainId ${chain.chainId} already exists`);
    }
    
    config.chains.push(chain);
    this.writeConfig(config);
  }

  async removeChain(name: string): Promise<void> {
    const config = this.readConfig();
    
    const index = config.chains.findIndex((c: ChainConfig) => c.name === name);
    
    if (index === -1) {
      throw new Error(`Chain "${name}" not found`);
    }
    
    config.chains.splice(index, 1);
    this.writeConfig(config);
  }
}
