import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Energy Assessments" };

export default function Page() {
  return (
    <PageGuard path="/energy">
      <ModulePlaceholder
        title="Energy Assessments"
        category={5}
        step="6"
        requirements={[
          "Household, community and facility demand: Energy (Wh/day) = Power (W) × Quantity × Operating hours",
          "Facility- and community-level demand in kWh/day",
          "Peak load in kW using documented assumptions",
          "Retain the assumptions used for each assessment",
        ]}
      />
    </PageGuard>
  );
}
