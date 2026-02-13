



---

```markdown
# 🐉 Chimera: The Omnichain Forge

```
╔═══════════════════════════════════════╗
║                                       ║
║              Chimera              ║
║                                       ║
╚═══════════════════════════════════════╝
```

       Chimera  The Omnichain Forge

## ✨ Features

-   🔗 **Multichain Management**: Easily add, list, and remove EVM-compatible chain configurations.
-   🚀 **Omnichain Deployment**: Deploy your smart contracts to one or all configured networks simultaneously.
-   🛠️ **Project Scaffolding**: Initialize new projects with boilerplate code using `chimera init`.
-   🛠️ **Developer-Friendly CLI**: Intuitive and beautiful command-line interface built with `commander.js`.
-   📦 **Reusable SDK**: Integrate Chimera's capabilities into your own Node.js projects.
-   ⚙️ **Robust Gas Handling**: Automatically handles gas estimation with fallback mechanisms for unreliable RPCs.
-   🔐 **Secure**: Promotes best practices by using environment variables for private keys.
-   ✅ **Automatic Chain Validation**: Validates RPC endpoints and chain IDs when adding new chains to prevent configuration errors.

## 📦 Installation

### Global Installation (Recommended)

Install Chimera globally on your system to use the `chimera` command from anywhere.
```


### Local Installation

Install as a dependency in your project.

```bash
npm install chimera-forge
```

You can then run the CLI using `npx`:

```bash
npx chimera --help
```

## 🚀 Quick Start

Let's deploy a contract across multiple chains in under a minute!

### 1. Add a Chain

Configure a new blockchain for Chimera to manage.

```bash
chimera chain:add --name "Polygon Mumbai" --chainId 80001 --rpc https://rpc-mumbai.maticvigil.com --explorer https://mumbai.polygonscan.com
```

### 2. List Configured Chains

See all the chains Chimera is ready to deploy to.

```bash
chimera chain:list
```

### 3. Deploy Your Contract

Deploy a sample contract to all configured chains with a single command.

> **Prerequisite**: Make sure your deployer wallet has testnet funds (e.g., Sepolia ETH, Mumbai MATIC). Set your private key as an environment variable for security:
> `export PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE`

```bash
chimera deploy --contract SimpleStorage.sol --network all --args "42"
```

If successful, you'll see a beautiful summary of your deployments across all chains!


## 🌍 Real-World Usage Examples

### Example 1: Cross-chain Bridge Contract Deployment

Deploy a token bridge contract across multiple networks to enable cross-chain transfers:

```bash
# Deploy to all configured chains
chimera deploy --contract TokenBridge.sol --network all --args "MyCrossChainToken" "MCT" "1000000000000000000000"

# Deploy to a specific network only
chimera deploy --contract TokenBridge.sol --network "Ethereum Sepolia" --args "MyCrossChainToken" "MCT" "1000000000000000000000"
```

### Example 2: Multi-Network Governance System

Deploy a governance contract across multiple chains for unified voting:

```bash
# First, add more chains to your configuration
chimera chain:add --name "Optimism Sepolia" --chainId 11155420 --rpc https://sepolia.optimism.io --explorer https://sepolia-optimism.etherscan.io
chimera chain:add --name "Base Sepolia" --chainId 84532 --rpc https://sepolia.base.org --explorer https://sepolia.basescan.org

# Deploy governance contract to all networks
chimera deploy --contract Governance.sol --network all --args "DAO Token" "GOV" "1000000000000000000000000"
```

### Example 3: DeFi Protocol Deployment

Deploy a lending protocol across multiple chains to maximize reach:

```bash
# Deploy to specific networks with different parameters
chimera deploy --contract LendingPool.sol --network "Ethereum Sepolia" --args "1000000000000000000" "500000000000000000"
chimera deploy --contract LendingPool.sol --network "Polygon Mumbai" --args "2000000000000000000" "1000000000000000000"
```

### Example 4: NFT Collection Deployment

Deploy an NFT collection contract across multiple chains for broader accessibility:

```bash
# Deploy to all networks with collection parameters
chimera deploy --contract NFTCollection.sol --network all --args "My NFT Collection" "NFTC" "https://api.my-nft-collection.com/metadata/" "1000"
```

### Example 5: Project Initialization and Batch Operations

Initialize a new project and perform batch operations:

```bash
# Initialize a new project
chimera init my-multichain-dapp

# Navigate to your project
cd my-multichain-dapp

# Add multiple chains in sequence
chimera chain:add --name "Arbitrum Sepolia" --chainId 421614 --rpc https://sepolia-rollup.arbitrum.io/rpc --explorer https://sepolia.arbiscan.io
chimera chain:add --name "Linea Sepolia" --chainId 59141 --rpc https://rpc.sepolia.linea.build --explorer https://sepolia.lineascan.build

# Deploy to all chains at once
chimera deploy --contract MyDApp.sol --network all --args "Initial Parameter"
```

## ⚙️ Configuration

Chimera stores its chain configurations in a YAML file located at `~/.chimera/chains.yaml`. You can manually edit this file to add or modify chain configurations.

Example `chains.yaml`:

```yaml
chains:
  - name: Ethereum Sepolia
    rpc: https://sepolia.infura.io/v3/YOUR_INFURA_ID
    chainId: 11155111
    explorer: https://sepolia.etherscan.io
  - name: Scroll Sepolia
    rpc: https://scroll-sepolia.infura.io/v3/YOUR_INFURA_ID
    chainId: 534351
    explorer: https://sepolia.scrollscan.com
  - name: Polygon Mumbai
    rpc: https://rpc-mumbai.maticvigil.com
    chainId: 80001
    explorer: https://mumbai.polygonscan.com
```

## 🎯 Best Practices & Advanced Usage

### Security Best Practices

1. **Never hardcode private keys** - Always use environment variables:
   ```bash
   export PRIVATE_KEY=your_private_key_here
   chimera deploy --contract MyContract.sol --network all
   ```

2. **Use testnets first** - Always test your deployments on test networks before mainnet:
   ```bash
   # Add mainnet configurations carefully
   chimera chain:add --name "Ethereum Mainnet" --chainId 1 --rpc https://mainnet.infura.io/v3/YOUR_INFURA_ID --explorer https://etherscan.io
   ```

3. **Verify your contracts** - After deployment, Chimera will guide you to verify on the respective block explorers using the addresses provided in the output.

### Advanced Deployment Patterns

1. **Staged Deployments** - Deploy to networks in phases:
   ```bash
   # Deploy to a single test network first
   chimera deploy --contract MyContract.sol --network "Ethereum Sepolia"
   
   # After verification, deploy to all networks
   chimera deploy --contract MyContract.sol --network all
   ```

2. **Parameterized Deployments** - Use different constructor parameters per network:
   ```bash
   # Different parameters for different risk levels
   chimera deploy --contract StakingPool.sol --network "Ethereum Sepolia" --args "1000000000000000000" "30"  # Lower stake, lower rewards
   chimera deploy --contract StakingPool.sol --network "Polygon Mumbai" --args "500000000000000000" "15"    # Higher stake, higher rewards
   ```

3. **Environment-Specific Configurations**:
   ```bash
   # Development
   export PRIVATE_KEY=dev_wallet_private_key
   chimera deploy --contract MyContract.sol --network all --args "development"
   
   # Production
   export PRIVATE_KEY=prod_wallet_private_key
   chimera deploy --contract MyContract.sol --network all --args "production"
   ```

### Troubleshooting Common Issues

1. **Insufficient Funds Error** - Ensure your wallet has enough funds on each target network:
   ```bash
   # Check your balance on each network before deployment
   # You can use block explorers or web3 libraries to verify
   ```

2. **Invalid Chain Configuration** - If you get connection errors when adding a chain, verify:
   - The RPC URL is correct and accessible
   - The chain ID matches the network you're connecting to
   - Your internet connection is stable
   ```bash
   # Chimera validates chains automatically when adding them
   chimera chain:add --name "Ethereum Sepolia" --chainId 11155111 --rpc https://rpc.sepolia.org
   ```

3. **RPC Rate Limits** - If you encounter rate limiting:
   ```bash
   # Use premium RPC services like Infura, Alchemy, or Ankr
   chimera chain:add --name "Ethereum Mainnet" --chainId 1 --rpc https://mainnet.infura.io/v3/YOUR_PROJECT_ID
   ```

4. **Network Congestion** - During high gas periods:
   ```bash
   # Consider deploying during off-peak hours
   # Or adjust your gas strategy in the contract if possible
   ```

## 📖 CLI Commands Reference

### Project Initialization

#### `chimera init`
Initializes a new Chimera project with boilerplate files and directory structure.

```bash
chimera init [project-directory] [options]
```

**Arguments:**
-   `[project-directory]`: Project directory name (defaults to current directory)

**Options:**
-   `-f, --force`: Force initialization even if directory is not empty

### Chain Management

#### `chimera chain:add`
Adds a new chain to the configuration.

```bash
chimera chain:add --name <name> --chainId <id> --rpc <url> --explorer <url>
```

**Options:**
-   `-n, --name <name>`: (Required) The name of the chain.
-   `-i, --chainId <chainId>`: (Required) The chain ID.
-   `-r, --rpc <rpc>`: (Required) The RPC URL.
-   `-e, --explorer <explorer>`: (Optional) The block explorer URL.

#### `chimera chain:list`
Lists all configured chains.

```bash
chimera chain:list
```

#### `chimera chain:remove`
Removes a chain from the configuration.

```bash
chimera chain:remove --name <name>
```

**Options:**
-   `-n, --name <name>`: (Required) The name of the chain to remove.

### Contract Deployment

#### `chimera deploy`
Deploys a smart contract to one or more chains.

```bash
chimera deploy --contract <filename> --network <network|all> --args <args...>
```

**Options:**
-   `-c, --contract <contract>`: (Required) The Solidity contract file name (e.g., `TokenBridge.sol`). The file must be in the `contracts/examples` directory.
-   `-n, --network <network>`: The target network name or `all` to deploy to every configured chain. Default: `all`.
-   `-a, --args <args...>`: (Optional) Constructor arguments for the contract.
-   `-p, --privateKey <privateKey>`: (Optional) The private key for deployment. Overrides the `PRIVATE_KEY` environment variable.

## 📚 SDK Usage

You can use the Chimera SDK programmatically in your Node.js projects.

```javascript
import { Chimera } from 'chimera-forge/sdk';

async function main() {
  const chimera = new Chimera();

  // Get all configured chains
  const chains = await chimera.getChains();
  console.log('Available chains:', chains);

  // Connect to a specific chain
  const provider = await chimera.connect('Ethereum Sepolia');
  const blockNumber = await provider.getBlockNumber();
  console.log('Current block number:', blockNumber);

  // Deploy a contract to a specific chain
  const result = await chimera.deploy('TokenBridge.sol', {
    to: 'Ethereum Sepolia',
    args: ['My Token', 'MTK', '1000000000000000000000']
  });

  console.log(`Contract deployed at: ${result.address}`);
}

main().catch(console.error);
```

## 🧱 Project Structure

```
chimera/
├── cli/              # CLI commands & entry point
├── sdk/              # Chimera SDK library
├── utils/            # Shared helper functions (logger, banner, etc.)
├── config/           # Default configuration files
├── contracts/examples/ # Example smart contracts
├── dist/             # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

Chimera includes a comprehensive test suite to ensure reliability and correctness of all features. The tests are organized into different categories:

### Unit Tests
Unit tests focus on individual components and functions. These tests are located in the `tests/unit/` directory and cover:
- `chimera.test.js` - Tests for the main Chimera class
- `chainManager.test.js` - Tests for chain management functionality
- `deployer.test.js` - Tests for contract deployment functionality

### Integration Tests
Integration tests validate the interaction between different components. These tests are located in the `tests/integration/` directory.

### Running Tests

To run all tests, use the following command:

```bash
npm test
```

This will execute all tests using Node.js's built-in test runner.

For more detailed output during testing, you can run:

```bash
npm test -- --verbose
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Made with ❤️ and 🔥 by the Web3 community.
