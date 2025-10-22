import { SiweMessage } from 'siwe';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  nonce?: string;
  address?: string;
  chainId?: number;
  isAuthenticated?: boolean;
}

export type Session = IronSession<SessionData>;

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD || 'your-super-secret-password-change-this-in-production',
  cookieName: 'onigiri-protocol-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export async function getSession(): Promise<Session> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

export async function createSiweMessage(address: string, chainId: number) {
  const message = new SiweMessage({
    domain: process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000',
    address,
    statement: 'Sign in with Ethereum to Onigiri Protocol',
    uri: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    version: '1',
    chainId,
    nonce: Math.random().toString(36).substring(2, 15),
  });

  return message;
}

export async function verifySiweMessage(message: SiweMessage, signature: string) {
  try {
    const result = await message.verify({ signature });
    return result.success;
  } catch (error) {
    console.error('SIWE verification failed:', error);
    return false;
  }
}
