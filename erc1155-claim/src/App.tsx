import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import { Header } from './components/Header';
import { NFTCard } from './components/NFTCard';
import { CollectionInfo } from './components/CollectionInfo';
import { MoreFromCollection } from './components/MoreFromCollection';
import { useNFTs } from './hooks/useNFTs';
import { NFTData } from './types/nft';

const queryClient = new QueryClient();

function AppContent() {
  const { data: nfts, isLoading, error } = useNFTs();
  
  // Start with KILN #2 as the default main NFT
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);

  // Set default NFT when data loads
  React.useEffect(() => {
    if (nfts && nfts.length > 0 && !selectedNFT) {
      setSelectedNFT(nfts.find((nft: NFTData) => nft.id === '1') || nfts[0]);
    }
  }, [nfts, selectedNFT]);

  const handleNFTSearch = (nft: NFTData) => {
    setSelectedNFT(nft);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading NFTs</p>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!nfts || !selectedNFT) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No NFTs available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left Column */}
          <div className="space-y-12">
            {/* NFT Image */}
            <div className="aspect-square bg-white overflow-hidden">
              <img
                src={selectedNFT.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                alt={selectedNFT.metadata.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Collection Info - aligned with image width */}
            <CollectionInfo />
          </div>

          {/* Right Column */}
          <div>
            {/* NFT Details */}
            <NFTCard nft={selectedNFT} />
          </div>
        </div>

        {/* More from Collection */}
        <MoreFromCollection 
          nfts={nfts || []}
          excludeId={selectedNFT.id} 
          onNFTSearch={handleNFTSearch}
        />
      </main>

      {/* Footer */}
      <footer className="bg-black py-6 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white text-sm">
            All rights reserved.<br />
            Kiln Fullstack Team, Inc. 2025.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
