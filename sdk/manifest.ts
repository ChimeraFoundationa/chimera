import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse, stringify } from 'yaml';

export interface DeploymentRecord {
  id: string;
  timestamp: string;
  contractName: string;
  contractPath: string;
  chain: string;
  chainId: number;
  address: string;
  txHash: string;
  blockNumber: number;
  deployer: string;
  args?: any[];
  salt?: string; // For CREATE2 deployments
  profile?: string; // Deployment profile (dev, staging, prod)
}

export interface DeploymentManifest {
  deployments: DeploymentRecord[];
  lastUpdated: string;
}

export class ManifestManager {
  private manifestPath: string;

  constructor() {
    const configDir = join(homedir(), '.chimera');

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    this.manifestPath = join(configDir, 'deployments.json');
  }

  private readManifest(): DeploymentManifest {
    if (!existsSync(this.manifestPath)) {
      return { deployments: [], lastUpdated: new Date().toISOString() };
    }

    const content = readFileSync(this.manifestPath, 'utf8');
    return JSON.parse(content);
  }

  private writeManifest(manifest: DeploymentManifest): void {
    manifest.lastUpdated = new Date().toISOString();
    writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Add a deployment record to the manifest
   */
  addDeployment(record: Omit<DeploymentRecord, 'id'>): DeploymentRecord {
    const manifest = this.readManifest();
    
    const newRecord: DeploymentRecord = {
      ...record,
      id: this.generateId(record.chain, record.address, record.txHash),
    };

    manifest.deployments.push(newRecord);
    this.writeManifest(manifest);

    return newRecord;
  }

  /**
   * Add multiple deployment records (for omnichain deployments)
   */
  addDeployments(records: Omit<DeploymentRecord, 'id'>[]): DeploymentRecord[] {
    const manifest = this.readManifest();
    
    const newRecords: DeploymentRecord[] = records.map(record => ({
      ...record,
      id: this.generateId(record.chain, record.address, record.txHash),
    }));

    manifest.deployments.push(...newRecords);
    this.writeManifest(manifest);

    return newRecords;
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): DeploymentRecord[] {
    const manifest = this.readManifest();
    return manifest.deployments;
  }

  /**
   * Get deployments by chain
   */
  getDeploymentsByChain(chainName: string): DeploymentRecord[] {
    const manifest = this.readManifest();
    return manifest.deployments.filter(d => d.chain === chainName);
  }

  /**
   * Get deployments by contract
   */
  getDeploymentsByContract(contractName: string): DeploymentRecord[] {
    const manifest = this.readManifest();
    return manifest.deployments.filter(d => d.contractName === contractName);
  }

  /**
   * Get deployments by profile
   */
  getDeploymentsByProfile(profile: string): DeploymentRecord[] {
    const manifest = this.readManifest();
    return manifest.deployments.filter(d => d.profile === profile);
  }

  /**
   * Get latest deployment for a contract on a chain
   */
  getLatestDeployment(contractName: string, chainName?: string): DeploymentRecord | null {
    const manifest = this.readManifest();
    let deployments = manifest.deployments.filter(d => d.contractName === contractName);
    
    if (chainName) {
      deployments = deployments.filter(d => d.chain === chainName);
    }

    if (deployments.length === 0) {
      return null;
    }

    // Sort by timestamp descending
    deployments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return deployments[0];
  }

  /**
   * Get omnichain deployment summary (grouped by deployment session)
   */
  getOmnichainSummary(limit: number = 10): { timestamp: string; contractName: string; chains: string[]; addresses: Record<string, string> }[] {
    const manifest = this.readManifest();
    const summary: Map<string, { timestamp: string; contractName: string; chains: string[]; addresses: Record<string, string> }> = new Map();

    // Group by contract name and approximate timestamp (within 5 minutes)
    for (const deployment of manifest.deployments) {
      const key = `${deployment.contractName}-${deployment.timestamp.slice(0, 16)}`; // Group by minute

      if (!summary.has(key)) {
        summary.set(key, {
          timestamp: deployment.timestamp,
          contractName: deployment.contractName,
          chains: [],
          addresses: {},
        });
      }

      const group = summary.get(key)!;
      group.chains.push(deployment.chain);
      group.addresses[deployment.chain] = deployment.address;
    }

    // Convert to array and sort by timestamp
    const result = Array.from(summary.values());
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return result.slice(0, limit);
  }

  /**
   * Clear all deployments (use with caution)
   */
  clearDeployments(): void {
    this.writeManifest({ deployments: [], lastUpdated: new Date().toISOString() });
  }

  /**
   * Export deployments to a file
   */
  exportToFile(filePath: string): void {
    const manifest = this.readManifest();
    writeFileSync(filePath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Import deployments from a file
   */
  importFromFile(filePath: string): number {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf8');
    const imported: DeploymentManifest = JSON.parse(content);
    const manifest = this.readManifest();

    // Merge deployments (avoid duplicates by id)
    const existingIds = new Set(manifest.deployments.map(d => d.id));
    let importedCount = 0;

    for (const deployment of imported.deployments) {
      if (!existingIds.has(deployment.id)) {
        manifest.deployments.push(deployment);
        importedCount++;
      }
    }

    this.writeManifest(manifest);
    return importedCount;
  }

  private generateId(chain: string, address: string, txHash: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${chain}-${address}-${txHash}`).digest('hex').slice(0, 16);
  }
}
