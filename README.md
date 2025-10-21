# Pocket Protocol – Cross-Chain Bridge Application

**A cross-chain bridge enabling seamless token swaps between Monad Testnet and Sepolia Testnet, built for the VietBUIDL Hackathon on HackQuest Demo.**

## 🌉 Overview

Pocket Protocol is a cross-chain bridge application that enables users to swap tokens between Monad Testnet and Sepolia Testnet. The application provides a user-friendly interface for cross-chain token transfers with real-time transaction tracking and automated relayer processing.

## 🔗 Supported Chains & Tokens

### Monad Testnet (Chain ID: 10143)
- **Native Token**: MON
- **Explorer**: [https://testnet.monadexplorer.com](https://testnet.monadexplorer.com)
- **Bridge Contract**: [`0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca`](https://testnet.monadexplorer.com/address/0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca)

### Sepolia Testnet (Chain ID: 11155111)
- **Native Token**: ETH
- **Explorer**: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Bridge Contract**: [`0xe564df234366234b279c9a5d547c94AA4a5C08F3`](https://sepolia.etherscan.io/address/0xe564df234366234b279c9a5d547c94AA4a5C08F3)
- **WETH Contract**: [`0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623`](https://testnet.monadexplorer.com/address/0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623)

## 🔄 Bridge Functionality

### MON → ETH Flow
1. **User sends MON** to relayer address on Monad Testnet
2. **Relayer receives** MON on Monad Testnet
3. **Relayer sends** equivalent ETH to user on Sepolia Testnet
4. **User receives** ETH in their Sepolia wallet

### ETH → MON Flow
1. **User sends ETH** to relayer address on Sepolia
2. **Relayer receives** ETH on Sepolia Testnet
3. **Relayer sends** equivalent MON to user on Monad Testnet
4. **User receives** MON in their Monad wallet

### ETH → WETH Bridge Flow
1. **ETH locked** in Sepolia bridge contract
2. **Relayer mints** WETH on Monad Testnet
3. **User receives** WETH in their Monad wallet

## 🏗️ Architecture

### Frontend Components
- **Swap Card**: Main interface for cross-chain token swaps
- **Bridge Card**: Interface for ETH to WETH bridging
- **Transaction Modal**: Clean, modal-based progress tracking
- **Relayer Liquidity**: Real-time relayer balance monitoring

### Smart Contracts
- **U2UBridge.sol**: Bridge contract deployed on Monad Testnet
- **SepoliaBridge.sol**: Bridge contract deployed on Sepolia
- **WETH.sol**: Wrapped ETH token contract on Monad Testnet

### Backend Services
- **Relayer API**: Processes cross-chain transactions
- **Price API**: Provides swap quotes and exchange rates
- **Status API**: Monitors relayer health and liquidity

### Relayer System
The relayer operates as a **private-key-controlled liquidity hub** that:
- Maintains balances on both chains
- Processes cross-chain transfers automatically
- Handles transaction verification and confirmation
- Provides real-time status updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- Testnet tokens (MON for Monad Testnet, ETH for Sepolia)

### Installation
   ```bash
# Clone the repository
   git clone https://github.com/manovHacksaw/pocket-protocol
   cd pocket-protocol

# Install dependencies
   npm install

# Set up environment variables
cp .env.example .env.local
# Add your configuration to .env.local

# Start development server
   npm run dev
   ```

### Usage
1. **Connect Wallet**: Connect your MetaMask wallet
2. **Select Network**: Switch to Monad Testnet or Sepolia
3. **Choose Operation**:
   - Use Swap Card for MON ↔ ETH swaps
   - Use Bridge Card for ETH → WETH bridging
4. **Enter Amount**: Specify the amount to transfer
5. **Confirm Transaction**: Sign the transaction in your wallet
6. **Track Progress**: Monitor transaction progress in the modal
7. **Receive Tokens**: Tokens will appear in your target wallet

## 🎯 Key Features

### User Experience
- **Clean Modal Interface**: Real-time transaction progress tracking
- **Chain Validation**: Automatic network switching prompts
- **Liquidity Checking**: Warns if relayer has insufficient funds
- **Transaction Verification**: Waits for blockchain confirmation
- **Explorer Links**: Direct links to view transactions on block explorers

### Technical Features
- **Wagmi Integration**: Web3 wallet connection and transaction handling
- **Viem**: Low-level blockchain interaction
- **Next.js 15**: Modern React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern UI styling

## ⚠️ Important Disclaimers

### Network Information
- **Monad Testnet**: This is a **testnet** network
- **Sepolia**: This is a **testnet** network

### Safety Notes
- **Do not use real funds** for this project unless officially provided by Monad for testing
- This is a **hackathon demo** - funds are not protected
- The relayer is **centralized** for demonstration purposes
- **Not production-ready** - use at your own risk

### Current Limitations
- Single relayer wallet (centralized)
- No multi-signature protection
- Limited to testnet operations
- No insurance or fund protection

## 🔮 Future Development Ideas

### Production Roadmap
- **Multi-signature Relayer**: Implement multi-sig wallet for enhanced security
- **Decentralized Relayer Network**: Multiple relayer nodes for redundancy
- **On-chain Liquidity Pools**: Replace single-key relayer with decentralized pools
- **Real Mainnet Support**: Support for real ETH and MON transfers once audited
- **Additional Chains**: Expand to more blockchain networks
- **Wrapped Token Support**: Support for additional wrapped tokens

### Security Enhancements
- **Smart Contract Audits**: Professional security audits
- **Time-locked Operations**: Implement time delays for large transfers
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Emergency Pause**: Circuit breakers for emergency situations

## 🛠️ Technical Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Wagmi** for Web3 integration
- **Viem** for blockchain interactions

### Smart Contracts
- **Solidity** for contract development
- **Hardhat** for development and testing
- **OpenZeppelin** for security standards

### Backend
- **Node.js** API server
- **Express.js** for API endpoints
- **Web3.js** for blockchain interactions

## 📊 Contract Addresses

| Contract | Network | Address | Explorer |
|----------|---------|---------|----------|
| U2UBridge | Monad Testnet | `0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca` | [View](https://testnet.monadexplorer.com/address/0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca) |
| SepoliaBridge | Sepolia | `0xe564df234366234b279c9a5d547c94AA4a5C08F3` | [View](https://sepolia.etherscan.io/address/0xe564df234366234b279c9a5d547c94AA4a5C08F3) |
| WETH | Monad Testnet | `0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623` | [View](https://testnet.monadexplorer.com/address/0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623) |

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Hackathon**: VietBUIDL Hackathon on HackQuest Demo
- **Project**: Pocket Protocol Cross-Chain Bridge
- **Built with ❤️** for the Monad and Ethereum communities

---

**⚠️ Disclaimer**: This is a hackathon demonstration project. Do not use real funds unless officially provided for testing. The relayer system is centralized and not suitable for production use.
