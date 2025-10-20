# ERC4626 Deposit Function

A TypeScript implementation for depositing assets into ERC4626-compliant vaults with comprehensive testing.

## 🚀 Features

- **ERC4626 Compliant**: Full support for tokenized vault standard
- **Type-Safe**: Built with TypeScript and Viem
- **Comprehensive Testing**: 18 tests with 97.78% coverage
- **Dynamic Account Management**: Uses Anvil's mnemonic system (no hardcoded keys)
- **Real Contract Testing**: Tests against actual deployed contracts

## 📋 Requirements

- [Bun](https://bun.sh) v1.3.0+
- [Foundry](https://getfoundry.sh) (for Anvil)

## 🚀 Quick Start (After Git Clone)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd erc4626-deposit-final
```

### 2. Install Prerequisites

**Install Bun:**
```bash
# macOS and Linux
curl -fsSL https://bun.com/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1|iex"
```

**Install Foundry:**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Build Smart Contracts
```bash
cd contracts
forge build
cd ..
```

**Note**: The contracts use Foundry's dependency management. No `.git` directory is needed in the contracts folder - everything is managed cleanly through the main repository.

### 5. Run the Project

**Terminal 1 - Start Anvil (Local Blockchain):**
```bash
anvil --accounts 10 --balance 10000 --host 127.0.0.1 --port 8545
```

**Terminal 2 - Run Tests:**
```bash
bun test
```

**Optional - Run with Coverage:**
```bash
bun test --coverage
```

## 🛠️ Installation (Detailed)

### Prerequisites Installation

1. **Install Bun** (JavaScript runtime)
   ```bash
   # macOS and Linux
   curl -fsSL https://bun.com/install | bash
   
   # Windows
   powershell -c "irm bun.sh/install.ps1|iex"
   
   # Verify installation
   bun --version
   ```

2. **Install Foundry** (Smart contract toolkit)
   ```bash
   # Install Foundry
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Verify installation
   forge --version
   anvil --version
   ```

### Project Setup

1. **Install TypeScript dependencies**
   ```bash
   bun install
   ```

2. **Build smart contracts**
   ```bash
   cd contracts
   forge build
   cd ..
   ```

3. **Start Anvil blockchain**
   ```bash
   anvil --accounts 10 --balance 10000 --host 127.0.0.1 --port 8545
   ```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage
```

**Results**: 18 tests passing, 97.78% line coverage

## 📚 Usage

### Basic Usage

```typescript
import { deposit } from './index';
import { createPublicClient, createWalletClient, http } from 'viem';
import { anvil } from 'viem/chains';

const publicClient = createPublicClient({
    chain: anvil,
    transport: http('http://127.0.0.1:8545'),
});

const walletClient = createWalletClient({
    chain: anvil,
    transport: http('http://127.0.0.1:8545'),
    account: yourAccount,
});

// Deposit with execution
const result = await deposit(publicClient, {
    wallet: '0x...',
    vault: '0x...',
    amount: 100000000n, // 100 USDC (6 decimals)
    walletClient: walletClient,
});
```

### Get Transaction Object Only

```typescript
// Get transaction without executing
const tx = await deposit(publicClient, {
    wallet: '0x...',
    vault: '0x...',
    amount: 100000000n,
    // No walletClient provided
});
```

## 🏗️ Architecture

### Core Function (`index.ts`)
- Input validation (amount, addresses)
- Balance and allowance checking
- Gas estimation with 10% buffer
- ERC4626 transaction encoding

### Error Types
```typescript
NotEnoughBalanceError
MissingAllowanceError
AmountExceedsMaxDepositError
InvalidAmountError
InvalidReceiverError
```

### Smart Contracts
- **USDC**: ERC20 with 6 decimals
- **SimpleVault**: ERC4626 with 1:1 asset-to-share ratio

## 📊 Project Structure

```
erc4626-deposit-final/
├── contracts/                 # Smart contracts
│   ├── src/                  # Solidity files
│   │   ├── SimpleVault.sol   # ERC4626 vault implementation
│   │   ├── USDC.sol          # USDC token contract
│   │   └── SimpleUSDC.sol    # Simplified USDC for testing
│   ├── out/                  # Compiled artifacts
│   └── lib/                  # Dependencies (OpenZeppelin, forge-std)
├── index.ts                  # Main deposit function
├── anvil.test.ts            # Test suite
├── anvil-utils.ts           # Account utilities
├── package.json             # TypeScript dependencies
└── README.md                # This file
```

## 🎯 Key Features

### Dynamic Account Management
```typescript
// No hardcoded private keys - uses Anvil's mnemonic
const account = mnemonicToAccount(ANVIL_MNEMONIC, {
    addressIndex: 0,
});
```

### Error Handling
```typescript
try {
    await deposit(publicClient, params);
} catch (error) {
    if (error instanceof NotEnoughBalanceError) {
        // Handle insufficient balance
    }
    // ... other error types
}
```

## 🚀 Quick Start (For Development)

1. **Start Anvil**: `anvil --accounts 10 --balance 10000`
2. **Run tests**: `bun test`
3. **Check coverage**: `bun test --coverage`

## 📦 Dependency Management

### Smart Contract Dependencies

This project uses **Foundry's clean dependency management** approach:

- **OpenZeppelin Contracts v5.4.0** - Installed via `forge install`
- **Forge Standard Library** - Included for testing utilities
- **No nested git repositories** - Everything managed through the main repo
- **Automatic submodule handling** - Git submodules managed by the main repository

### Project Structure (Clean Setup)

```
erc4626-deposit-final/
├── contracts/
│   ├── lib/
│   │   ├── forge-std/              # Foundry standard library
│   │   └── openzeppelin-contracts/ # OpenZeppelin contracts (v5.4.0)
│   ├── src/                        # Your smart contracts
│   └── foundry.toml               # Foundry configuration
├── .git/                          # Main project git repository
└── .gitmodules                    # Git submodules (auto-managed)
```

### Benefits

✅ **Clean structure** - No nested `.git` directories  
✅ **Easy cloning** - Just `git clone` and `forge build`  
✅ **Version control** - Dependencies tracked in `.gitmodules`  
✅ **Foundry best practices** - Proper dependency management  

## 🔧 Troubleshooting

### Common Issues

**1. "Unable to connect" error when running tests**
- Make sure Anvil is running: `anvil --accounts 10 --balance 10000 --host 127.0.0.1 --port 8545`
- Check if port 8545 is available: `lsof -i :8545`

**2. "forge: command not found"**
- Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`

**3. "bun: command not found"**
- Install Bun: `curl -fsSL https://bun.com/install | bash`

**4. Contract compilation errors**
- Clean and rebuild: `cd contracts && forge clean && forge build`

**5. Dependencies installation fails**
- Make sure you're using Bun: `bun install` (not npm install)
- Check Bun version: `bun --version` (should be 1.3.0+)

**6. Contract compilation errors after git clone**
- Initialize git submodules: `git submodule update --init --recursive`
- Rebuild contracts: `cd contracts && forge build`
- If OpenZeppelin contracts are missing: `forge install OpenZeppelin/openzeppelin-contracts@v5.4.0`

**7. "Cannot find package 'hardhat'" errors when running tests**
- This happens because Bun tries to run OpenZeppelin test files that require Hardhat
- **Solution**: The OpenZeppelin test files have been removed from this project
- Your project only runs its own tests: `bun test` (18 tests, all passing)

### Verification Commands

```bash
# Check if everything is installed correctly
bun --version          # Should show 1.3.0+
forge --version        # Should show forge version
anvil --version        # Should show anvil version

# Check if contracts compile
cd contracts && forge build

# Check if dependencies are installed
bun install --dry-run
```


**Built with Bun, Viem, and Foundry**