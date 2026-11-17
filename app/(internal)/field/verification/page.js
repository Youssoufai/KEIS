import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Field Verification" };

export default function Page() {
  return (
    <PageGuard path="/field/verification">
      <ModulePlaceholder
        title="Field Verification"
        category={4}
        step="5"
        requirements={[
          "Verify reported communities on site",
          "Record GPS location, photographs and observations",
          "Confirm or reject the electricity situation reported",
        ]}
      />
    </PageGuard>
  );
}
