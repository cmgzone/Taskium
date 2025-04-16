import { useContext } from 'react';
import { Web3Context, NetworkType, WalletType } from '@/lib/web3-provider';

export function useWeb3() {
  // Get the context value
  const context = useContext(Web3Context);
  
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider component');
  }
  
  // Return a combined object with both original properties and aliases
  return {
    // Original properties
    connected: context.connected,
    address: context.address,
    provider: context.provider,
    signer: context.signer,
    network: context.network,
    chainId: context.chainId,
    isCorrectNetwork: context.isCorrectNetwork,
    walletType: context.walletType,
    connect: context.connect,
    disconnect: context.disconnect,
    switchNetwork: context.switchNetwork,
    
    // Aliases for compatibility with token-purchase component
    account: context.address,
    web3Provider: context.provider,
    connectWallet: context.connect,
  };
}