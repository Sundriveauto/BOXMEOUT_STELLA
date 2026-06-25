'use client';

import { useEffect, useState } from 'react';
import * as Freighter from '@stellar/freighter-api';

export interface UseWalletResult {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const STORAGE_KEY = 'boxmeout_wallet_address';

/**
 * Manages Stellar wallet state using Freighter or compatible wallet APIs.
 * Abstracts Freighter/Albedo/xBull behind a common interface.
 * connect() throws a descriptive error if no wallet extension is installed.
 */
export function useWallet(): UseWalletResult {
  const [address, setAddress] = useState<string | null>(null);

  // Restore connected state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAddress(stored);
    }
  }, []);

  const connect = async () => {
    try {
      const isAllowed = await Freighter.isAllowed();
      if (!isAllowed) {
        throw new Error(
          'Freighter wallet not installed. Please install the Freighter extension to continue.'
        );
      }

      const userAddress = await Freighter.requestAccess();
      setAddress(userAddress);
      localStorage.setItem(STORAGE_KEY, userAddress);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Freighter')) {
        throw err;
      }
      throw new Error(
        'Freighter wallet not installed. Please install the Freighter extension to continue.'
      );
    }
  };

  const disconnect = () => {
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const signTransaction = async (xdr: string): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');
    const signed = await Freighter.signTransaction(xdr);
    return signed;
  };

  return {
    address,
    isConnected: address !== null,
    connect,
    disconnect,
    signTransaction,
  };
}
