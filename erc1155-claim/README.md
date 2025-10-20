# KILN NFT Minting dApp

A React/TypeScript dApp for viewing and minting ERC1155 NFTs on Base Sepolia testnet, featuring the KILN collection.

## Features

- 🎨 View KILN NFT collection with metadata and attributes
- 🔗 Connect wallet using Wagmi/Viem
- ⛽ Mint ERC1155 NFTs on Base Sepolia testnet
- 📱 Responsive design with Tailwind CSS
- 🚀 Built with Vite for fast development

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: Wagmi + Viem
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Blockchain**: Base Sepolia testnet

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet
- Base Sepolia testnet ETH (get from [Base Faucet](https://bridge.base.org/deposit))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd erc1155-claim
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Configuration

The app is configured to work with:
- **Contract Address**: `0x0d26A64e833f84663b3aaDc311c352b3bb81e9Cf`
- **Network**: Base Sepolia (Chain ID: 84532)
- **NFT Type**: ERC1155

## Contract Details

The KILN collection consists of 5 unique NFTs:
- KILN #1: Confident bearded avatar with blue shades
- KILN #2: Cheerful character with rainbow afro
- KILN #3: Chill persona with beanie and cigarette
- KILN #4: Rebellious figure with gold crown
- KILN #5: Techy cyber-punk with aqua skin

All NFTs are free to mint (0 ETH).

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to link your MetaMask or other supported wallet
2. **View NFTs**: Browse the KILN collection and view detailed metadata
3. **Mint NFTs**: Click "Claim Now" to mint your desired NFT
4. **Track Balance**: View your owned NFTs in the interface

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with wallet connection
│   ├── NFTCard.tsx     # Individual NFT display and minting
│   ├── CollectionInfo.tsx # Collection information
│   └── MoreFromCollection.tsx # Related NFTs
├── config/             # Configuration files
│   └── wagmi.ts       # Wagmi configuration
├── contracts/          # Smart contract ABIs
│   └── ERC1155.ts     # ERC1155 contract interface
├── data/              # Static data
│   └── nfts.ts        # KILN NFT collection data
├── types/             # TypeScript type definitions
│   └── nft.ts         # NFT-related types
└── App.tsx            # Main application component
```
