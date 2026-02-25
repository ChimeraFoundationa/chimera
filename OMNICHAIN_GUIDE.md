# 🐉 Chimera: The Omnichain Forge - Complete Guide

## ✨ New Features Overview (v0.3.3)

Chimera is now a **fully-featured native omnichain deployment tool** with production-ready capabilities:

### 🔥 Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Parallel Deployment** | Deploy to multiple chains simultaneously (10x faster) | ✅ |
| **CREATE2 Support** | Deterministic addresses across all chains | ✅ |
| **Deployment Manifest** | Automatic tracking of all deployments | ✅ |
| **Chain Groups** | Deploy to testnet/mainnet/L2 with one command | ✅ |
| **Deployment Profiles** | Pre-configured settings (dev/staging/prod) | ✅ |
| **Batch Verification** | Verify contracts on multiple explorers | ✅ |
| **Smart Path Resolution** | Flexible contract path handling | ✅ |

---

## 🚀 Quick Start

### Basic Deployment

```bash
# Deploy to all configured chains
chimera deploy --contract MyContract.sol --network all

# Deploy to specific chains
chimera deploy --contract MyContract.sol --chains "Ethereum Sepolia" "Polygon Mumbai"

# Deploy to a chain group
chimera deploy --contract MyContract.sol --network testnet
chimera deploy --contract MyContract.sol --network mainnet
chimera deploy --contract MyContract.sol --network l2
```

### CREATE2 Deterministic Deployment

```bash
# Deploy with same address on all chains
chimera deploy --contract MyContract.sol --network all --create2

# Custom salt for CREATE2
chimera deploy --contract MyContract.sol --network all --create2 --salt 0x1234...

# Using prod profile (includes CREATE2)
chimera deploy --contract MyContract.sol --network all --profile prod
```

### Using Profiles

```bash
# Development deployment (fast, low gas)
chimera deploy --contract MyContract.sol --network testnet --profile dev

# Staging deployment (CREATE2, medium gas)
chimera deploy --contract MyContract.sol --network testnet --profile staging

# Production deployment (CREATE2, high gas, more confirmations)
chimera deploy --contract MyContract.sol --network mainnet --profile prod
```

---

## 📋 CLI Commands Reference

### Deploy Command

```bash
chimera deploy [options]

Options:
  -c, --contract <contract>      Contract file path or name (required)
  -n, --network <network>        Target: "all", chain name, or group (default: "all")
  -a, --args <args...>           Constructor arguments
  -p, --privateKey <privateKey>  Private key (or set PRIVATE_KEY env var)
  --create2                      Use CREATE2 for deterministic addresses
  --salt <salt>                  Salt for CREATE2 (hex string)
  --profile <profile>            Profile: dev/staging/prod
  --no-manifest                  Don't save to manifest
  --chains <chains...>           Specific chains to deploy to
  --exclude <chains...>          Chains to exclude
  --verify                       Verify on explorers after deployment
  --explorer-key <key>           Explorer API key for verification
```

### Profile Management

```bash
# List all profiles
chimera profile list

# Show specific profile
chimera profile show dev

# Create/update profile
chimera profile create my-profile \
  --gas-multiplier 1.3 \
  --confirmations 2 \
  --create2 \
  --salt 0x1234...

# Delete profile
chimera profile delete my-profile
```

### Chain Group Management

```bash
# List all groups
chimera group list

# Show chains in a group
chimera group show testnet

# Create custom group
chimera group create my-chains --chains "Ethereum Sepolia" "Polygon Mumbai"

# Delete group
chimera group delete my-chains
```

### Deployment History

```bash
# List all deployments
chimera deployments list

# Filter by chain
chimera deployments list --chain "Ethereum Sepolia"

# Filter by contract
chimera deployments list --contract MyToken

# Filter by profile
chimera deployments list --profile prod

# Show omnichain summary
chimera deployments summary

# Show latest deployment
chimera deployments latest

# Latest for specific contract
chimera deployments latest MyToken

# Export deployments
chimera deployments export backup.json

# Import deployments
chimera deployments import backup.json

# Clear all history (use with caution)
chimera deployments clear --force
```

### Contract Verification

```bash
# Manual verification (show deployment info)
chimera verify --recent
chimera verify --contract MyToken
chimera verify --all

# Automatic verification with API key
chimera verify --recent --source contracts/Token.sol --api-key YOUR_API_KEY
chimera verify --contract MyToken --source contracts/Token.sol --api-key KEY

# Verify with compiler options
chimera verify --recent \
  --source contracts/Token.sol \
  --api-key YOUR_API_KEY \
  --compiler-version 0.8.19 \
  --optimization \
  --runs 200

# Verify specific address
chimera verify --address 0x123... --network "Ethereum Sepolia"

# Using verify:source subcommand
chimera verify:source \
  --address 0x123... \
  --network "Ethereum Sepolia" \
  --source contracts/MyToken.sol \
  --api-key YOUR_API_KEY \
  --compiler-version 0.8.19 \
  --optimization
```

---

## 🔧 Configuration Files

### Profiles (`~/.chimera/profiles.yaml`)

```yaml
profiles:
  - name: dev
    gasMultiplier: 1.2
    gasPriceMultiplier: 1.0
    confirmations: 1
    timeout: 60000
    useCreate2: false

  - name: staging
    gasMultiplier: 1.3
    gasPriceMultiplier: 1.1
    confirmations: 2
    timeout: 90000
    useCreate2: true
    salt: 0x0000000000000000000000000000000000000000000000000000000000000002

  - name: prod
    gasMultiplier: 1.5
    gasPriceMultiplier: 1.2
    confirmations: 3
    timeout: 120000
    useCreate2: true
    salt: 0x0000000000000000000000000000000000000000000000000000000000000003

groups:
  - name: testnet
    chains:
      - Ethereum Sepolia
      - Polygon Mumbai
      - BSC Testnet
      - Avalanche Fuji
      - Scroll Sepolia

  - name: mainnet
    chains:
      - Ethereum Mainnet
      - Polygon Mainnet
      - BSC Mainnet
      - Avalanche Mainnet
      - Scroll Mainnet

  - name: l2
    chains:
      - Optimism Sepolia
      - Base Sepolia
      - Arbitrum Sepolia
      - Optimism Mainnet
      - Base Mainnet
      - Arbitrum One
```

### Deployments Manifest (`~/.chimera/deployments.json`)

```json
{
  "deployments": [
    {
      "id": "abc123...",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "contractName": "MyToken",
      "contractPath": "/path/to/MyToken.sol",
      "chain": "Ethereum Sepolia",
      "chainId": 11155111,
      "address": "0x123...",
      "txHash": "0xabc...",
      "blockNumber": 12345,
      "deployer": "0x...",
      "args": ["MyToken", "MTK", "1000000"],
      "salt": "0x00...03",
      "profile": "prod"
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

## 📊 Usage Examples

### Example 1: Multi-Chain Token Deployment with CREATE2

```bash
# Deploy ERC20 token to all testnets with CREATE2 (same address on all chains)
export PRIVATE_KEY=your_key
chimera deploy --contract Token.sol \
  --network testnet \
  --create2 \
  --args "MyToken" "MTK" "1000000" \
  --profile staging

# View deployment results
chimera deployments summary
```

### Example 2: Production Deployment with Verification

```bash
# Deploy to mainnet with production settings
chimera deploy --contract Governance.sol \
  --network mainnet \
  --profile prod \
  --args "DAO Token" "GOV" \
  --verify \
  --explorer-key YOUR_ETHERSCAN_API_KEY
```

### Example 3: Selective Chain Deployment

```bash
# Deploy only to specific L2s
chimera deploy --contract Bridge.sol \
  --chains "Optimism Mainnet" "Base Mainnet" "Arbitrum One" \
  --create2 \
  --args "0x123..." # bridge owner
```

### Example 4: Exclude High-Gas Chains

```bash
# Deploy to all except Ethereum mainnet (due to high gas)
chimera deploy --contract NFT.sol \
  --network all \
  --exclude "Ethereum Mainnet" \
  --args "My NFT" "MNFT" 1000
```

### Example 5: Custom Profile for Specific Needs

```bash
# Create a low-gas profile for frequent testing
chimera profile create quick-test \
  --gas-multiplier 1.1 \
  --confirmations 1 \
  --timeout 30000

# Use the custom profile
chimera deploy --contract TestContract.sol \
  --network testnet \
  --profile quick-test
```

### Example 6: Real Test Results

```bash
# Standard deployment (different addresses per chain)
chimera deploy --contract SimpleStorage.sol --network all --args "42"
# Result:
# - Scroll Sepolia: 0x19c86aea5Ad932371aaBc2413dC0B973e812cb08
# - Avalanche Fuji: 0x6D3a84B9144A001852FF14F0bF35236DcB467438

# CREATE2 deployment (SAME address on all chains)
chimera deploy --contract SimpleStorage.sol --network all --args "42" --create2
# Result:
# - Scroll Sepolia: 0xaE50f5e8745F0D56C607034A08F9f11038498429
# - Avalanche Fuji: 0xaE50f5e8745F0D56C607034A08F9f11038498429 ✅ SAME!
```

---

## 🎯 Best Practices

### Security

1. **Never commit private keys** - Use environment variables
   ```bash
   export PRIVATE_KEY=your_key
   chimera deploy --contract MyContract.sol --network all
   ```

2. **Use different wallets per environment**
   ```bash
   # Dev wallet
   export PRIVATE_KEY=0xdev...
   chimera deploy --contract MyContract.sol --profile dev

   # Prod wallet (use hardware wallet recommended)
   export PRIVATE_KEY=0xprod...
   chimera deploy --contract MyContract.sol --profile prod
   ```

3. **Test on testnets first**
   ```bash
   chimera deploy --contract MyContract.sol --network testnet --profile dev
   ```

### Gas Optimization

1. **Deploy during low-traffic hours** for mainnet deployments
2. **Use appropriate gas multipliers** per profile
3. **Batch deployments** to save on gas estimation overhead

### CREATE2 Best Practices

1. **Use unique salts per deployment type**
   ```bash
   # Different salts for different contract types
   chimera deploy --contract Token.sol --salt 0x00...01
   chimera deploy --contract NFT.sol --salt 0x00...02
   ```

2. **Document your salt strategy** for reproducibility
3. **Same address across chains** enables better cross-chain tooling

---

## 🔍 Troubleshooting

### Common Issues

**1. "Contract not found" error**
```bash
# Use full path or ensure contract is in search paths
chimera deploy --contract contracts/MyToken.sol
chimera deploy --contract /absolute/path/MyToken.sol
```

**2. "Insufficient funds" error**
```bash
# Check balance on each chain
# Deploy to fewer chains or use chains with lower gas costs
chimera deploy --contract MyContract.sol --chains "Polygon Mumbai"
```

**3. "CREATE2 deployment failed"**
```bash
# Ensure CREATE2 factory is deployed on target chain
# Default factory: 0x4e59b44847b379578588920cA78FbF26c0B4956C
```

**4. "Verification failed"**
```bash
# Get API key from explorer
# Ethereum: https://etherscan.io/myapikey
# Avalanche: https://snowtrace.io/myapikey
chimera verify --api-key YOUR_KEY
```

**5. "Scroll verification not working"**
```bash
# Scroll is migrating to Etherscan V2 API
# Use manual verification: https://sepolia.scrollscan.com/address/<ADDRESS>#code
```

---

## 📚 SDK Usage

```javascript
import { Chimera, ProfileManager } from 'chimera-forge';

async function main() {
  const chimera = new Chimera();
  const profileManager = new ProfileManager();

  // Deploy with CREATE2 to all testnets
  const result = await chimera.deploy('contracts/Token.sol', {
    network: 'testnet',
    args: ['MyToken', 'MTK', '1000000'],
    useCreate2: true,
    profile: 'staging',
  });

  console.log(`Deployed to ${result.successful}/${result.total} chains`);
  console.log('Addresses:', result.summary.addresses);

  // Get deployment history
  const history = await chimera.getDeploymentHistory('MyToken');
  console.log(history);

  // Get omnichain summary
  const summary = await chimera.getOmnichainSummary(10);
  console.log(summary);
}

main().catch(console.error);
```

---

## 🏗️ Architecture

```
chimera/
├── cli/                      # CLI commands & entry point
│   ├── index.ts              # Main CLI entry
│   └── commands/
│       ├── chain.ts          # Chain management
│       ├── deploy.ts         # Deployment command
│       ├── profile.ts        # Profile & group management
│       ├── verify.ts         # Contract verification
│       └── deployments.ts    # Deployment history
├── sdk/                      # Core SDK
│   ├── chimera.ts            # Main SDK class
│   ├── chainManager.ts       # Chain configuration
│   ├── deployer.ts           # Deployment logic (standard + CREATE2)
│   ├── manifest.ts           # Deployment manifest
│   ├── profile.ts            # Profile management
│   └── verifier.ts           # Contract verification
├── utils/                    # Shared utilities
│   ├── logger.ts             # Logging utilities
│   ├── spinner.ts            # Progress spinners
│   ├── banner.ts             # CLI banner
│   └── resolver.ts           # Contract path resolution
├── contracts/examples/       # Example contracts
└── tests/                    # Test suite
```

---

## 🤝 Contributing

Want to add more features? Here are some ideas:

- [ ] Support for Hardhat/Foundry integration
- [ ] Cross-chain verification automation
- [ ] Gas oracle integration for optimal timing
- [ ] Deployment simulation mode
- [ ] Multi-sig deployment support
- [ ] LayerZero/CCIP integration for cross-chain messaging

---

## 📖 Additional Resources

- **GitHub**: https://github.com/ChimeraFoundationa/chimera
- **npm**: https://www.npmjs.com/package/chimera-forge
- **Etherscan API**: https://docs.etherscan.io/
- **CREATE2 Spec**: https://eips.ethereum.org/EIPS/eip-1014

---

Made with ❤️ and 🔥 by the Web3 community.
