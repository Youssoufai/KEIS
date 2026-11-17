import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Field Operations" };

export default function Page() {
  return (
    <PageGuard path="/field">
      <ModulePlaceholder
        title="Field Operations"
        category={4}
        step="5"
        requirements={[
          "Assignments of communities to field data collectors",
          "Status of each assignment (assigned, in progress, submitted)",
          "Filter by LGA and collector",
        ]}
      />
    </PageGuard>
  );
}
