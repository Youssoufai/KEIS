import { PageGuard } from "@/components/auth/PageGuard";
import { SettingsView } from "@/components/views/SettingsView";

export const metadata = { title: "Assumptions & Settings" };

export default function SettingsPage() {
  return (
    <PageGuard path="/settings">
      <SettingsView />
    </PageGuard>
  );
}
