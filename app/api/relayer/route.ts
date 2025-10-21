import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "@/lib/config";
import { MONAD_BRIDGE_ABI, MONAD_BRIDGE_ADDRESS } from "@/lib/contracts";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const MONAD_RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "a1f488592e4701289c173203d6d4b1f7583d3be37d08bf39a58f2875d167e5e6";

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing .env configuration for relayer");
}

// Price fetching function with fallbacks
async function fetchTokenPrices() {
  try {
    // Try to fetch MON price from CoinGecko or similar API
    const monResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monad&vs_currencies=usd');
    const monData = await monResponse.json();
    // Use a more reasonable fallback price for MON (assuming it's a testnet token)
    const monPrice = monData.monad?.usd || 8; // Use 8 as fallback price as requested

    // Try to fetch ETH price
    const ethResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const ethData = await ethResponse.json();
    const ethPrice = ethData.ethereum?.usd || 4100; // Use 4100 as fallback price as requested

    // Validate prices are valid numbers
    if (isNaN(monPrice) || isNaN(ethPrice) || monPrice <= 0 || ethPrice <= 0) {
      console.warn('Invalid prices received, using fallbacks');
      return { monadPrice: 8, ethPrice: 4100 };
    }
    
    return { monadPrice: monPrice, ethPrice };
  } catch (error) {
    console.warn('Failed to fetch prices, using fallbacks:', error);
    return { monadPrice: 8, ethPrice: 4100 };
  }
}

// Check liquidity on both chains
async function checkLiquidity(account: { address: `0x${string}` }, monadAmount: bigint, ethAmount: bigint) {
  try {
    // Check MON balance
    const monadClient = createPublicClient({
      chain: monadTestnet,
      transport: http(MONAD_RPC_URL),
    });
    const monadBalance = await monadClient.getBalance({ address: account.address });
    
    // Check Sepolia ETH balance
    const sepoliaClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });
    const ethBalance = await sepoliaClient.getBalance({ address: account.address });

    const insufficientMON = monadBalance < monadAmount;
    const insufficientETH = ethBalance < ethAmount;

    return {
      insufficientMON,
      insufficientETH,
      monadBalance: monadBalance.toString(),
      ethBalance: ethBalance.toString(),
    };
  } catch (error) {
    console.error('Error checking liquidity:', error);
    return {
      insufficientMON: true,
      insufficientETH: true,
      monadBalance: '0',
      ethBalance: '0',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipient, amount, transferId, action, monadTxHash, sepoliaTxHash } = await request.json();
    console.log('Relayer API called:', { action, amount });

    if (!recipient || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing recipient or amount" },
        { status: 400 }
      );
    }

    // Create relayer account & wallet clients
    const privateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    
    // MON wallet client
    const monadWalletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(MONAD_RPC_URL),
    });

    // Sepolia wallet client
    const sepoliaWalletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });

    // Create public clients for waiting for receipts
    const monadPublicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(MONAD_RPC_URL),
    });

    const sepoliaPublicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });

    // Handle MON bridge transaction
    if (action === 'bridge' && monadTxHash) {
      console.log(`Processing MON bridge: ${amount} MON for ${recipient}`);
      
      // Validate MON transaction first
      try {
        const monadReceipt = await monadPublicClient.getTransactionReceipt({ hash: monadTxHash as `0x${string}` });
        if (!monadReceipt || monadReceipt.status !== 'success') {
          return NextResponse.json(
            { success: false, error: "MON transaction not confirmed or failed" },
            { status: 400 }
          );
        }
        console.log('MON transaction confirmed');
      } catch {
        return NextResponse.json(
          { success: false, error: "Failed to validate MON transaction" },
          { status: 400 }
        );
      }

      // Fetch current prices
      const { monadPrice, ethPrice } = await fetchTokenPrices();
      // Calculate equivalent ETH amount based on current market value
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount provided" },
          { status: 400 }
        );
      }
      
      const monadAmountUSD = amountNum * monadPrice;
      const equivalentEthAmount = monadAmountUSD / ethPrice;
      
      // Validate the calculated amount
      if (isNaN(equivalentEthAmount) || equivalentEthAmount <= 0) {
        console.error(`Invalid conversion calculation - amountNum: ${amountNum}, monadPrice: ${monadPrice}, ethPrice: ${ethPrice}, monadAmountUSD: ${monadAmountUSD}, equivalentEthAmount: ${equivalentEthAmount}`);
        return NextResponse.json(
          { success: false, error: "Invalid conversion amount calculated" },
          { status: 400 }
        );
      }
      
      // Ensure the amount is in proper decimal format (not scientific notation)
      const ethAmountString = equivalentEthAmount.toFixed(18); // Use 18 decimals for precision
      const ethAmountWei = parseEther(ethAmountString);

      console.log(`Converting ${amount} MON to ${ethAmountString} ETH`);

      // Check liquidity before proceeding
      // Note: amount is in MON units, so we need to convert it to wei for MON
      // Convert to fixed decimal notation to avoid scientific notation issues
      const monadAmountString = amountNum.toFixed(18);
      const monadAmountWei = parseEther(monadAmountString); // This is correct for MON amount
      const liquidityCheck = await checkLiquidity(account, monadAmountWei, ethAmountWei);
      
      if (liquidityCheck.insufficientMON) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Bridge temporarily unavailable: insufficient liquidity on MON.",
            details: {
              required: amount,
              available: liquidityCheck.monadBalance,
              chain: "MON"
            }
          },
          { status: 503 }
        );
      }

      if (liquidityCheck.insufficientETH) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Bridge temporarily unavailable: insufficient liquidity on Sepolia.",
            details: {
              required: equivalentEthAmount.toString(),
              available: liquidityCheck.ethBalance,
              chain: "Sepolia"
            }
          },
          { status: 503 }
        );
      }

      // Send equivalent ETH to recipient on Sepolia
      const txHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: ethAmountWei,
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`Bridge completed: ${equivalentEthAmount} ETH sent to ${recipient}`);

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        monadTxHash,
        monadAmount: amount,
        ethAmount: equivalentEthAmount.toString(),
        monadPrice,
        ethPrice,
        message: `Bridge successful: ${amount} MON → ${ethAmountString} ETH`,
      });
    }

    if (action === 'bridge-eth-to-weth') {
      // Handle bridge: ETH (Sepolia) → WETH (MON)
      console.log(`Processing bridge: ${amount} ETH to WETH for ${recipient}`);
      
      // Note: Allow relayer to bridge for itself (valid use case)
      
      // Validate Sepolia transaction if provided
      if (sepoliaTxHash) {
        try {
          const sepoliaReceipt = await sepoliaPublicClient.getTransactionReceipt({ hash: sepoliaTxHash as `0x${string}` });
          if (!sepoliaReceipt || sepoliaReceipt.status !== 'success') {
            return NextResponse.json(
              { success: false, error: "Sepolia transaction not confirmed or failed" },
              { status: 400 }
            );
          }
          console.log('Sepolia transaction confirmed');
        } catch {
          return NextResponse.json(
            { success: false, error: "Failed to validate Sepolia transaction" },
            { status: 400 }
          );
        }
      }
      
      // Generate a transferId if not provided
      const finalTransferId = transferId || `0x${Buffer.from(`${recipient}-${amount}-${Date.now()}`).toString('hex').padStart(64, '0')}`;
      
      // Ensure transferId is exactly 32 bytes (64 hex characters + 0x prefix)
      const cleanTransferId = finalTransferId.startsWith('0x') ? finalTransferId.slice(2) : finalTransferId;
      const paddedTransferId = `0x${cleanTransferId.padStart(64, '0').slice(0, 64)}`;
      
      
      // For ETH → WETH bridge, we mint WETH on MON
      // The amount is already in ETH, so we mint the same amount as WETH
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount provided" },
          { status: 400 }
        );
      }
      // Convert to fixed decimal notation to avoid scientific notation issues
      const wethAmountString = amountNum.toFixed(18);
      const wethAmount = parseEther(wethAmountString);
      
      console.log(`Minting ${amount} WETH`);
      
      // Check if we have enough MON for gas fees
      const monadBalance = await monadPublicClient.getBalance({ address: account.address });
      const minMONForGas = parseEther("0.01"); // Minimum MON for gas
      
      if (monadBalance < minMONForGas) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Bridge temporarily unavailable: insufficient MON for gas fees.",
            details: {
              required: formatEther(minMONForGas),
              available: formatEther(monadBalance),
              chain: "MON"
            }
          },
          { status: 503 }
        );
      }
      
      // Call the MON bridge contract to mint WETH
      
      try {
        const txHash = await monadWalletClient.writeContract({
          address: MONAD_BRIDGE_ADDRESS as `0x${string}`,
          abi: MONAD_BRIDGE_ABI.abi,
          functionName: "mintWETH",
          args: [recipient as `0x${string}`, wethAmount, paddedTransferId as `0x${string}`],
        });

        const receipt = await monadPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        
        console.log(`WETH minted: ${txHash}`);

        return NextResponse.json({
          success: true,
          txHash,
          receipt: {
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status,
          },
          message: `Bridge processed: ${amount} WETH minted for ${recipient} (from ${amount} ETH)`,
        });
      } catch (error) {
        console.error("Bridge minting failed:", error);
        return NextResponse.json(
          { 
            success: false, 
            error: `Bridge minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: {
              bridgeAddress: MONAD_BRIDGE_ADDRESS,
              recipient,
              amount,
              transferId
            }
          },
          { status: 500 }
        );
      }
    } else if (action === 'swap') {
      // Handle swap: MON (MON Solaris) → ETH (Sepolia)
      console.log(`Processing swap: ${amount} MON to ETH`);
      
      // Fetch current prices and convert MON to ETH
      const { monadPrice, ethPrice } = await fetchTokenPrices();
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount provided" },
          { status: 400 }
        );
      }
      
      const monadAmountUSD = amountNum * monadPrice;
      const equivalentEthAmount = monadAmountUSD / ethPrice;
      
      // Validate the calculated amount
      if (isNaN(equivalentEthAmount) || equivalentEthAmount <= 0) {
        console.error(`Invalid swap conversion calculation - amountNum: ${amountNum}, monadPrice: ${monadPrice}, ethPrice: ${ethPrice}, monadAmountUSD: ${monadAmountUSD}, equivalentEthAmount: ${equivalentEthAmount}`);
        return NextResponse.json(
          { success: false, error: "Invalid conversion amount calculated" },
          { status: 400 }
        );
      }
      
      // Ensure the amount is in proper decimal format (not scientific notation)
      const ethAmountString = equivalentEthAmount.toFixed(18); // Use 18 decimals for precision
      const ethAmountWei = parseEther(ethAmountString);
      
      console.log(`Converting ${amount} MON to ${ethAmountString} ETH`);
      
      // Check liquidity before proceeding
      // Convert to fixed decimal notation to avoid scientific notation issues
      const amountString = amountNum.toFixed(18);
      const liquidityCheck = await checkLiquidity(account, parseEther(amountString), ethAmountWei);
      
      if (liquidityCheck.insufficientETH) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Swap temporarily unavailable: insufficient liquidity on Sepolia.",
            details: {
              required: equivalentEthAmount.toString(),
              available: liquidityCheck.ethBalance,
              chain: "Sepolia"
            }
          },
          { status: 503 }
        );
      }
      
      // Send equivalent ETH to the recipient
      const txHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: ethAmountWei,
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`ETH sent: ${txHash}`);

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        message: `Swap processed: ${ethAmountString} ETH sent to ${recipient} (from ${amount} MON)`,
      });
    } else if (action === 'swap-eth-to-monad') {
      // Handle swap: ETH (Sepolia) → MON (MON Solaris)
      console.log(`Processing swap: ${amount} ETH to MON`);
      
      // Fetch current prices and convert ETH to MON
      const { monadPrice, ethPrice } = await fetchTokenPrices();
      
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount provided" },
          { status: 400 }
        );
      }
      const ethAmountUSD = amountNum * ethPrice;
      const equivalentMONAmount = ethAmountUSD / monadPrice;
      
      // Validate the calculated amount
      if (isNaN(equivalentMONAmount) || equivalentMONAmount <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid conversion amount calculated" },
          { status: 400 }
        );
      }
      
      // Ensure the amount is in proper decimal format (not scientific notation)
      const monadAmountString = equivalentMONAmount.toFixed(18); // Use 18 decimals for precision
      const monadAmountWei = parseEther(monadAmountString);
      
      console.log(`Converting ${amount} ETH to ${monadAmountString} MON`);
      
      // Check liquidity before proceeding
      // Convert to fixed decimal notation to avoid scientific notation issues
      const amountString = amountNum.toFixed(18);
      const liquidityCheck = await checkLiquidity(account, monadAmountWei, parseEther(amountString));
      
      if (liquidityCheck.insufficientMON) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Swap temporarily unavailable: insufficient liquidity on MON.",
            details: {
              required: equivalentMONAmount.toString(),
              available: liquidityCheck.monadBalance,
              chain: "MON"
            }
          },
          { status: 503 }
        );
      }
      
      // Send equivalent MON to the recipient
      const txHash = await monadWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: monadAmountWei,
      });

      const receipt = await monadPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      console.log(`MON sent: ${txHash}`);

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        message: `Swap processed: ${monadAmountString} MON sent to ${recipient} (from ${amount} ETH)`,
      });
    } else {
      // Default behavior: send ETH directly to recipient
      console.log(`Using default behavior - action: ${action}`);
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid amount provided" },
          { status: 400 }
        );
      }
      const txHash = await sepoliaWalletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amountNum.toFixed(18)),
      });

      const receipt = await sepoliaPublicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      return NextResponse.json({
        success: true,
        txHash,
        receipt: {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
        },
        message: `ETH released successfully to ${recipient}`,
      });
    }
  } catch (error) {
    console.error("Relayer API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for relayer status on both chains
export async function GET() {
  try {
    console.log('Relayer GET endpoint called');
    console.log('Environment check:', { 
      hasSepoliaRpc: !!SEPOLIA_RPC_URL, 
      hasMONRpc: !!MONAD_RPC_URL, 
      hasPrivateKey: !!PRIVATE_KEY 
    });
    
    const privateKey = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('Relayer account:', account.address);

    // Check MON balance
    const monadClient = createPublicClient({
      chain: monadTestnet,
      transport: http(MONAD_RPC_URL),
    });
    const monadBalance = await monadClient.getBalance({ address: account.address });

    // Check Sepolia balance
    const sepoliaClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });
    const sepoliaBalance = await sepoliaClient.getBalance({ address: account.address });

    // Fetch current prices
    const { monadPrice, ethPrice } = await fetchTokenPrices();

    return NextResponse.json({
      success: true,
      relayerAddress: account.address,
      chains: {
        monad: {
          chainId: monadTestnet.id,
          name: monadTestnet.name,
          balance: parseFloat(monadBalance.toString()) / 1e18,
          balanceUSD: (parseFloat(monadBalance.toString()) / 1e18) * monadPrice,
          symbol: monadTestnet.nativeCurrency.symbol,
        },
        sepolia: {
          chainId: sepolia.id,
          name: sepolia.name,
          balance: parseFloat(sepoliaBalance.toString()) / 1e18,
          balanceUSD: (parseFloat(sepoliaBalance.toString()) / 1e18) * ethPrice,
          symbol: sepolia.nativeCurrency.symbol,
        },
      },
      prices: {
        monad: monadPrice,
        eth: ethPrice,
      },
      status: "operational",
    });
  } catch (error) {
    console.error("Relayer status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
