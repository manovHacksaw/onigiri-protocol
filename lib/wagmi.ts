import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { u2uSolaris, sepolia } from './config'

export const config = getDefaultConfig({
  appName: "Pocket Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", // Temporary dev ID
  chains: [u2uSolaris, sepolia],
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
