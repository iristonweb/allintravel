import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import AitHub from "@/components/ait/AitHub";

export function Wallet() {
  return (
    <AppLayout>
      <PageShell
        title="AIT Hub"
        description="Копите AIT за общение, посты и поддержку других. Тратьте на темы и буст — или отправляйте чаевые авторам. Creator AIT — награда от аудитории."
      >
        <AitHub />
      </PageShell>
    </AppLayout>
  );
}

export default Wallet;
