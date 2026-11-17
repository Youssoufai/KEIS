import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <PageGuard path="/reports">
      <ModulePlaceholder
        title="Reports"
        category={3}
        step="3–4"
        requirements={[
          "Electricity reports and field submissions received by the platform",
          "Record reports received through LGA offices, field teams or a future public channel, each with a unique reference number",
          "Review, confirm or reject reports with comments and evidence",
          "Update report status and record the officer responsible and date",
          "Flag duplicate submissions and assign communities for detailed assessment",
        ]}
      />
    </PageGuard>
  );
}
