import { readFileSync } from 'fs';
import { ethers } from 'ethers';

export interface VerificationRequest {
  chain: string;
  chainId: number;
  address: string;
  contractName: string;
  sourceCode: string;
  compilerVersion: string;
  optimization: boolean;
  optimizationRuns: number;
  constructorArgs?: string;
  explorerUrl: string;
}

export interface VerificationResult {
  chain: string;
  address: string;
  success: boolean;
  message: string;
  explorerUrl?: string;
}

/**
 * Block explorer API configurations
 */
const EXPLORER_APIS: Record<string, { api: string; v2?: boolean; docs: string }> = {
  etherscan: { api: 'https://api.etherscan.io/api', docs: 'https://docs.etherscan.io/' },
  sepolia: { api: 'https://api-sepolia.etherscan.io/api', docs: 'https://docs.etherscan.io/' },
  polygonscan: { api: 'https://api.polygonscan.com/api', docs: 'https://docs.polygonscan.com/' },
  mumbai: { api: 'https://api-testnet.polygonscan.com/api', docs: 'https://docs.polygonscan.com/' },
  bscscan: { api: 'https://api.bscscan.com/api', docs: 'https://docs.bscscan.com/' },
  bscTestnet: { api: 'https://api-testnet.bscscan.com/api', docs: 'https://docs.bscscan.com/' },
  optimism: { api: 'https://api-optimistic.etherscan.io/api', docs: 'https://docs.optimism.etherscan.io/' },
  base: { api: 'https://api.basescan.org/api', docs: 'https://docs.basescan.org/' },
  arbiscan: { api: 'https://api.arbiscan.io/api', docs: 'https://docs.arbiscan.io/' },
  scroll: { api: 'https://api.scrollscan.com/api', v2: true, docs: 'https://docs.scrollscan.com/' },
  snowtrace: { api: 'https://api-testnet.snowtrace.io/api', docs: 'https://docs.snowtrace.io/' },
};

/**
 * Get explorer API URL for a chain
 */
function getExplorerApi(chainName: string, explorerUrl?: string): { url: string; v2?: boolean } | null {
  const chainLower = chainName.toLowerCase();

  if (chainLower.includes('sepolia') && chainLower.includes('ethereum')) {
    return { url: EXPLORER_APIS.sepolia.api };
  }
  if (chainLower.includes('mainnet') && chainLower.includes('ethereum')) {
    return { url: EXPLORER_APIS.etherscan.api };
  }
  if (chainLower.includes('polygon') && chainLower.includes('mainnet')) {
    return { url: EXPLORER_APIS.polygonscan.api };
  }
  if (chainLower.includes('mumbai')) {
    return { url: EXPLORER_APIS.mumbai.api };
  }
  if (chainLower.includes('bsc') && chainLower.includes('mainnet')) {
    return { url: EXPLORER_APIS.bscscan.api };
  }
  if (chainLower.includes('bsc') && chainLower.includes('testnet')) {
    return { url: EXPLORER_APIS.bscTestnet.api };
  }
  if (chainLower.includes('optimism') && chainLower.includes('mainnet')) {
    return { url: EXPLORER_APIS.optimism.api };
  }
  if (chainLower.includes('optimism') && chainLower.includes('sepolia')) {
    return { url: 'https://api-sepolia-optimistic.etherscan.io/api' };
  }
  if (chainLower.includes('base') && chainLower.includes('mainnet')) {
    return { url: EXPLORER_APIS.base.api };
  }
  if (chainLower.includes('base') && chainLower.includes('sepolia')) {
    return { url: 'https://api-sepolia.basescan.org/api' };
  }
  if (chainLower.includes('arbitrum') && chainLower.includes('mainnet')) {
    return { url: EXPLORER_APIS.arbiscan.api };
  }
  if (chainLower.includes('arbitrum') && chainLower.includes('sepolia')) {
    return { url: 'https://api-sepolia.arbiscan.io/api' };
  }
  if (chainLower.includes('scroll') && chainLower.includes('mainnet')) {
    return { url: EXPLORER_APIS.scroll.api, v2: EXPLORER_APIS.scroll.v2 };
  }
  if (chainLower.includes('scroll') && chainLower.includes('sepolia')) {
    return { url: 'https://api-sepolia.scrollscan.com/api', v2: true };
  }
  if (chainLower.includes('avalanche') || chainLower.includes('fuji') || chainLower.includes('avax')) {
    if (chainLower.includes('mainnet')) {
      return { url: 'https://api.snowtrace.io/api' };
    }
    return { url: 'https://api-testnet.snowtrace.io/api' };
  }
  if (chainLower.includes('linea')) {
    if (chainLower.includes('sepolia')) {
      return { url: 'https://api-sepolia.lineascan.build/api' };
    }
    return { url: 'https://api.lineascan.build/api' };
  }

  return null;
}

/**
 * Verify a contract on a block explorer
 */
export async function verifyContract(
  request: VerificationRequest,
  apiKey?: string
): Promise<VerificationResult> {
  const explorerApi = getExplorerApi(request.chain, request.explorerUrl);

  if (!explorerApi) {
    return {
      chain: request.chain,
      address: request.address,
      success: false,
      message: `No API endpoint configured for ${request.chain}`,
    };
  }

  if (!apiKey) {
    return {
      chain: request.chain,
      address: request.address,
      success: false,
      message: 'API key required. Set EXPLORER_API_KEY or chain-specific key.',
      explorerUrl: request.explorerUrl,
    };
  }

  // Build form data for POST request
  const formData = new URLSearchParams();
  formData.append('apikey', apiKey);
  formData.append('module', 'contract');
  formData.append('action', 'verifysourcecode');
  formData.append('contractaddress', request.address);
  formData.append('sourceCode', request.sourceCode);
  formData.append('codeformat', 'solidity-single-file');
  formData.append('contractname', request.contractName);
  formData.append('compilerversion', `v${request.compilerVersion}`);
  formData.append('optimization', request.optimization ? '1' : '0');
  formData.append('optimizationruns', request.optimizationRuns.toString());

  if (request.constructorArgs) {
    formData.append('constructorArguements', request.constructorArgs);
  }

  // V2 API requires chainId parameter
  if (explorerApi.v2) {
    formData.append('chainId', request.chainId.toString());
  }

  try {
    const response = await fetch(explorerApi.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.status === '1') {
      return {
        chain: request.chain,
        address: request.address,
        success: true,
        message: data.result || 'Verification submitted successfully',
        explorerUrl: request.explorerUrl,
      };
    } else {
      return {
        chain: request.chain,
        address: request.address,
        success: false,
        message: data.result || 'Verification failed',
        explorerUrl: request.explorerUrl,
      };
    }
  } catch (error: any) {
    return {
      chain: request.chain,
      address: request.address,
      success: false,
      message: `API error: ${error.message}`,
      explorerUrl: request.explorerUrl,
    };
  }
}

/**
 * Verify contracts on multiple chains in parallel
 */
export async function verifyContractsBatch(
  requests: VerificationRequest[],
  apiKey?: string
): Promise<VerificationResult[]> {
  console.log(`\n🔍 Verifying contracts on ${requests.length} chains...\n`);

  const verificationPromises = requests.map(async (request) => {
    console.log(`   ⏳ Verifying on ${request.chain}...`);
    return verifyContract(request, apiKey);
  });

  const results = await Promise.allSettled(verificationPromises);

  const verificationResults: VerificationResult[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const verificationResult = result.value;
      verificationResults.push(verificationResult);

      if (verificationResult.success) {
        console.log(`   ✅ ${verificationResult.chain}: Verified`);
      } else {
        console.log(`   ❌ ${verificationResult.chain}: ${verificationResult.message}`);
      }
    } else {
      verificationResults.push({
        chain: 'Unknown',
        address: '0x0',
        success: false,
        message: result.reason?.message || String(result.reason),
      });
      console.log(`   ❌ Verification failed: ${result.reason?.message}`);
    }
  }

  return verificationResults;
}

/**
 * Get verification URL for a contract
 */
export function getVerificationUrl(explorerUrl: string, address: string): string {
  return `${explorerUrl}/address/${address}#code`;
}

/**
 * Generate verification summary
 */
export function generateVerificationSummary(results: VerificationResult[]): string {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  let summary = '\n📋 ===== Verification Summary =====\n\n';

  if (successful.length > 0) {
    summary += `✅ Successful: ${successful.length}\n`;
    for (const result of successful) {
      const url = result.explorerUrl ? getVerificationUrl(result.explorerUrl, result.address) : 'N/A';
      summary += `   ${result.chain}: ${result.address}\n`;
      summary += `   ${url}\n\n`;
    }
  }

  if (failed.length > 0) {
    summary += `\n❌ Failed: ${failed.length}\n`;
    for (const result of failed) {
      summary += `   ${result.chain}: ${result.message}\n`;
    }
  }

  summary += '\n===================================\n';

  return summary;
}
