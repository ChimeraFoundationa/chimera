import { ChainManager, type ChainConfig } from './chainManager.js';
import { Deployer, type DeploymentOptions, type ParallelDeploymentResult } from './deployer.js';
import { ManifestManager, type DeploymentRecord } from './manifest.js';
import { ethers } from 'ethers';

export interface OmnichainDeploymentOptions extends DeploymentOptions {
  useCreate2?: boolean;
  saveManifest?: boolean;
  chains?: string[]; // Specific chains to deploy to
  excludeChains?: string[]; // Chains to exclude
  chainGroup?: string; // Deploy to a chain group (testnet, mainnet, l2)
}

export class Chimera {
  private chainManager: ChainManager;
  private deployer: Deployer;
  private manifestManager: ManifestManager;

  constructor() {
    this.chainManager = new ChainManager();
    this.deployer = new Deployer();
    this.manifestManager = new ManifestManager();
  }

  /**
   * Deploy a contract to one or multiple chains
   */
  async deploy(
    contractPath: string,
    options: OmnichainDeploymentOptions
  ): Promise<ParallelDeploymentResult> {
    const chains = await this.getFilteredChains(options);

    if (chains.length === 0) {
      throw new Error('No chains configured for deployment');
    }

    let result: ParallelDeploymentResult;

    if (options.useCreate2) {
      result = await this.deployer.deployToChainsCREATE2Parallel(contractPath, chains, options);
    } else {
      result = await this.deployer.deployToChainsParallel(contractPath, chains, options);
    }

    // Save to manifest if requested
    if (options.saveManifest !== false) {
      this.saveDeploymentsToManifest(contractPath, result, options);
    }

    return result;
  }

  /**
   * Get chains filtered by options
   */
  private async getFilteredChains(options: OmnichainDeploymentOptions): Promise<ChainConfig[]> {
    let chains = await this.chainManager.getChains();

    // Filter by specific chains
    if (options.chains && options.chains.length > 0) {
      chains = chains.filter(c => options.chains!.includes(c.name));
    }

    // Exclude specific chains
    if (options.excludeChains && options.excludeChains.length > 0) {
      chains = chains.filter(c => !options.excludeChains!.includes(c.name));
    }

    // Filter by chain group
    if (options.chainGroup) {
      chains = this.filterByChainGroup(chains, options.chainGroup);
    }

    // Handle legacy "to" option
    if (options.to && options.to !== 'all') {
      const chain = chains.find(c => c.name === options.to);
      if (!chain) {
        throw new Error(`Chain "${options.to}" not found in configuration`);
      }
      chains = [chain];
    }

    return chains;
  }

  /**
   * Filter chains by group (testnet, mainnet, l2)
   */
  private filterByChainGroup(chains: ChainConfig[], group: string): ChainConfig[] {
    const testnetChainIds = [
      11155111, // Ethereum Sepolia
      11155420, // Optimism Sepolia
      84532,    // Base Sepolia
      421614,   // Arbitrum Sepolia
      59141,    // Linea Sepolia
      534351,   // Scroll Sepolia
      80001,    // Polygon Mumbai
      97,       // BSC Testnet
      43113,    // Avalanche Fuji
      420,      // Optimism Goerli (deprecated but kept for compatibility)
    ];

    const mainnetChainIds = [
      1,        // Ethereum Mainnet
      10,       // Optimism Mainnet
      8453,     // Base Mainnet
      42161,    // Arbitrum One
      59144,    // Linea Mainnet
      534352,   // Scroll Mainnet
      137,      // Polygon Mainnet
      56,       // BSC Mainnet
      43114,    // Avalanche Mainnet
    ];

    const l2ChainIds = [
      10,       // Optimism
      8453,     // Base
      42161,    // Arbitrum
      59144,    // Linea
      534352,   // Scroll
      11155420, // Optimism Sepolia
      84532,    // Base Sepolia
      421614,   // Arbitrum Sepolia
      59141,    // Linea Sepolia
      534351,   // Scroll Sepolia
    ];

    switch (group.toLowerCase()) {
      case 'testnet':
        return chains.filter(c => testnetChainIds.includes(c.chainId));
      case 'mainnet':
        return chains.filter(c => mainnetChainIds.includes(c.chainId));
      case 'l2':
      case 'layer2':
        return chains.filter(c => l2ChainIds.includes(c.chainId));
      case 'l1':
      case 'layer1':
        return chains.filter(c => !l2ChainIds.includes(c.chainId));
      default:
        console.warn(`Unknown chain group: ${group}. Returning all chains.`);
        return chains;
    }
  }

  /**
   * Save deployment results to manifest
   */
  private saveDeploymentsToManifest(
    contractPath: string,
    result: ParallelDeploymentResult,
    options: OmnichainDeploymentOptions
  ): void {
    const contractName = contractPath.split('/').pop()?.replace('.sol', '') || 'Unknown';
    const privateKey = options.privateKey || process.env.PRIVATE_KEY;
    const deployerAddress = privateKey 
      ? new ethers.Wallet(privateKey).address 
      : '0xUnknown';

    const records: Omit<DeploymentRecord, 'id'>[] = result.results
      .filter(r => r.success)
      .map(r => ({
        timestamp: new Date().toISOString(),
        contractName,
        contractPath,
        chain: r.chain,
        chainId: r.chainId,
        address: r.address,
        txHash: r.txHash,
        blockNumber: r.blockNumber,
        deployer: deployerAddress,
        args: options.args,
        salt: r.salt,
        profile: options.profile,
      }));

    if (records.length > 0) {
      this.manifestManager.addDeployments(records);
    }
  }

  /**
   * Connect to a specific chain
   */
  async connect(chainName: string): Promise<ethers.JsonRpcProvider> {
    const chains = await this.chainManager.getChains();
    const chain = chains.find(c => c.name === chainName);

    if (!chain) {
      throw new Error(`Chain "${chainName}" not found in configuration`);
    }

    return new ethers.JsonRpcProvider(chain.rpc);
  }

  /**
   * Get all configured chains
   */
  async getChains(): Promise<ChainConfig[]> {
    return this.chainManager.getChains();
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(contractName?: string, chainName?: string): Promise<DeploymentRecord[]> {
    if (contractName) {
      return this.manifestManager.getDeploymentsByContract(contractName);
    }
    if (chainName) {
      return this.manifestManager.getDeploymentsByChain(chainName);
    }
    return this.manifestManager.getAllDeployments();
  }

  /**
   * Get omnichain deployment summary
   */
  async getOmnichainSummary(limit: number = 10) {
    return this.manifestManager.getOmnichainSummary(limit);
  }

  /**
   * Add a new chain configuration
   */
  async addChain(chain: ChainConfig): Promise<void> {
    await this.chainManager.addChain(chain);
  }

  /**
   * Remove a chain configuration
   */
  async removeChain(name: string): Promise<void> {
    await this.chainManager.removeChain(name);
  }

  /**
   * Get latest deployment for a contract
   */
  async getLatestDeployment(contractName: string, chainName?: string): Promise<DeploymentRecord | null> {
    return this.manifestManager.getLatestDeployment(contractName, chainName);
  }
}
