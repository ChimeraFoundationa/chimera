import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse, stringify } from 'yaml';

export interface ChainGroup {
  name: string;
  chains: string[]; // Chain names in this group
}

export interface DeploymentProfile {
  name: string;
  gasMultiplier?: number; // Multiply estimated gas by this factor
  gasPriceMultiplier?: number; // Multiply gas price by this factor
  confirmations?: number; // Number of confirmations to wait
  timeout?: number; // Transaction timeout in ms
  excludeChains?: string[]; // Chains to exclude for this profile
  onlyChains?: string[]; // Only deploy to these chains
  useCreate2?: boolean; // Use CREATE2 for deterministic deployment
  salt?: string; // Default salt for CREATE2
}

export interface ProfileConfig {
  profiles: DeploymentProfile[];
  groups: ChainGroup[];
  lastUpdated: string;
}

export class ProfileManager {
  private profilePath: string;

  constructor() {
    const configDir = join(homedir(), '.chimera');

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    this.profilePath = join(configDir, 'profiles.yaml');

    if (!existsSync(this.profilePath)) {
      this.createDefaultConfig();
    }
  }

  private createDefaultConfig(): void {
    const defaultConfig: ProfileConfig = {
      profiles: [
        {
          name: 'dev',
          gasMultiplier: 1.2,
          gasPriceMultiplier: 1.0,
          confirmations: 1,
          timeout: 60000,
          useCreate2: false,
        },
        {
          name: 'staging',
          gasMultiplier: 1.3,
          gasPriceMultiplier: 1.1,
          confirmations: 2,
          timeout: 90000,
          useCreate2: true,
          salt: '0x' + '00'.repeat(31) + '02',
        },
        {
          name: 'prod',
          gasMultiplier: 1.5,
          gasPriceMultiplier: 1.2,
          confirmations: 3,
          timeout: 120000,
          useCreate2: true,
          salt: '0x' + '00'.repeat(31) + '03',
        },
      ],
      groups: [
        {
          name: 'testnet',
          chains: ['Ethereum Sepolia', 'Polygon Mumbai', 'BSC Testnet', 'Optimism Sepolia', 'Base Sepolia', 'Arbitrum Sepolia'],
        },
        {
          name: 'mainnet',
          chains: ['Ethereum Mainnet', 'Polygon Mainnet', 'BSC Mainnet', 'Optimism Mainnet', 'Base Mainnet', 'Arbitrum One'],
        },
        {
          name: 'l2',
          chains: ['Optimism Sepolia', 'Base Sepolia', 'Arbitrum Sepolia', 'Optimism Mainnet', 'Base Mainnet', 'Arbitrum One'],
        },
        {
          name: 'all',
          chains: [], // Empty means all configured chains
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    writeFileSync(this.profilePath, stringify(defaultConfig));
  }

  private readConfig(): ProfileConfig {
    const fileContent = readFileSync(this.profilePath, 'utf8');
    return parse(fileContent);
  }

  private writeConfig(config: ProfileConfig): void {
    config.lastUpdated = new Date().toISOString();
    writeFileSync(this.profilePath, stringify(config));
  }

  /**
   * Get a deployment profile by name
   */
  getProfile(name: string): DeploymentProfile | null {
    const config = this.readConfig();
    return config.profiles.find(p => p.name === name) || null;
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): DeploymentProfile[] {
    const config = this.readConfig();
    return config.profiles;
  }

  /**
   * Add or update a profile
   */
  saveProfile(profile: DeploymentProfile): void {
    const config = this.readConfig();
    const existingIndex = config.profiles.findIndex(p => p.name === profile.name);

    if (existingIndex >= 0) {
      config.profiles[existingIndex] = profile;
    } else {
      config.profiles.push(profile);
    }

    this.writeConfig(config);
  }

  /**
   * Delete a profile
   */
  deleteProfile(name: string): boolean {
    const config = this.readConfig();
    const index = config.profiles.findIndex(p => p.name === name);

    if (index === -1) {
      return false;
    }

    config.profiles.splice(index, 1);
    this.writeConfig(config);
    return true;
  }

  /**
   * Get a chain group by name
   */
  getChainGroup(name: string): ChainGroup | null {
    const config = this.readConfig();
    return config.groups.find(g => g.name === name) || null;
  }

  /**
   * Get all chain groups
   */
  getAllChainGroups(): ChainGroup[] {
    const config = this.readConfig();
    return config.groups;
  }

  /**
   * Add or update a chain group
   */
  saveChainGroup(group: ChainGroup): void {
    const config = this.readConfig();
    const existingIndex = config.groups.findIndex(g => g.name === group.name);

    if (existingIndex >= 0) {
      config.groups[existingIndex] = group;
    } else {
      config.groups.push(group);
    }

    this.writeConfig(config);
  }

  /**
   * Delete a chain group
   */
  deleteChainGroup(name: string): boolean {
    const config = this.readConfig();
    const index = config.groups.findIndex(g => g.name === name);

    if (index === -1) {
      return false;
    }

    config.groups.splice(index, 1);
    this.writeConfig(config);
    return true;
  }

  /**
   * Get chains in a group
   */
  getChainsInGroup(groupName: string): string[] {
    const group = this.getChainGroup(groupName);
    if (!group) {
      return [];
    }
    return group.chains;
  }

  /**
   * Apply profile settings to deployment options
   */
  applyProfileToOptions<T extends { profile?: string; useCreate2?: boolean; salt?: string }>(
    options: T,
    profileName?: string
  ): T & { gasMultiplier?: number; confirmations?: number; timeout?: number } {
    if (!profileName) {
      return options as any;
    }

    const profile = this.getProfile(profileName);
    if (!profile) {
      console.warn(`Profile "${profileName}" not found. Using default settings.`);
      return options as any;
    }

    return {
      ...options,
      gasMultiplier: profile.gasMultiplier,
      confirmations: profile.confirmations,
      timeout: profile.timeout,
      useCreate2: options.useCreate2 ?? profile.useCreate2,
      salt: options.salt ?? profile.salt,
      excludeChains: profile.excludeChains,
      onlyChains: profile.onlyChains,
    };
  }
}
