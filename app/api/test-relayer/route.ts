import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Test the relayer status endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/relayer`, {
      method: 'GET',
    });

    const data = await response.json();

    // Return the data directly in the expected format
    return NextResponse.json(data);
  } catch (error) {
    console.error("Relayer test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testType, amount, recipient } = await request.json();

    if (testType === 'bridge') {
      // Test bridge functionality with mock data
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/relayer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: recipient || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          amount: amount || '1.0',
          action: 'bridge',
          u2uTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Mock hash
        }),
      });

      const data = await response.json();

      return NextResponse.json({
        success: true,
        message: "Bridge test completed",
        result: data,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid test type",
    }, { status: 400 });

  } catch (error) {
    console.error("Relayer test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}