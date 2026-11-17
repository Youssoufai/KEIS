import { Suspense } from "react";
import { PageGuard } from "@/components/auth/PageGuard";
import { MapExplorer } from "@/components/map/MapExplorer";

export const metadata = { title: "Intelligence Map" };

export default function Page() {
  return (
    <PageGuard path="/map">
      <Suspense fallback={null}>
        <h1 className="sr-only">Intelligence Map</h1>
        <MapExplorer />
      </Suspense>
    </PageGuard>
  );
}
