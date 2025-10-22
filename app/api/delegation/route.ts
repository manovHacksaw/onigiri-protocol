import { NextRequest, NextResponse } from "next/server";
import { delegationStorage } from '@/lib/delegation-storage';

export async function POST(request: NextRequest) {
  try {
    const { userAddress, signature, smartAccountAddress } = await request.json();

    if (!userAddress || !signature || !smartAccountAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('🔐 [DELEGATION] Creating delegation for:', userAddress);

    // Bridge contract addresses
    const MONAD_BRIDGE_ADDRESS = process.env.NEXT_PUBLIC_MONAD_BRIDGE_ADDRESS || "0x790f07dF19F95aAbFAed3BfED01c07724c9a6cca";
    const SEPOLIA_BRIDGE_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_BRIDGE_ADDRESS || "0xe564df234366234b279c9a5d547c94AA4a5C08F3";
    const WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS || "0xdfd0480D0c1f59a0c5eAeadfDE047840F6813623";

    // Create delegation capabilities for bridge contracts
    const bridgeCapabilities = [
      {
        target: MONAD_BRIDGE_ADDRESS,
        permissions: [
          {
            parentCapability: 'eth_sendTransaction',
            caveats: [
              {
                type: 'restrictReturnedEthAccounts',
                value: [userAddress]
              },
              {
                type: 'filterResponse',
                value: {
                  method: 'eth_sendTransaction',
                  params: {
                    to: MONAD_BRIDGE_ADDRESS,
                    data: {
                      function: ['bridge', 'mintWETH']
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      {
        target: SEPOLIA_BRIDGE_ADDRESS,
        permissions: [
          {
            parentCapability: 'eth_sendTransaction',
            caveats: [
              {
                type: 'restrictReturnedEthAccounts',
                value: [userAddress]
              },
              {
                type: 'filterResponse',
                value: {
                  method: 'eth_sendTransaction',
                  params: {
                    to: SEPOLIA_BRIDGE_ADDRESS,
                    data: {
                      function: ['completeBridge', 'deposit']
                    }
                  }
                }
              }
            ]
          }
        ]
      },
      {
        target: WETH_ADDRESS,
        permissions: [
          {
            parentCapability: 'eth_sendTransaction',
            caveats: [
              {
                type: 'restrictReturnedEthAccounts',
                value: [userAddress]
              },
              {
                type: 'filterResponse',
                value: {
                  method: 'eth_sendTransaction',
                  params: {
                    to: WETH_ADDRESS,
                    data: {
                      function: ['approve', 'transferFrom', 'transfer']
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    ];

    // Create the delegation object
    const delegation = {
      userAddress,
      smartAccountAddress,
      signature,
      capabilities: bridgeCapabilities,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    // Store the delegation in shared storage
    delegationStorage.set(userAddress, delegation);

    console.log('✅ [DELEGATION] Delegation created successfully');
    console.log('📋 [DELEGATION] Capabilities:', bridgeCapabilities.length);
    console.log('🎯 [DELEGATION] Targets: Monad Bridge, Sepolia Bridge, WETH');

    return NextResponse.json({
      success: true,
      delegation: {
        userAddress,
        smartAccountAddress,
        capabilities: bridgeCapabilities.length,
        expiresAt: delegation.expiresAt,
        isActive: true
      }
    });

  } catch (error) {
    console.error('❌ [DELEGATION] Error creating delegation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: "Missing userAddress parameter" },
        { status: 400 }
      );
    }

    const delegation = await delegationStorage.get(userAddress);

    console.log('🔍 [DELEGATION] Looking for delegation for user:', userAddress);
    console.log('🔍 [DELEGATION] Found delegation:', !!delegation);

    if (!delegation) {
      return NextResponse.json(
        { success: false, error: "No delegation found for this user" },
        { status: 404 }
      );
    }

    // Check if delegation is expired
    const now = new Date();
    const expiresAt = new Date(delegation.expiresAt);
    
    console.log('🔍 [DELEGATION] Current time:', now.toISOString());
    console.log('🔍 [DELEGATION] Expires at:', expiresAt.toISOString());
    console.log('🔍 [DELEGATION] Is expired:', now > expiresAt);
    
    if (now > expiresAt) {
      delegation.isActive = false;
      delegationStorage.set(userAddress, delegation);
    }

    return NextResponse.json({
      success: true,
      delegation: {
        userAddress: delegation.userAddress,
        smartAccountAddress: delegation.smartAccountAddress,
        isActive: delegation.isActive,
        expiresAt: delegation.expiresAt,
        createdAt: delegation.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [DELEGATION] Error fetching delegation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
