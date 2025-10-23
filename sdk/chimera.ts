import { ChainManager } from './chainManager.js';
import { Deployer } from './deployer.js';
import { ethers } from 'ethers';
import { type ChainConfig } from './chainManager.js';
import { type DeploymentOptions, type DeploymentResult } from './deployer.js';

export class Chimera {
  private chainManager: ChainManager;
  private deployer: Deployer;

  constructor() {
    this.chainManager = new ChainManager();
    this.deployer = new Deployer();
  }

  async deploy(
    contractPath: string, 
    options: DeploymentOptions
  ): Promise<DeploymentResult | DeploymentResult[]> {
    const chains = await this.chainManager.getChains();
    
    if (options.to === 'all') {
      const results: DeploymentResult[] = [];
      
      for (const chain of chains) {
        const result = await this.deployer.deployToChain(contractPath, chain, options);
        results.push(result);
      }
      
      return results;
    } else {
      const chain = chains.find(c => c.name === options.to);
      if (!chain) {
        throw new Error(`Chain "${options.to}" not found in configuration`);
      }
      
      return await this.deployer.deployToChain(contractPath, chain, options);
    }
  }

  async connect(chainName: string): Promise<ethers.JsonRpcProvider> {
    const chains = await this.chainManager.getChains();
    const chain = chains.find(c => c.name === chainName);
    
    if (!chain) {
      throw new Error(`Chain "${chainName}" not found in configuration`);
    }
    
    return new ethers.JsonRpcProvider(chain.rpc);
  }

  async getChains(): Promise<ChainConfig[]> {
    return this.chainManager.getChains();
  }
}
