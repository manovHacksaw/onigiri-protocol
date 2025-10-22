import { NextRequest, NextResponse } from "next/server";
import { getSession, createSiweMessage, verifySiweMessage } from '@/lib/auth';
import { connectToDatabase, UserSession } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { message, signature, address, chainId } = await request.json();

    if (!message || !signature || !address || !chainId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the SIWE message
    const isValid = await verifySiweMessage(message, signature);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create or update user session
    const session = await UserSession.findOneAndUpdate(
      { address },
      {
        address,
        nonce: message.nonce,
        chainId,
        isAuthenticated: true,
        lastLogin: new Date(),
      },
      { upsert: true, new: true }
    );

    // Create server session
    const serverSession = await getSession();
    serverSession.address = address;
    serverSession.chainId = chainId;
    serverSession.isAuthenticated = true;
    await serverSession.save();

    console.log('✅ [SIWE] User authenticated:', address);

    return NextResponse.json({
      success: true,
      user: {
        address,
        chainId,
        isAuthenticated: true,
      }
    });

  } catch (error) {
    console.error('❌ [SIWE] Authentication error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    
    return NextResponse.json({
      success: true,
      user: {
        address: session.address,
        chainId: session.chainId,
        isAuthenticated: session.isAuthenticated || false,
      }
    });

  } catch (error) {
    console.error('❌ [SIWE] Session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Session error",
      },
      { status: 500 }
    );
  }
}
