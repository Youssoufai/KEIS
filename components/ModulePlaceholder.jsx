import { PageHeader, Card, CardBody, Notice } from "@/components/ui/Card";

/** Temporary page for modules scheduled in later implementation steps. */
export function ModulePlaceholder({ title, category, step, requirements = [] }) {
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={`FRD Category ${category}`} title={title} />
      <Notice tone="info" title={`Planned in implementation step ${step}`}>
        The foundation (navigation, roles, data store and assumptions) is in place. This module will be built next.
      </Notice>
      {requirements.length > 0 && (
        <Card className="mt-4">
          <CardBody>
            <p className="mb-2 text-sm font-semibold">FRD requirements to be covered</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
