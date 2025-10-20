import { NFTData } from '../types/nft';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { KILN_CLAIM_ABI } from '../contracts/ERC1155';
import { CONTRACT_ADDRESS } from '../services/api';
import { baseSepolia } from 'wagmi/chains';
import { useState, useEffect } from 'react';

interface NFTCardProps {
  nft: NFTData;
}

export function NFTCard({ nft }: NFTCardProps) {
  const { address, isConnected, chainId } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const [isMinting, setIsMinting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showMintSuccessToast, setShowMintSuccessToast] = useState(false);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: KILN_CLAIM_ABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(nft.id)] : undefined,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
      setShowMintSuccessToast(true);
      setTimeout(() => setShowMintSuccessToast(false), 3000);
    }
  }, [isConfirmed, refetchBalance]);

  useEffect(() => {
    if (isConnected && address) {
      const favorites = JSON.parse(localStorage.getItem(`nft-favorites-${address}`) || '[]');
      setIsFavorited(favorites.includes(nft.id));
    } else {
      setIsFavorited(false);
    }
  }, [nft.id, isConnected, address]);

  const handleShare = async () => {
    const shareData = {
      title: nft.metadata.name,
      text: `Check out this NFT: ${nft.metadata.name}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
      }
    }
  };

  const handleFavorite = () => {
    if (!isConnected || !address) return;
    
    const favorites = JSON.parse(localStorage.getItem(`nft-favorites-${address}`) || '[]');
    const newFavorites = isFavorited 
      ? favorites.filter((id: string) => id !== nft.id)
      : [...favorites, nft.id];
    
    localStorage.setItem(`nft-favorites-${address}`, JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  const handleMint = async () => {
    if (!isConnected || !address) return;
    
    setIsMinting(true);
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: KILN_CLAIM_ABI,
        functionName: 'claim',
        args: [
          address,
          BigInt(nft.id),
          BigInt(1),
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          BigInt(0),
          {
            proof: [],
            quantityLimitPerWallet: BigInt(0),
            pricePerToken: BigInt(0),
            currency: '0x0000000000000000000000000000000000000000'
          },
          '0x'
        ],
      });
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setIsMinting(false);
    }
  };

  const isProcessing = isPending || isConfirming || isMinting;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-black whitespace-nowrap" style={{ width: '97px', height: '52px', opacity: 1 }}>{nft.metadata.name}</h1>
        <div className="flex space-x-2">
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Share NFT"
          >
            <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1.33333V10" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.6667 3.99999L8.00004 1.33333L5.33337 3.99999" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.66663 8V13.3333C2.66663 13.687 2.8071 14.0261 3.05715 14.2761C3.3072 14.5262 3.64634 14.6667 3.99996 14.6667H12C12.3536 14.6667 12.6927 14.5262 12.9428 14.2761C13.1928 14.0261 13.3333 13.687 13.3333 13.3333V8" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            onClick={handleFavorite}
            disabled={!isConnected}
            className={`w-10 h-10 bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors ${isFavorited ? 'text-red-500' : 'text-black'} ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!isConnected ? 'Connect wallet to use favorites' : isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {isConnected && (
        <p className="text-gray-500 mb-4 text-sm">You own {balance?.toString() || '0'}</p>
      )}

      <p className="text-gray-500 mb-6 leading-relaxed">
        {nft.metadata.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {nft.metadata.attributes.map((attr, index) => (
          <div key={index} className="border border-gray-200 p-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                {attr.trait_type}
              </span>
              <span className="text-gray-800 font-medium">{attr.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="h-px" style={{ backgroundColor: 'rgba(229, 229, 229, 1)' }}></div>
      </div>

      <div className="mb-6">
        <div className="inline-block bg-black text-white px-3 py-1 text-xs font-semibold mb-3">
          Free Mint
        </div>
        <div className="text-2xl font-bold text-black">Ξ 0 ETH</div>
      </div>

      <button
        onClick={handleMint}
        disabled={!isConnected || isProcessing || chainId !== baseSepolia.id}
        className="w-full bg-black text-white py-4 font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isConnected ? 'Connect Wallet to Mint' : 
         chainId !== baseSepolia.id ? 'Switch to Base Sepolia' :
         isProcessing ? 'Processing...' : 
         'Claim Now'}
      </button>

      {showShareToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg z-50">
          Link copied to clipboard!
        </div>
      )}

      {showMintSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">🎉 NFT Minted Successfully!</span>
        </div>
      )}
    </div>
  );
}
