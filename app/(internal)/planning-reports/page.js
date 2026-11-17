import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Planning Reports" };

export default function Page() {
  return (
    <PageGuard path="/planning-reports">
      <ModulePlaceholder
        title="Planning Reports"
        category={7}
        step="9"
        requirements={[
          "Government planning reports by LGA and community",
          "Export to PDF and spreadsheet",
          "Summaries of demand, recommended interventions and indicative costs",
        ]}
      />
    </PageGuard>
  );
}
