import { PageGuard } from "@/components/auth/PageGuard";
import { DataOverview } from "@/components/views/DataOverview";

export const metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <PageGuard path="/dashboard">
      <DataOverview />
    </PageGuard>
  );
}
