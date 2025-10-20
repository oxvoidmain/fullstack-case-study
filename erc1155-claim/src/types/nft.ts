export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
}

export interface NFTData {
  chainId: number;
  id: string;
  metadata: NFTMetadata;
  tokenAddress: string;
  tokenURI: string;
  type: string;
}

export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
}
