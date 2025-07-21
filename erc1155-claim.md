# NFT Minting dApp Exercise

## Overview

Build a React/TypeScript dApp to view and mint ERC1155 NFTs on Base Sepolia testnet.

## Tech Stack

- React + TypeScript + Vite
- Wagmi/Viem for Web3
- TanStack Query
- Tailwind CSS

## API

Base URL: <https://mint-api-production-7d50.up.railway.app>

Endpoints:

- GET /nfts - List all NFTs
- GET /nfts/:id - Get single NFT

Response type:
typescript

```ts
interface NFT {
    chainId: number;
    id: string;
    metadata: {
        name: string;
        description: string;
        image: string;
        attributes: {
            trait_type: string;
            value: string;
        }[];
    };
    tokenAddress: string;
    tokenURI: string;
    type: string;
}
```

## Core Features

1. NFT Gallery & Details View
2. Wallet Connection / Wallet Status / Wallet Balance (Base Sepolia)
3. NFT Claiming (ERC1155)
4. Transaction Status Handling

## Design

Implement according to: [Figma Design](https://www.figma.com/design/X22jv9SQV9I4CelQB5H7vC/SQUADFS?node-id=0-1&p=f&t=OAn7i61WwoundE09-0)

## Evaluation

- Code quality & organization
- Web3 functionality
- Error handling
- UI/UX implementation
- Performance and best practices
- TypeScript usage
