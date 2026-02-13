# Chimera API Reference

## Table of Contents
- [Chimera Class](#chimera-class)
- [ChainManager Class](#chainmanager-class)
- [Deployer Class](#deployer-class)
- [Configuration](#configuration)
- [Error Handling](#error-handling)

## Chimera Class

The main class that provides the core functionality for interacting with multiple chains.

### Constructor
```typescript
const chimera = new Chimera();
```

### Methods

#### `deploy(contractPath: string, options: DeploymentOptions): Promise<DeploymentResult | DeploymentResult[]>`

Deploys a smart contract to one or more chains.

**Parameters:**
- `contractPath` (string): Path to the Solidity contract file
- `options` (DeploymentOptions): Deployment options object

**Options:**
- `to` (string): Target network name or 'all' to deploy to all configured chains
- `args` (any[]): Constructor arguments for the contract (optional)
- `privateKey` (string): Private key for the deployer wallet (optional, overrides environment variable)

**Returns:**
- `Promise<DeploymentResult | DeploymentResult[]>`: Single result if deploying to one chain, array of results if deploying to multiple chains

**Example:**
```javascript
import { Chimera } from 'chimera-forge/sdk';

const chimera = new Chimera();

// Deploy to all chains
const results = await chimera.deploy('./contracts/MyContract.sol', {
  to: 'all',
  args: ['arg1', 'arg2'],
  privateKey: process.env.PRIVATE_KEY
});

// Deploy to specific chain
const result = await chimera.deploy('./contracts/MyContract.sol', {
  to: 'Ethereum Sepolia',
  args: ['arg1', 'arg2'],
  privateKey: process.env.PRIVATE_KEY
});
```

#### `connect(chainName: string): Promise<ethers.JsonRpcProvider>`

Connects to a specific chain and returns an ethers provider.

**Parameters:**
- `chainName` (string): Name of the chain to connect to

**Returns:**
- `Promise<ethers.JsonRpcProvider>`: Ethers provider for the specified chain

**Example:**
```javascript
const provider = await chimera.connect('Ethereum Sepolia');
const blockNumber = await provider.getBlockNumber();
console.log('Current block number:', blockNumber);
```

#### `getChains(): Promise<ChainConfig[]>`

Retrieves all configured chains.

**Returns:**
- `Promise<ChainConfig[]>`: Array of configured chain configurations

**Example:**
```javascript
const chains = await chimera.getChains();
console.log('Available chains:', chains);
```

## ChainManager Class

Manages the configuration of multiple blockchain networks.

### Constructor
```typescript
const chainManager = new ChainManager();
```

### Methods

#### `getChains(): Promise<ChainConfig[]>`

Retrieves all configured chains.

**Returns:**
- `Promise<ChainConfig[]>`: Array of chain configurations

#### `addChain(chain: ChainConfig): Promise<void>`

Adds a new chain to the configuration.

**Parameters:**
- `chain` (ChainConfig): Chain configuration object

**ChainConfig Interface:**
- `name` (string): Name of the chain
- `rpc` (string): RPC URL for the chain
- `chainId` (number): Chain ID
- `explorer` (string, optional): Block explorer URL

**Example:**
```javascript
await chainManager.addChain({
  name: 'My Custom Chain',
  rpc: 'https://my-custom-rpc.example.com',
  chainId: 12345,
  explorer: 'https://my-explorer.example.com'
});
```

#### `removeChain(name: string): Promise<void>`

Removes a chain from the configuration.

**Parameters:**
- `name` (string): Name of the chain to remove

## Deployer Class

Handles the deployment of smart contracts to blockchain networks.

### Constructor
```typescript
const deployer = new Deployer();
```

### Methods

#### `deployToChain(contractPath: string, chain: ChainConfig, options: DeploymentOptions): Promise<DeploymentResult>`

Deploys a contract to a specific chain.

**Parameters:**
- `contractPath` (string): Path to the Solidity contract file
- `chain` (ChainConfig): Chain configuration to deploy to
- `options` (DeploymentOptions): Deployment options

**Returns:**
- `Promise<DeploymentResult>`: Result of the deployment

**DeploymentResult Interface:**
- `chain` (string): Name of the chain where the contract was deployed
- `address` (string): Address of the deployed contract
- `txHash` (string): Transaction hash of the deployment
- `blockNumber` (number): Block number where the contract was deployed

## Configuration

Chimera stores its chain configurations in a YAML file located at `~/.chimera/chains.yaml`.

### Default Configuration
When the configuration file doesn't exist, Chimera creates a default configuration with:
- Ethereum Sepolia
- Scroll Sepolia

### Custom Configuration
You can manually edit the `~/.chimera/chains.yaml` file to add or modify chain configurations:

```yaml
chains:
  - name: Ethereum Sepolia
    rpc: https://rpc.sepolia.org
    chainId: 11155111
    explorer: https://sepolia.etherscan.io
  - name: Polygon Mumbai
    rpc: https://rpc-mumbai.maticvigil.com
    chainId: 80001
    explorer: https://mumbai.polygonscan.com
```

## Error Handling

Chimera provides comprehensive error handling for various scenarios:

### Common Errors

1. **Chain Not Found Error**
   - Thrown when trying to connect to or deploy to a chain that isn't configured
   - Message: `Chain "Chain Name" not found in configuration`

2. **Insufficient Funds Error**
   - Thrown when the wallet doesn't have enough funds for deployment
   - Message: `Insufficient funds. Required: X ETH, but you only have Y ETH.`

3. **Compilation Error**
   - Thrown when the Solidity contract fails to compile
   - Message: `Compilation error: [specific compilation errors]`

4. **RPC Connection Error**
   - Thrown when unable to connect to the RPC endpoint
   - Message: Varies depending on the specific connection issue

### Error Handling Best Practices

```javascript
import { Chimera } from 'chimera-forge/sdk';

async function safeDeploy() {
  const chimera = new Chimera();
  
  try {
    const result = await chimera.deploy('./contracts/MyContract.sol', {
      to: 'all',
      args: ['arg1', 'arg2'],
      privateKey: process.env.PRIVATE_KEY
    });
    
    console.log('Deployment successful:', result);
  } catch (error) {
    if (error.message.includes('not found in configuration')) {
      console.error('Please configure the target chain first');
    } else if (error.message.includes('Insufficient funds')) {
      console.error('Not enough funds in wallet for deployment');
    } else if (error.message.includes('Compilation error')) {
      console.error('Contract compilation failed:', error.message);
    } else {
      console.error('Deployment failed:', error.message);
    }
  }
}
```