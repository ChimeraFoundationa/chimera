import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { type ChainConfig } from './chainManager.js';
import solc from 'solc';

export interface DeploymentOptions {
  to: string;
  args?: any[];
  privateKey?: string;
}

export interface DeploymentResult {
  chain: string;
  address: string;
  txHash: string;
  blockNumber: number;
}

export class Deployer {
  private compileContract(contractPath: string): { abi: any; bytecode: string } {
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
    
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  }

  async deployToChain(
    contractPath: string,
    chain: ChainConfig,
    options: DeploymentOptions
  ): Promise<DeploymentResult> {
    const { abi, bytecode } = this.compileContract(contractPath);
    
    const provider = new ethers.JsonRpcProvider(chain.rpc);
    
    const privateKey = options.privateKey || ethers.Wallet.createRandom().privateKey;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    // --- START OF IMPROVED GAS ESTIMATION LOGIC ---
    // More intelligent gas price determination logic
    let gasLimit: bigint;
    let gasPrice: bigint;

    console.log(`🔧 Determining optimal transaction parameters...`);

    try {
        // Prepare the deployment transaction to estimate gas
        const deployTx = await factory.getDeployTransaction(...(options.args || []));
        
        // Estimate gas limit based on the prepared transaction
        const estimatedGas = await provider.estimateGas({
            ...deployTx,
            from: wallet.address
        });
        
        // Add 20% buffer to the estimated gas plus a base amount for safety
        gasLimit = (estimatedGas * 120n / 100n) + 100000n;
        
        const feeData = await provider.getFeeData();

        // Prioritize maxFeePerGas (EIP-1559), then gasPrice (Legacy)
        if (feeData.maxFeePerGas) {
            gasPrice = feeData.maxFeePerGas;
        } else if (feeData.gasPrice) {
            gasPrice = feeData.gasPrice;
        } else {
            // If provider doesn't return pricing data, use fallback
            throw new Error("Provider did not return any fee data.");
        }

        // Check if suggested price is too low (indication of RPC issues)
        const minGasPrice = ethers.parseUnits("0.01", "gwei");
        if (gasPrice < minGasPrice) {
            console.warn(`⚠️  Provider suggested a very low gas price. Applying a safe fallback.`);
            gasPrice = ethers.parseUnits("0.1", "gwei"); // More reasonable fallback
        }

    } catch (error) {
        console.warn(`⚠️  Could not estimate gas or get fee data from provider. Using safe defaults.`);
        // Conservative defaults if estimation fails
        gasLimit = 3000000n;
        // Final fallback if getFeeData() fails
        gasPrice = ethers.parseUnits("0.1", "gwei");
    }

    console.log(`   Estimated Gas Limit: ${gasLimit}`);
    console.log(`   Final Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const requiredFunds = gasLimit * gasPrice;
    console.log(`   Wallet Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`   Required Funds: ${ethers.formatEther(requiredFunds)} ETH`);

    if (balance < requiredFunds) {
        throw new Error(`Insufficient funds. Required: ${ethers.formatEther(requiredFunds)} ETH, but you only have ${ethers.formatEther(balance)} ETH.`);
    }

    // Pass the determined gasLimit and gasPrice
    const contract = await factory.deploy(
      ...(options.args || []),
      { gasLimit, gasPrice } // Use appropriate transaction type based on network support
    );
    // --- END OF IMPROVED GAS ESTIMATION LOGIC ---
    
    const deploymentTx = contract.deploymentTransaction();
    if (!deploymentTx) {
      throw new Error('Failed to get deployment transaction');
    }
    
    const receipt = await provider.waitForTransaction(deploymentTx.hash, 1, 60000);
    
    if (!receipt) {
      throw new Error('Failed to get transaction receipt');
    }
    
    return {
      chain: chain.name,
      address: await contract.getAddress(),
      txHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber
    };
  }
}
