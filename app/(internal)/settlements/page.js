import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Settlements" };

export default function Page() {
  return (
    <PageGuard path="/settlements">
      <ModulePlaceholder
        title="Settlements"
        category={2}
        step="5"
        requirements={[
          "List of settlements discovered from GRID3 within the pilot LGAs",
          "Settlement profile: population, electrification likelihood, distances to grid and services",
          "Evidence level (reported / verified / assessed) for each settlement",
          "Candidate priority information once scoring criteria are approved",
        ]}
      />
    </PageGuard>
  );
}
