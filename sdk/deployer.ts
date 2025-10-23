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
    
    // --- PERUBAHAN DIMULAI DI SINI ---
    // Logika penentuan gas price yang lebih cerdas
    const gasLimit = 3000000n;
    let gasPrice: bigint;

    console.log(`🔧 Determining optimal transaction parameters...`);

    try {
        const feeData = await provider.getFeeData();

        // Prioritaskan maxFeePerGas (EIP-1559), lalu gasPrice (Legacy)
        if (feeData.maxFeePerGas) {
            gasPrice = feeData.maxFeePerGas;
        } else if (feeData.gasPrice) {
            gasPrice = feeData.gasPrice;
        } else {
            // Jika provider tidak memberikan data harga, gunakan fallback
            throw new Error("Provider did not return any fee data.");
        }

        // Cek jika harga yang disarankan terlalu rendah (tanda RPC bermasalah)
        const minGasPrice = ethers.parseUnits("0.01", "gwei");
        if (gasPrice < minGasPrice) {
            console.warn(`⚠️  Provider suggested a very low gas price. Applying a safe fallback.`);
            gasPrice = ethers.parseUnits("0.1", "gwei"); // Fallback yang lebih wajar
        }

    } catch (error) {
        console.warn(`⚠️  Could not get fee data from provider. Using a safe fallback.`);
        // Fallback akhir jika getFeeData() gagal
        gasPrice = ethers.parseUnits("0.1", "gwei");
    }

    console.log(`   Gas Limit: ${gasLimit}`);
    console.log(`   Final Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);

    // Periksa saldo
    const balance = await provider.getBalance(wallet.address);
    const requiredFunds = gasLimit * gasPrice;
    console.log(`   Wallet Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`   Required Funds: ${ethers.formatEther(requiredFunds)} ETH`);

    if (balance < requiredFunds) {
        throw new Error(`Insufficient funds. Required: ${ethers.formatEther(requiredFunds)} ETH, but you only have ${ethers.formatEther(balance)} ETH.`);
    }

    // Lewatkan gasLimit dan gasPrice yang sudah ditentukan
    const contract = await factory.deploy(
      ...(options.args || []),
      { gasLimit, gasPrice, type: 0 } // Tetap gunakan transaksi legacy untuk kompatibilitas
    );
    // --- PERUBAHAN SELESAI DI SINI ---
    
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
