/** Future Travel Wallet architecture — UI hooks only, no backend yet */

export type TravelWalletBalance = {
  tokens: number;
  rewardsPoints: number;
  cashbackUsd: number;
};

export type NftRouteBadge = {
  id: string;
  tripId: string;
  name: string;
  imageUrl?: string;
};

export type WalletFeatureFlags = {
  travelWallet: boolean;
  rewards: boolean;
  cashback: boolean;
  nftRoutes: boolean;
  travelTokens: boolean;
};

export const DEFAULT_WALLET_FLAGS: WalletFeatureFlags = {
  travelWallet: false,
  rewards: false,
  cashback: false,
  nftRoutes: false,
  travelTokens: false,
};
