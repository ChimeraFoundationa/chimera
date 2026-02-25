# 🐉 Chimera: The Omnichain Forge

```
╔═══════════════════════════════════════╗
║                                       ║
║              Chimera              ║
║                                       ║
╚═══════════════════════════════════════╝
```

**The Omnichain Forge - Deploy smart contracts across multiple chains in parallel**

[![npm version](https://img.shields.io/npm/v/chimera-forge.svg)](https://www.npmjs.com/package/chimera-forge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

### 🚀 Core Capabilities

-   🔗 **Multichain Management**: Easily add, list, and remove EVM-compatible chain configurations
-   ⚡ **Parallel Deployment**: Deploy to multiple chains simultaneously (10x faster)
-   🔷 **CREATE2 Support**: Deterministic addresses across all chains
-   📦 **Deployment Manifest**: Automatic tracking of all deployments
-   🎯 **Chain Groups**: Deploy to testnet/mainnet/L2 with one command
-   📋 **Deployment Profiles**: Pre-configured settings (dev/staging/prod)
-   ✅ **Batch Verification**: Verify contracts on multiple explorers
-   🛠️ **Project Scaffolding**: Initialize new projects with boilerplate code
-   🧪 **Built-in Testing**: Run tests for your smart contracts
-   🔐 **Secure**: Environment variable support for private keys

### 🌟 What's New in v0.3.3

-   ✅ **CREATE2 Deployment**: Same contract address on all chains
-   ✅ **Parallel Execution**: Deploy to all chains simultaneously
-   ✅ **Smart Path Resolution**: Flexible contract file location
-   ✅ **Deployment History**: Track all deployments with manifest
-   ✅ **Profile System**: Customizable deployment configurations
-   ✅ **Auto Verification**: Verify contracts on block explorers

---

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g chimera-forge
```

### Local Installation

```bash
npm install chimera-forge
```

Run with npx:
```bash
npx chimera --help
```

---

## 🚀 Quick Start

Deploy a contract across multiple chains in under a minute!

### 1. Add Chains

```bash
chimera chain:add --name "Ethereum Sepolia" --chainId 11155111 --rpc https://rpc.sepolia.org --explorer https://sepolia.etherscan.io
chimera chain:add --name "Avalanche Fuji" --chainId 43113 --rpc https://api.avax-test.network/ext/bc/C/rpc --explorer https://testnet.snowtrace.io
```

### 2. Deploy with CREATE2 (Same Address on All Chains!)

```bash
export PRIVATE_KEY=your_private_key
chimera deploy --contract SimpleStorage.sol --network all --args "42" --create2
```

### 3. View Results

```bash
chimera deployments summary
```

---

## 🎯 Usage Examples

### Standard Deployment

```bash
# Deploy to all chains
chimera deploy --contract MyContract.sol --network all --args "param1" "param2"

# Deploy to specific chain
chimera deploy --contract MyContract.sol --network "Ethereum Sepolia" --args "42"
```

### CREATE2 Deployment (Recommended)

```bash
# Same address on all chains
chimera deploy --contract MyContract.sol --network all --create2 --args "42"

# Custom salt
chimera deploy --contract MyContract.sol --network all --create2 --salt 0x1234...
```

### Using Profiles

```bash
# Development (fast, low gas)
chimera deploy --contract MyContract.sol --network testnet --profile dev

# Production (CREATE2, high gas)
chimera deploy --contract MyContract.sol --network mainnet --profile prod
```

### Chain Groups

```bash
# Deploy to all testnets
chimera deploy --contract MyContract.sol --network testnet

# Deploy to all L2s
chimera deploy --contract MyContract.sol --network l2
```

### Contract Verification

```bash
# Auto-verify recent deployment
chimera verify --recent --source contracts/MyContract.sol --api-key YOUR_API_KEY

# Verify specific contract
chimera verify:source \
  --address 0x123... \
  --network "Ethereum Sepolia" \
  --source contracts/MyContract.sol \
  --api-key YOUR_API_KEY
```

---

## 📋 CLI Commands

### Deployment

```bash
chimera deploy [options]

Options:
  -c, --contract <contract>      Contract file path (required)
  -n, --network <network>        Target network or group (default: "all")
  -a, --args <args...>           Constructor arguments
  -p, --privateKey <key>         Private key (or PRIVATE_KEY env var)
  --create2                      Use CREATE2 for deterministic addresses
  --salt <salt>                  Salt for CREATE2
  --profile <profile>            Profile: dev/staging/prod
  --chains <chains...>           Specific chains to deploy
  --exclude <chains...>          Chains to exclude
  --verify                       Verify after deployment
```

### Chain Management

```bash
chimera chain:add --name "Chain Name" --chainId 123 --rpc https://rpc.url --explorer https://explorer.url
chimera chain:list
chimera chain:remove --name "Chain Name"
```

### Profiles & Groups

```bash
chimera profile list
chimera profile create my-profile --gas-multiplier 1.2 --create2
chimera group list
chimera group create my-chains --chains "Chain1" "Chain2"
```

### Deployment History

```bash
chimera deployments list
chimera deployments summary
chimera deployments latest
chimera deployments export backup.json
```

### Verification

```bash
chimera verify --recent --source contracts/Contract.sol --api-key KEY
chimera verify:source --address 0x123... --network "Chain" --source contracts/Contract.sol
```

---

## 🔧 Configuration

### Chain Configuration (`~/.chimera/chains.yaml`)

```yaml
chains:
  - name: Ethereum Sepolia
    rpc: https://rpc.sepolia.org
    chainId: 11155111
    explorer: https://sepolia.etherscan.io
  - name: Avalanche Fuji
    rpc: https://api.avax-test.network/ext/bc/C/rpc
    chainId: 43113
    explorer: https://testnet.snowtrace.io
```

### Profile Configuration (`~/.chimera/profiles.yaml`)

```yaml
profiles:
  - name: dev
    gasMultiplier: 1.2
    confirmations: 1
    useCreate2: false
  - name: staging
    gasMultiplier: 1.3
    confirmations: 2
    useCreate2: true
  - name: prod
    gasMultiplier: 1.5
    confirmations: 3
    useCreate2: true
```

---

## 📊 Real Test Results

### Standard Deployment (Different Addresses)

```bash
chimera deploy --contract SimpleStorage.sol --network all --args "42"
```

**Results:**
- Scroll Sepolia: `0x19c86aea5Ad932371aaBc2413dC0B973e812cb08`
- Avalanche Fuji: `0x6D3a84B9144A001852FF14F0bF35236DcB467438`

### CREATE2 Deployment (Same Address!)

```bash
chimera deploy --contract SimpleStorage.sol --network all --args "42" --create2
```

**Results:**
- Scroll Sepolia: `0xaE50f5e8745F0D56C607034A08F9f11038498429` ✅
- Avalanche Fuji: `0xaE50f5e8745F0D56C607034A08F9f11038498429` ✅

**Same address on all chains!** 🔥

---

## 📚 SDK Usage

```javascript
import { Chimera } from 'chimera-forge';

async function main() {
  const chimera = new Chimera();

  // Deploy with CREATE2
  const result = await chimera.deploy('contracts/Token.sol', {
    network: 'testnet',
    args: ['MyToken', 'MTK', '1000000'],
    useCreate2: true,
  });

  console.log(`Deployed to ${result.successful}/${result.total} chains`);
  console.log('Addresses:', result.summary.addresses);
}

main().catch(console.error);
```

---

## 🏗️ Project Structure

```
chimera/
├── cli/              # CLI commands
├── sdk/              # Core SDK
│   ├── chimera.ts    # Main class
│   ├── deployer.ts   # Deployment logic
│   ├── manifest.ts   # Deployment tracking
│   └── verifier.ts   # Contract verification
├── utils/            # Utilities
├── contracts/        # Example contracts
└── tests/            # Test suite
```

---

## 🔍 Troubleshooting

### Common Issues

**"Insufficient funds"**
```bash
# Check balance on each chain
# Use chains with lower gas costs
chimera deploy --contract MyContract.sol --chains "Polygon Mumbai"
```

**"CREATE2 deployment failed"**
```bash
# Ensure CREATE2 factory exists on target chain
# Factory: 0x4e59b44847b379578588920cA78FbF26c0B4956C
```

**"Verification failed"**
```bash
# Get API key: https://etherscan.io/myapikey
chimera verify --api-key YOUR_KEY
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🔗 Links

- **npm**: https://www.npmjs.com/package/chimera-forge
- **GitHub**: https://github.com/ChimeraFoundationa/chimera
- **Full Documentation**: See `OMNICHAIN_GUIDE.md`

---

Made with ❤️ and 🔥 by the Web3 community.
