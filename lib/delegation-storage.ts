// File-based storage for delegation data
// In production, this would be replaced with a proper database

import { promises as fs } from 'fs';
import path from 'path';

interface DelegationData {
  userAddress: string;
  smartAccountAddress: string;
  signature: string;
  capabilities: any[];
  isActive: boolean;
  expiresAt: Date;
  createdAt?: Date;
}

const STORAGE_FILE = path.join(process.cwd(), 'delegations.json');

class DelegationStorage {
  private async readStorage(): Promise<Record<string, DelegationData>> {
    try {
      const data = await fs.readFile(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, return empty object
      return {};
    }
  }

  private async writeStorage(data: Record<string, DelegationData>): Promise<void> {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  }

  async set(userAddress: string, delegation: DelegationData): Promise<void> {
    const storage = await this.readStorage();
    storage[userAddress] = delegation;
    await this.writeStorage(storage);
  }

  async get(userAddress: string): Promise<DelegationData | undefined> {
    const storage = await this.readStorage();
    const delegation = storage[userAddress];
    if (delegation) {
      // Parse dates from strings
      delegation.expiresAt = new Date(delegation.expiresAt);
      if (delegation.createdAt) {
        delegation.createdAt = new Date(delegation.createdAt);
      }
    }
    return delegation;
  }

  async has(userAddress: string): Promise<boolean> {
    const storage = await this.readStorage();
    return userAddress in storage;
  }

  async delete(userAddress: string): Promise<boolean> {
    const storage = await this.readStorage();
    if (userAddress in storage) {
      delete storage[userAddress];
      await this.writeStorage(storage);
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    await this.writeStorage({});
  }

  async size(): Promise<number> {
    const storage = await this.readStorage();
    return Object.keys(storage).length;
  }
}

// Export a singleton instance
export const delegationStorage = new DelegationStorage();
export type { DelegationData };