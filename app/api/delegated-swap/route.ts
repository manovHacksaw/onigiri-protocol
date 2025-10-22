import { NextRequest, NextResponse } from "next/server";
import { createPimlicoClients } from '@/lib/smart-account';
import { encodeFunctionData, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { delegationStorage } from '@/lib/delegation-storage';

// Bridge contract ABIs
const MONAD_BRIDGE_ABI = [
  {
    "inputs": [
      {"name": "destinationChainId", "type": "uint256"},
      {"name": "to", "type": "address"}
    ],
    "name": "bridge",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "transferId", "type": "bytes32"}
    ],
    "name": "mintWETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const SEPOLIA_BRIDGE_ABI = [
  {
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "transferId", "type": "bytes32"}
    ],
    "name": "completeBridge",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export async function POST(request: NextRequest) {
  try {
    const { 
      userAddress, 
      fromToken, 
      toToken, 
      fromAmount, 
      fromChainId, 
      toChainId, 
      recipient 
    } = await request.json();

    if (!userAddress || !fromToken || !toToken || !fromAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log('🚀 [DELEGATED-SWAP] Executing delegated swap for:', userAddress);
    console.log('📊 [DELEGATED-SWAP] Swap details:', { fromToken, toToken, fromAmount, fromChainId, toChainId });

        // Get user's delegation from shared storage
        const delegation = await delegationStorage.get(userAddress);
        
        console.log('🔍 [DELEGATED-SWAP] Looking for delegation for user:', userAddress);
        console.log('🔍 [DELEGATED-SWAP] Found delegation:', !!delegation);
        if (delegation) {
          console.log('🔍 [DELEGATED-SWAP] Delegation isActive:', delegation.isActive);
          console.log('🔍 [DELEGATED-SWAP] Delegation expiresAt:', delegation.expiresAt);
        }
    
    if (!delegation || !delegation.isActive) {
      return NextResponse.json(
        { success: false, error: "No active delegation found for this user" },
        { status: 404 }
      );
    }

    // Initialize Pimlico clients
    const { bundlerClient, paymasterClient } = createPimlicoClients(fromChainId);

    // Contract addresses
    const MONAD_BRIDGE_ADDRESS = process.env.NEXT_PUBLIC_MONAD_BRIDGE_ADDRESS || "0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca";
    const SEPOLIA_BRIDGE_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_BRIDGE_ADDRESS || "0xe564df234366234b279c9a5d547c94AA4a5C08F3";

    let callData: `0x${string}`;
    let targetAddress: `0x${string}`;
    let value: bigint = 0n;

    // Determine the transaction based on the swap direction
    if (fromToken === 'ETH' && toToken === 'MON') {
      // ETH to MON: Bridge from Sepolia to Monad
      targetAddress = SEPOLIA_BRIDGE_ADDRESS;
      value = parseEther(fromAmount);
      
      // For ETH to MON, we need to call the bridge function
      // This would typically be a direct ETH transfer to the bridge contract
      callData = '0x' as `0x${string}`; // Empty call data for ETH transfer
      
    } else if (fromToken === 'MON' && toToken === 'ETH') {
      // MON to ETH: Bridge from Monad to Sepolia
      targetAddress = MONAD_BRIDGE_ADDRESS;
      value = parseEther(fromAmount);
      
      // For MON to ETH, we need to call the bridge function on Monad
      callData = encodeFunctionData({
        abi: MONAD_BRIDGE_ABI,
        functionName: 'bridge',
        args: [toChainId, recipient]
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported token pair" },
        { status: 400 }
      );
    }

    console.log('🔧 [DELEGATED-SWAP] Transaction details:', {
      targetAddress,
      value: value.toString(),
      callData: callData.slice(0, 10) + '...'
    });

    // Create UserOperation
    const userOperation = {
      sender: delegation.smartAccountAddress,
      nonce: 0n, // This should be fetched from the smart account
      initCode: '0x',
      callData: callData,
      callGasLimit: 100000n,
      verificationGasLimit: 100000n,
      preVerificationGas: 21000n,
      maxFeePerGas: parseEther('0.00001'),
      maxPriorityFeePerGas: parseEther('0.000001'),
      paymasterAndData: '0x',
      signature: '0x'
    };

    // Get paymaster sponsorship
    const paymasterResult = await paymasterClient.sponsorUserOperation({
      userOperation,
      entryPoint: process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS as `0x${string}` || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
    });

    if (paymasterResult.paymasterAndData) {
      userOperation.paymasterAndData = paymasterResult.paymasterAndData;
    }

    // Send the UserOperation
    const userOperationHash = await bundlerClient.sendUserOperation({
      userOperation,
      entryPoint: process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS as `0x${string}` || "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
    });

    console.log('✅ [DELEGATED-SWAP] UserOperation sent:', userOperationHash);

    // Wait for the transaction to be mined
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOperationHash
    });

    console.log('🎉 [DELEGATED-SWAP] Transaction confirmed:', receipt.receipt.transactionHash);

    return NextResponse.json({
      success: true,
      userOperationHash,
      transactionHash: receipt.receipt.transactionHash,
      gasUsed: receipt.receipt.gasUsed,
      blockNumber: receipt.receipt.blockNumber,
      swapDetails: {
        fromToken,
        toToken,
        fromAmount,
        fromChainId,
        toChainId,
        recipient
      }
    });

      } catch (error) {
        console.error('❌ [DELEGATED-SWAP] Error executing delegated swap:', error);
        
        // Handle BigInt serialization errors
        if (error instanceof Error && error.message.includes('BigInt')) {
          return NextResponse.json(
            {
              success: false,
              error: "Internal error: BigInt serialization issue",
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
}
