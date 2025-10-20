import { useQuery } from '@tanstack/react-query';
import { fetchNFTs } from '../services/api';
import { NFTData } from '../types/nft';

export const useNFTs = () => {
  return useQuery<NFTData[]>({
    queryKey: ['nfts'],
    queryFn: fetchNFTs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
  });
};
