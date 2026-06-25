import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '@/hooks/useWallet';
import * as Freighter from '@stellar/freighter-api';

jest.mock('@stellar/freighter-api');

const mockFreighter = Freighter as jest.Mocked<typeof Freighter>;

const mockAddress = 'GBRPYHIL2CI3WHZDTOOQFC6EB4LEGIH2L3TLRW5QGH5KGXRALTMPXEY';

describe('useWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores connected state from localStorage on mount', () => {
    localStorage.setItem('boxmeout_wallet_address', mockAddress);

    const { result } = renderHook(() => useWallet());

    expect(result.current.address).toBe(mockAddress);
    expect(result.current.isConnected).toBe(true);
  });

  it('throws descriptive error if Freighter not installed', async () => {
    mockFreighter.isAllowed.mockResolvedValue(false);

    const { result } = renderHook(() => useWallet());

    await expect(result.current.connect()).rejects.toThrow(
      'Freighter wallet not installed'
    );
  });

  it('stores address in state and localStorage on connect', async () => {
    mockFreighter.isAllowed.mockResolvedValue(true);
    mockFreighter.requestAccess.mockResolvedValue(mockAddress);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBe(mockAddress);
    expect(result.current.isConnected).toBe(true);
    expect(localStorage.getItem('boxmeout_wallet_address')).toBe(mockAddress);
  });

  it('clears address from state and localStorage on disconnect', async () => {
    localStorage.setItem('boxmeout_wallet_address', mockAddress);
    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.address).toBe(mockAddress);
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(localStorage.getItem('boxmeout_wallet_address')).toBeNull();
  });

  it('signs transaction and returns XDR string', async () => {
    mockFreighter.isAllowed.mockResolvedValue(true);
    mockFreighter.requestAccess.mockResolvedValue(mockAddress);
    const mockXdr = 'TXDR123';
    const mockSignedXdr = 'SIGNED_TXDR123';
    mockFreighter.signTransaction.mockResolvedValue(mockSignedXdr);

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    const signed = await act(async () => {
      return await result.current.signTransaction(mockXdr);
    });

    expect(signed).toBe(mockSignedXdr);
    expect(mockFreighter.signTransaction).toHaveBeenCalledWith(mockXdr);
  });

  it('throws error if trying to sign without wallet connected', async () => {
    const { result } = renderHook(() => useWallet());

    await expect(result.current.signTransaction('TXDR123')).rejects.toThrow(
      'Wallet not connected'
    );
  });
});
