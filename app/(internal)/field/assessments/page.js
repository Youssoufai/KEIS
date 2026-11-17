import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Field Data Collection" };

export default function Page() {
  return (
    <PageGuard path="/field/assessments">
      <ModulePlaceholder
        title="Field Data Collection"
        category={4}
        step="5"
        requirements={[
          "Record households, schools, health facilities and businesses",
          "Record existing energy sources and appliance use",
          "Submit assessments for review",
        ]}
      />
    </PageGuard>
  );
}
