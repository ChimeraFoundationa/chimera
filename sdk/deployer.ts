import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { type ChainConfig } from './chainManager.js';
import solc from 'solc';

export interface DeploymentOptions {
  to: string;
  args?: any[];
  privateKey?: string;
  salt?: string; // For CREATE2
  profile?: string; // Deployment profile
  gasLimit?: bigint;
  gasPrice?: bigint;
}

export interface DeploymentResult {
  chain: string;
  chainId: number;
  address: string;
  txHash: string;
  blockNumber: number;
  success: boolean;
  error?: string;
  salt?: string;
  profile?: string;
}

export interface ParallelDeploymentResult {
  total: number;
  successful: number;
  failed: number;
  results: DeploymentResult[];
  summary: {
    chains: string[];
    addresses: Record<string, string>;
    totalGasUsed: string;
  };
}

/**
 * CREATE2 Factory Address (deterministic deployment proxy)
 * This is a minimal proxy that uses fallback function
 */
const CREATE2_FACTORY_ADDRESS = '0x4e59b44847b379578588920cA78FbF26c0B4956C';

/**
 * Default CREATE2 salt (can be customized per deployment)
 */
const DEFAULT_CREATE2_SALT = '0x' + '00'.repeat(31) + '01';

export class Deployer {
  /**
   * Compile a Solidity contract and return ABI and bytecode
   */
  private compileContract(contractPath: string): { abi: any; bytecode: string; contractName: string } {
    const contractSource = readFileSync(contractPath, 'utf8');

    const input = {
      language: 'Solidity',
      sources: {
        [contractPath]: {
          content: contractSource
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
      const errors = output.errors.filter((err: any) => err.severity === 'error');
      if (errors.length > 0) {
        throw new Error(`Compilation error: ${errors.map((e: any) => e.formattedMessage).join('\n')}`);
      }
    }

    const contracts = output.contracts[contractPath];
    const contractName = Object.keys(contracts)[0];
    const contract = contracts[contractName];

    if (!contract) {
      throw new Error(`No contract found in ${contractPath}`);
    }

    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
      contractName
    };
  }

  /**
   * Deploy to a single chain (legacy method - uses random nonces)
   */
  async deployToChain(
    contractPath: string,
    chain: ChainConfig,
    options: DeploymentOptions
  ): Promise<DeploymentResult> {
    try {
      const { abi, bytecode, contractName } = this.compileContract(contractPath);

      const provider = new ethers.JsonRpcProvider(chain.rpc);

      const privateKey = options.privateKey || process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Private key is required. Set PRIVATE_KEY env var or use --privateKey flag.');
      }

      const wallet = new ethers.Wallet(privateKey, provider);

      const factory = new ethers.ContractFactory(abi, bytecode, wallet);

      // Intelligent gas estimation
      const { gasLimit, gasPrice } = await this.estimateGas(provider, factory, options.args || [], wallet.address);

      // Check balance
      const balance = await provider.getBalance(wallet.address);
      const requiredFunds = gasLimit * gasPrice;

      if (balance < requiredFunds) {
        throw new Error(
          `Insufficient funds on ${chain.name}. Required: ${ethers.formatEther(requiredFunds)} ETH, ` +
          `Balance: ${ethers.formatEther(balance)} ETH`
        );
      }

      // Deploy the contract
      const contract = await factory.deploy(...(options.args || []), {
        gasLimit,
        gasPrice,
      });

      const deploymentTx = contract.deploymentTransaction();
      if (!deploymentTx) {
        throw new Error('Failed to get deployment transaction');
      }

      const receipt = await provider.waitForTransaction(deploymentTx.hash, 1, 120000);

      if (!receipt || !receipt.status) {
        throw new Error(`Transaction failed on ${chain.name}`);
      }

      return {
        chain: chain.name,
        chainId: chain.chainId,
        address: await contract.getAddress(),
        txHash: deploymentTx.hash,
        blockNumber: receipt.blockNumber,
        success: true,
        salt: options.salt,
        profile: options.profile,
      };
    } catch (error: any) {
      return {
        chain: chain.name,
        chainId: chain.chainId,
        address: '0x0',
        txHash: '',
        blockNumber: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deploy to a single chain using CREATE2 for deterministic addresses
   */
  async deployToChainCREATE2(
    contractPath: string,
    chain: ChainConfig,
    options: DeploymentOptions
  ): Promise<DeploymentResult> {
    try {
      const { abi, bytecode, contractName } = this.compileContract(contractPath);

      const provider = new ethers.JsonRpcProvider(chain.rpc);

      const privateKey = options.privateKey || process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Private key is required');
      }

      const wallet = new ethers.Wallet(privateKey, provider);

      // Encode constructor arguments
      const constructorArgs = this.encodeConstructorArgs(abi, options.args || []);
      
      // CREATE2 requires init code (bytecode + constructor args)
      const initCode = this.createDeployBytecode(bytecode, constructorArgs);

      const salt = options.salt || DEFAULT_CREATE2_SALT;

      console.log(`   Init code length: ${initCode.length} chars`);
      console.log(`   Salt: ${salt}`);

      // The CREATE2 factory is a minimal proxy with only fallback function
      // We need to send salt + initCode directly as calldata
      const factoryAddress = CREATE2_FACTORY_ADDRESS;
      
      // Build calldata: salt (32 bytes) + initCode (dynamic bytes)
      // The factory expects: calldata = salt + initCode
      const calldata = salt + initCode.slice(2);

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        from: wallet.address,
        to: factoryAddress,
        data: calldata,
      }).catch(() => 5000000n); // Fallback gas estimate

      const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2)) + 500000n;
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('0.1', 'gwei');

      // Check balance
      const balance = await provider.getBalance(wallet.address);
      const requiredFunds = gasLimit * gasPrice;

      if (balance < requiredFunds) {
        throw new Error(
          `Insufficient funds on ${chain.name}. Required: ${ethers.formatEther(requiredFunds)} ETH, ` +
          `Balance: ${ethers.formatEther(balance)} ETH`
        );
      }

      console.log(`   Sending CREATE2 deployment transaction...`);
      
      // Send transaction directly to factory
      const tx = await wallet.sendTransaction({
        to: factoryAddress,
        data: calldata,
        gasLimit,
        gasPrice,
      });

      console.log(`   Tx hash: ${tx.hash}`);
      
      const receipt = await provider.waitForTransaction(tx.hash, 1, 120000);

      if (!receipt || !receipt.status) {
        throw new Error(`CREATE2 deployment failed on ${chain.name}`);
      }

      // Calculate the deployed address
      const address = this.calculateCREATE2Address(salt, initCode, CREATE2_FACTORY_ADDRESS);

      return {
        chain: chain.name,
        chainId: chain.chainId,
        address: address,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        success: true,
        salt: salt,
        profile: options.profile,
      };
    } catch (error: any) {
      console.error(`   CREATE2 error: ${error.message}`);
      return {
        chain: chain.name,
        chainId: chain.chainId,
        address: '0x0',
        txHash: '',
        blockNumber: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deploy to multiple chains in parallel
   */
  async deployToChainsParallel(
    contractPath: string,
    chains: ChainConfig[],
    options: DeploymentOptions
  ): Promise<ParallelDeploymentResult> {
    console.log(`\n🚀 Initiating parallel omnichain deployment to ${chains.length} chains...\n`);

    // Create deployment promises for all chains
    const deploymentPromises = chains.map(async (chain) => {
      console.log(`   ⏳ Deploying to ${chain.name}...`);
      return this.deployToChain(contractPath, chain, options);
    });

    // Execute all deployments in parallel
    const results = await Promise.allSettled(deploymentPromises);

    // Process results
    const deploymentResults: DeploymentResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const deploymentResult = result.value;
        deploymentResults.push(deploymentResult);
        if (deploymentResult.success) {
          successful++;
          console.log(`   ✅ ${deploymentResult.chain}: ${deploymentResult.address}`);
        } else {
          failed++;
          console.log(`   ❌ ${deploymentResult.chain}: ${deploymentResult.error}`);
        }
      } else {
        failed++;
        const errorResult: DeploymentResult = {
          chain: 'Unknown',
          chainId: 0,
          address: '0x0',
          txHash: '',
          blockNumber: 0,
          success: false,
          error: result.reason?.message || String(result.reason),
        };
        deploymentResults.push(errorResult);
        console.log(`   ❌ Deployment failed: ${errorResult.error}`);
      }
    }

    // Build summary
    const successfulDeployments = deploymentResults.filter(r => r.success);
    const summary = {
      chains: successfulDeployments.map(r => r.chain),
      addresses: Object.fromEntries(successfulDeployments.map(r => [r.chain, r.address])),
      totalGasUsed: 'N/A (parallel deployment)',
    };

    return {
      total: chains.length,
      successful,
      failed,
      results: deploymentResults,
      summary,
    };
  }

  /**
   * Deploy to multiple chains in parallel using CREATE2
   */
  async deployToChainsCREATE2Parallel(
    contractPath: string,
    chains: ChainConfig[],
    options: DeploymentOptions
  ): Promise<ParallelDeploymentResult> {
    console.log(`\n🔷 Initiating CREATE2 omnichain deployment to ${chains.length} chains...\n`);
    console.log(`   Salt: ${options.salt || DEFAULT_CREATE2_SALT}`);
    console.log(`   Expected address: Same across all chains\n`);

    // Create deployment promises for all chains
    const deploymentPromises = chains.map(async (chain) => {
      console.log(`   ⏳ Deploying to ${chain.name} via CREATE2...`);
      return this.deployToChainCREATE2(contractPath, chain, options);
    });

    // Execute all deployments in parallel
    const results = await Promise.allSettled(deploymentPromises);

    // Process results
    const deploymentResults: DeploymentResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const deploymentResult = result.value;
        deploymentResults.push(deploymentResult);
        if (deploymentResult.success) {
          successful++;
          console.log(`   ✅ ${deploymentResult.chain}: ${deploymentResult.address}`);
        } else {
          failed++;
          console.log(`   ❌ ${deploymentResult.chain}: ${deploymentResult.error}`);
        }
      } else {
        failed++;
        const errorResult: DeploymentResult = {
          chain: 'Unknown',
          chainId: 0,
          address: '0x0',
          txHash: '',
          blockNumber: 0,
          success: false,
          error: result.reason?.message || String(result.reason),
        };
        deploymentResults.push(errorResult);
        console.log(`   ❌ Deployment failed: ${errorResult.error}`);
      }
    }

    // Build summary
    const successfulDeployments = deploymentResults.filter(r => r.success);
    const summary = {
      chains: successfulDeployments.map(r => r.chain),
      addresses: Object.fromEntries(successfulDeployments.map(r => [r.chain, r.address])),
      totalGasUsed: 'N/A (parallel deployment)',
    };

    return {
      total: chains.length,
      successful,
      failed,
      results: deploymentResults,
      summary,
    };
  }

  /**
   * Estimate gas for a deployment transaction
   */
  private async estimateGas(
    provider: ethers.JsonRpcProvider,
    factory: ethers.ContractFactory,
    args: any[],
    fromAddress: string
  ): Promise<{ gasLimit: bigint; gasPrice: bigint }> {
    let gasLimit: bigint;
    let gasPrice: bigint;

    try {
      const deployTx = await factory.getDeployTransaction(...args);
      const estimatedGas = await provider.estimateGas({
        ...deployTx,
        from: fromAddress,
      });

      gasLimit = (estimatedGas * 120n / 100n) + 100000n;

      const feeData = await provider.getFeeData();

      if (feeData.maxFeePerGas) {
        gasPrice = feeData.maxFeePerGas;
      } else if (feeData.gasPrice) {
        gasPrice = feeData.gasPrice;
      } else {
        throw new Error('Provider did not return fee data');
      }

      const minGasPrice = ethers.parseUnits('0.01', 'gwei');
      if (gasPrice < minGasPrice) {
        console.warn(`⚠️  Provider suggested low gas price. Applying safe fallback.`);
        gasPrice = ethers.parseUnits('0.1', 'gwei');
      }
    } catch (error) {
      console.warn(`⚠️  Could not estimate gas. Using safe defaults.`);
      gasLimit = 3000000n;
      gasPrice = ethers.parseUnits('0.1', 'gwei');
    }

    return { gasLimit, gasPrice };
  }

  /**
   * Estimate gas for CREATE2 deployment
   */
  private async estimateCREATE2Gas(
    provider: ethers.JsonRpcProvider,
    factory: ethers.Contract,
    salt: string,
    deployBytecode: string,
    fromAddress: string
  ): Promise<{ gasLimit: bigint; gasPrice: bigint }> {
    let gasLimit: bigint;
    let gasPrice: bigint;

    try {
      const estimatedGas = await factory.deploy.estimateGas(salt, deployBytecode, {
        from: fromAddress,
      });

      gasLimit = (estimatedGas * 120n / 100n) + 200000n;

      const feeData = await provider.getFeeData();

      if (feeData.maxFeePerGas) {
        gasPrice = feeData.maxFeePerGas;
      } else if (feeData.gasPrice) {
        gasPrice = feeData.gasPrice;
      } else {
        throw new Error('Provider did not return fee data');
      }

      const minGasPrice = ethers.parseUnits('0.01', 'gwei');
      if (gasPrice < minGasPrice) {
        gasPrice = ethers.parseUnits('0.1', 'gwei');
      }
    } catch (error) {
      console.warn(`⚠️  Could not estimate CREATE2 gas. Using safe defaults.`);
      gasLimit = 5000000n;
      gasPrice = ethers.parseUnits('0.1', 'gwei');
    }

    return { gasLimit, gasPrice };
  }

  /**
   * Encode constructor arguments for CREATE2
   */
  private encodeConstructorArgs(abi: any[], args: any[]): string {
    if (!args || args.length === 0) {
      return '0x';
    }

    const constructorAbi = abi.find(item => item.type === 'constructor');
    if (!constructorAbi || !constructorAbi.inputs) {
      return '0x';
    }

    return ethers.AbiCoder.defaultAbiCoder().encode(constructorAbi.inputs, args);
  }

  /**
   * Create deployment bytecode for CREATE2
   */
  private createDeployBytecode(bytecode: string, constructorArgs: string): string {
    // Concatenate bytecode with constructor args
    const bytecodeClean = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
    const argsClean = constructorArgs.startsWith('0x') ? constructorArgs.slice(2) : constructorArgs;
    return '0x' + bytecodeClean + argsClean;
  }

  /**
   * Calculate CREATE2 deployed address
   */
  private calculateCREATE2Address(salt: string, bytecode: string, factoryAddress: string): string {
    const initCodeHash = ethers.keccak256(bytecode);
    const addressBytes = ethers.keccak256(
      ethers.solidityPacked(
        ['bytes1', 'address', 'bytes32', 'bytes32'],
        ['0xff', factoryAddress, salt, initCodeHash]
      )
    ).slice(-40);

    return ethers.getAddress(addressBytes);
  }
}
