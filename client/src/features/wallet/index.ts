/** Platform wallet (off-chain AIT) — UI and hooks */

export type { TravelWalletBalance, NftRouteBadge, WalletFeatureFlags } from "./types";
export { DEFAULT_WALLET_FLAGS } from "./types";

export { default as PlatformWalletCard } from "@/components/wallet/PlatformWalletCard";
export {
  usePlatformWallet,
  useWalletTransfer,
  fetchPlatformWallet,
} from "@/hooks/usePlatformWallet";
