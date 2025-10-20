import { NFTData } from '../types/nft';

const API_BASE_URL = 'https://mint-api-production-7d50.up.railway.app';

export const fetchNFTs = async (): Promise<NFTData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/nfts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    throw error;
  }
};

export const CONTRACT_ADDRESS = "0x0d26A64e833f84663b3aaDc311c352b3bb81e9Cf" as const;
