import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

export function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (isConnected) {
    // Check if user is on the correct chain (Base Sepolia)
    if (chainId !== baseSepolia.id) {
      return (
        <button
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          disabled={isSwitching}
          className="bg-orange-500 text-white px-6 py-3 font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
        </button>
      );
    }

    return (
      <button
        onClick={() => disconnect()}
        className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors"
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  // Handle connect wallet - switch chain first if needed, then connect
  const handleConnect = async () => {
    try {
        // First, try to detect the current chain from window.ethereum
        if (window.ethereum) {
          try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            const currentChainIdNumber = parseInt(currentChainId, 16);
            
            if (currentChainIdNumber !== baseSepolia.id) {
              // Switch chain first before connecting
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${baseSepolia.id.toString(16)}` }],
              });
            }
           } catch (chainError: any) {
             console.log('Could not switch chain, trying to add it', chainError);
             
             // If the chain doesn't exist (error code 4902), add it
             if (chainError.code === 4902) {
               try {
                 await window.ethereum.request({
                   method: "wallet_addEthereumChain",
                   params: [
                     {
                       chainId: `0x${baseSepolia.id.toString(16)}`,
                       chainName: "Base Sepolia Testnet",
                       rpcUrls: ["https://sepolia.base.org"],
                       nativeCurrency: {
                         name: "Ether",
                         symbol: "ETH",
                         decimals: 18,
                       },
                       blockExplorerUrls: ["https://sepolia.basescan.org"],
                     },
                   ],
                 });
                 
                 // Wait a moment for the chain to be added
                 await new Promise(resolve => setTimeout(resolve, 2000));
                 
                 // After adding the chain, try to switch to it
                 try {
                   await window.ethereum.request({
                     method: "wallet_switchEthereumChain",
                     params: [{ chainId: `0x${baseSepolia.id.toString(16)}` }],
                   });
                   console.log('Successfully switched to Base Sepolia after adding');
                 } catch (switchAfterAddError) {
                   console.log('Could not switch immediately after adding, but network is added');
                   // This is normal on first time - user can switch manually
                 }
               } catch (addError) {
                 console.error('Failed to add Base Sepolia chain:', addError);
               }
             } else {
               console.error('Failed to switch to Base Sepolia:', chainError);
             }
           }
      }
      
      // Then connect the wallet
      connect({ connector: connectors[0] });
    } catch (error) {
      console.error('Error during connect process:', error);
    }
  };

  // Always show Connect Wallet button - it will handle chain switching automatically
  return (
    <button
      onClick={handleConnect}
      disabled={isPending || isSwitching}
      className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      {isPending || isSwitching ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
