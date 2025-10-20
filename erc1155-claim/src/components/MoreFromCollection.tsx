import { NFTData } from '../types/nft';

interface MoreFromCollectionProps {
  nfts: NFTData[];
  excludeId?: string;
  onNFTSearch: (nft: NFTData) => void;
}

export function MoreFromCollection({ nfts, excludeId, onNFTSearch }: MoreFromCollectionProps) {
  const otherNFTs = nfts.filter(nft => nft.id !== excludeId);

  return (
    <div className="">
      <h3 className="text-2xl font-bold text-black mb-6">More from this collection</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {otherNFTs.map((nft) => (
          <div 
            key={nft.id} 
            className="bg-white overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNFTSearch(nft)}
          >
            <div className="aspect-square relative">
              <img
                src={nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                alt={nft.metadata.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 pl-0">
              <h4 className="font-semibold text-black mb-2">{nft.metadata.name}</h4>
              <p className="text-sm font-normal text-gray-600 leading-5 align-middle">0.0 ETH</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
