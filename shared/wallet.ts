/** Platform wallet (off-chain AIT) — not on-chain crypto */

export type PlatformWalletProfile = {
  address: string;
  spendBalance: number;
  creatorBalance: number;
  lifetimeSpendEarned: number;
  lifetimeCreatorEarned: number;
  username: string | null;
};

export type WalletTransferResult = {
  ok: boolean;
  message?: string;
  amount?: number;
};
