



---

```markdown
# 🐉 Chimera: The Omnichain Forge

## ✨ Features

-   🔗 **Multichain Management**: Easily add, list, and remove EVM-compatible chain configurations.
-   🚀 **Omnichain Deployment**: Deploy your smart contracts to one or all configured networks simultaneously.
-   🛠️ **Developer-Friendly CLI**: Intuitive and beautiful command-line interface built with `commander.js`.
-   📦 **Reusable SDK**: Integrate Chimera's capabilities into your own Node.js projects.
-   ⚙️ **Robust Gas Handling**: Automatically handles gas estimation with fallback mechanisms for unreliable RPCs.
-   🔐 **Secure**: Promotes best practices by using environment variables for private keys.

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

## 📖 CLI Commands Reference

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
```
