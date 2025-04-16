# Custom Wallet Implementation

This project uses a simplified custom wallet address system instead of MetaMask or WalletConnect integrations.

## Features:
- Direct wallet address input with validation
- No dependence on browser extensions or third-party wallets
- Simplified blockchain interaction model
- Full support for BNB Smart Chain addresses

## Implementation Files:
- client/src/lib/web3-provider.tsx - Core wallet provider
- client/src/components/wallet/wallet-selector.tsx - UI for wallet address input
- client/src/lib/contract-utils.ts - Wallet address validation
