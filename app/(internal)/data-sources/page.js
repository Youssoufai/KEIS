import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Data Sources" };

export default function Page() {
  return (
    <PageGuard path="/data-sources">
      <ModulePlaceholder
        title="Data Sources"
        category={2}
        step="2"
        requirements={[
          "Dataset registry (data/derived/sources.json)",
          "Source dates, licences and evidence classes",
          "Known limitations (see docs/DATA_SOURCES.md and docs/GEOSPATIAL_VALIDATION.md)",
        ]}
      />
    </PageGuard>
  );
}
