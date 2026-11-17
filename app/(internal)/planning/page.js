import { PageGuard } from "@/components/auth/PageGuard";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Intervention Planning" };

export default function Page() {
  return (
    <PageGuard path="/planning">
      <ModulePlaceholder
        title="Intervention Planning"
        category={6}
        step="7"
        requirements={[
          "Recommend renewable solutions (solar home systems, mini-grids, institutional solar, water pumping, productive use)",
          "Indicative system sizing from assessed demand",
          "Indicative costs using the current assumption set",
          "Rank communities by need using approved criteria (high / medium / low)",
        ]}
      />
    </PageGuard>
  );
}
