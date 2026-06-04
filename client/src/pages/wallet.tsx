import AppLayout from "@/components/app-layout";
import TravelWalletDemo from "@/components/wallet/travel-wallet-demo";

export function Wallet() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="ait-section-title">Travel Wallet</h1>
        <p className="text-muted-foreground mt-2">
          Получайте и обменивайте валюту в путешествии — демо без подключения к блокчейну
        </p>
      </div>
      <TravelWalletDemo />
    </AppLayout>
  );
}

export default Wallet;
