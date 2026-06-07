import AppLayout from "@/components/app-layout";
import AitHub from "@/components/ait/AitHub";

export function Wallet() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="ait-section-title">AIT Hub</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Копите AIT за общение, посты и поддержку других. Тратьте на темы и буст — или отправляйте
          чаевые авторам. Creator AIT — награда от аудитории.
        </p>
      </div>
      <AitHub />
    </AppLayout>
  );
}

export default Wallet;
