"use client";

import { useData } from "@/lib/store/store";
import { communityStatus } from "@/lib/domain/status";
import { EVIDENCE_LEVELS, REPORT_STATUSES } from "@/lib/config/constants";
import { Card, CardHeader, Notice, PageHeader, StatTile } from "@/components/ui/Card";
import { EvidenceBadge, ReportStatusBadge, SampleBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";

/**
 * Interim dashboard for implementation step 1: shows the seeded data across
 * the workflow stages. Replaced by the full Category 1 dashboard in step 9.
 */
export function DataOverview() {
  const data = useData();
  const statuses = data.communities.map((c) => ({ c, s: communityStatus(data, c.id) }));
  const evidenceKeys = Object.keys(EVIDENCE_LEVELS);

  const rows = data.lgas.map((lga) => {
    const inLga = statuses.filter((x) => x.c.lgaId === lga.id);
    const row = { id: lga.id, name: lga.name, wards: data.wards.filter((w) => w.lgaId === lga.id).length, total: inLga.length };
    evidenceKeys.forEach((k) => (row[k] = inLga.filter((x) => x.s.evidence === k).length));
    return row;
  });

  const reportCounts = Object.keys(REPORT_STATUSES).map((k) => ({
    id: k,
    count: data.reports.filter((r) => r.status === k).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="FRD Category 1"
        title="Dashboard"
        description="Pilot data across Ankpa, Dekina and Adavi LGAs. The full dashboard (demand, interventions, costs and priorities) arrives in a later step."
      />
      <Notice tone="warning" title="Sample data">
        Wards, communities, reports and assessments shown here are invented demonstration records. Only the three LGA names are
        real.
      </Notice>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Pilot LGAs" value={data.lgas.length} hint={data.lgas.map((l) => l.name).join(" · ")} />
        <StatTile label="Registered communities" value={data.communities.length} badge={<SampleBadge />} />
        <StatTile
          label="Public reports"
          value={data.reports.length}
          hint={`${data.reports.filter((r) => r.duplicateFlag).length} flagged as possible duplicate`}
          badge={<SampleBadge />}
        />
        <StatTile label="Field assessments" value={data.assessments.length} badge={<SampleBadge />} />
      </div>

      <Card>
        <CardHeader
          title="Communities by evidence level"
          description="Reported and under-review statuses come from public reports and are not confirmed. Only verified and assessed information is treated as confirmed."
        />
        <Table
          rows={rows}
          columns={[
            { key: "name", header: "LGA", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "wards", header: "Wards", align: "right" },
            { key: "total", header: "Communities", align: "right" },
            ...evidenceKeys.map((k) => ({ key: k, header: <EvidenceBadge level={k} />, align: "right" })),
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Public reports by status" description="FRD Category 3 report lifecycle." />
        <div className="flex flex-wrap gap-4 px-5 py-4">
          {reportCounts.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <ReportStatusBadge status={r.id} />
              <span className="text-lg font-semibold tabular-nums">{r.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
