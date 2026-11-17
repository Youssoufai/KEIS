"use client";

import { useState } from "react";
import { ASSUMPTION_FIELDS, DEFAULT_ASSUMPTIONS } from "@/lib/config/assumptions";
import { APPLIANCE_CATEGORIES } from "@/lib/config/appliances";
import { ROLES } from "@/lib/config/constants";
import { can } from "@/lib/config/navigation";
import { getCurrentAssumptions, updateData, useData } from "@/lib/store/store";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { formatDateTime, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader, Notice, PageHeader } from "@/components/ui/Card";
import { Badge, DraftBadge, SampleBadge } from "@/components/ui/Badge";
import { Button, Field, Input, Select } from "@/components/ui/Controls";
import { Table } from "@/components/ui/Table";
import { ResetDemoButton } from "@/components/shell/ResetDemoButton";

const getPath = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj);
function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
}

/** Flatten an assumption set into { "section.path": "string value" } for editing. */
function toDraft(set) {
  const draft = {};
  for (const [section, def] of Object.entries(ASSUMPTION_FIELDS)) {
    for (const path of Object.keys(def.fields)) {
      draft[`${section}.${path}`] = String(getPath(set[section], path) ?? "");
    }
  }
  return draft;
}

function validate(draft) {
  const errors = [];
  for (const [key, raw] of Object.entries(draft)) {
    const [section, ...rest] = key.split(".");
    const meta = ASSUMPTION_FIELDS[section].fields[rest.join(".")];
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) errors.push(`${meta.label}: enter a number.`);
    else if (meta.min !== undefined && n < meta.min) errors.push(`${meta.label}: must be at least ${meta.min}.`);
    else if (meta.max !== undefined && n > meta.max) errors.push(`${meta.label}: must be at most ${meta.max}.`);
  }
  const weightSum = Object.keys(ASSUMPTION_FIELDS.priority.fields)
    .filter((p) => p.startsWith("weights."))
    .reduce((s, p) => s + Number(draft[`priority.${p}`] || 0), 0);
  if (weightSum !== 100) errors.push(`Priority weights must add up to 100 (currently ${weightSum}).`);
  if (Number(draft["priority.thresholds.high"]) <= Number(draft["priority.thresholds.medium"]))
    errors.push("High-priority threshold must be greater than the medium-priority threshold.");
  return { errors, weightSum };
}

function AssumptionsEditor({ current, sets, editable, role }) {
  const user = useCurrentUser();
  const [draft, setDraft] = useState(() => toDraft(current));
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(null);
  const { errors, weightSum } = validate(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(current));

  function save() {
    if (errors.length) return;
    const version = Math.max(...sets.map((s) => s.version)) + 1;
    const next = structuredClone(current);
    for (const [key, raw] of Object.entries(draft)) {
      const [section, ...rest] = key.split(".");
      setPath(next[section], rest.join("."), Number(raw));
    }
    Object.assign(next, {
      id: `as-v${version}`,
      version,
      status: "draft",
      label: `Draft v${version}${note ? ` – ${note}` : ""}`,
      createdAt: new Date().toISOString(),
      createdBy: `${user.name} (${ROLES[role].label})`,
    });
    updateData(
      (d) => {
        d.assumptionSets.push(next);
        d.currentAssumptionSetId = next.id;
      },
      { action: "assumptions.saved", detail: next.label },
    );
    setNote("");
    setSaved(next.label);
  }

  return (
    <Card>
      <CardHeader
        title="Calculation assumptions"
        description="Used for energy demand, recommendations, cost estimates and priority scores. Saving creates a new version; earlier versions are kept so past results remain explainable."
        actions={
          <>
            <DraftBadge />
            <Badge className="border-border bg-white text-foreground">In use: {current.label}</Badge>
          </>
        }
      />
      <CardBody className="space-y-6">
        {!editable && (
          <Notice tone="info">
            Read-only for the <strong>{ROLES[role].label}</strong> role. Energy Analysts and Administrators can change
            assumptions.
          </Notice>
        )}
        {saved && !dirty && (
          <Notice tone="success" title="Saved">
            {saved} is now in use for new calculations.
          </Notice>
        )}

        {Object.entries(ASSUMPTION_FIELDS).map(([section, def]) => (
          <fieldset key={section} className="rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-semibold">
              {def.title}{" "}
              {section === "costRates" && <SampleBadge className="ml-1 align-middle" />}
            </legend>
            {section === "costRates" && (
              <p className="mb-3 text-xs text-muted">
                Sample rates for demonstration – not supplier quotations. Replace with approved cost data sources (FRD §9 item 8).
              </p>
            )}
            {section === "priority" && (
              <p className={`mb-3 text-xs ${weightSum === 100 ? "text-muted" : "font-medium text-red-700"}`}>
                Weights total: {weightSum} / 100
              </p>
            )}
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(def.fields).map(([path, meta]) => {
                const key = `${section}.${path}`;
                const id = `as-${key}`;
                return (
                  <Field key={key} label={meta.label} htmlFor={id} hint={meta.unit}>
                    <Input
                      id={id}
                      type="number"
                      inputMode="decimal"
                      step={meta.step}
                      min={meta.min}
                      max={meta.max}
                      value={draft[key]}
                      disabled={!editable}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    />
                  </Field>
                );
              })}
            </div>
          </fieldset>
        ))}

        {editable && (
          <div className="space-y-3 border-t border-border pt-4">
            {errors.length > 0 && dirty && (
              <Notice tone="danger" title="Fix before saving">
                <ul className="list-disc pl-5">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Notice>
            )}
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Change note (optional)" htmlFor="as-note" className="min-w-64 flex-1">
                <Input id="as-note" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Updated battery rate" />
              </Field>
              <Button variant="secondary" onClick={() => setDraft(toDraft(DEFAULT_ASSUMPTIONS))}>
                Load prototype defaults
              </Button>
              <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(toDraft(current))}>
                Discard changes
              </Button>
              <Button disabled={!dirty || errors.length > 0} onClick={save}>
                Save as new version
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function VersionHistory({ sets, currentId, editable }) {
  const rows = [...sets].sort((a, b) => b.version - a.version);
  return (
    <Card>
      <CardHeader title="Assumption versions" description="Each assessment and recommendation records the version it was calculated with." />
      <Table
        rows={rows}
        columns={[
          { key: "version", header: "Version", render: (r) => `v${r.version}` },
          { key: "label", header: "Label" },
          { key: "createdBy", header: "Created by" },
          { key: "createdAt", header: "Created", render: (r) => formatDateTime(r.createdAt) },
          {
            key: "current",
            header: "",
            align: "right",
            render: (r) =>
              r.id === currentId ? (
                <Badge className="border-emerald-600 bg-emerald-50 text-emerald-800">In use</Badge>
              ) : editable ? (
                <Button
                  variant="secondary"
                  className="px-2.5 py-1 text-xs"
                  onClick={() =>
                    updateData((d) => (d.currentAssumptionSetId = r.id), { action: "assumptions.activated", detail: r.label })
                  }
                >
                  Use this version
                </Button>
              ) : null,
          },
        ]}
      />
    </Card>
  );
}

function ApplianceLibrary({ appliances, editable }) {
  const [form, setForm] = useState({ name: "", watts: "", category: "household" });
  const [filter, setFilter] = useState("all");
  const valid = form.name.trim().length > 1 && Number(form.watts) > 0;

  function add(e) {
    e.preventDefault();
    if (!valid) return;
    const id = `custom-${form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    updateData(
      (d) => d.appliances.push({ id, name: form.name.trim(), watts: Number(form.watts), category: form.category, builtIn: false }),
      { action: "appliance.added", detail: form.name.trim() },
    );
    setForm({ name: "", watts: "", category: form.category });
  }

  const rows = appliances.filter((a) => filter === "all" || a.category === filter);

  return (
    <Card>
      <CardHeader
        title="Appliance & equipment library"
        description="Typical rated powers used as defaults on assessment forms. Field officers can record the actual nameplate rating."
        actions={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by category" className="w-auto">
            <option value="all">All categories</option>
            {Object.entries(APPLIANCE_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        }
      />
      <Table
        rows={rows}
        columns={[
          { key: "name", header: "Appliance / equipment" },
          { key: "category", header: "Category", render: (r) => APPLIANCE_CATEGORIES[r.category] },
          { key: "watts", header: "Typical rating (W)", align: "right", render: (r) => formatNumber(r.watts) },
          {
            key: "source",
            header: "Source",
            render: (r) =>
              r.builtIn ? (
                <span className="text-muted">Prototype default</span>
              ) : (
                <Badge className="border-sky-300 bg-sky-50 text-sky-900">Custom</Badge>
              ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (r) =>
              editable && !r.builtIn ? (
                <Button
                  variant="danger"
                  className="px-2.5 py-1 text-xs"
                  onClick={() => updateData((d) => (d.appliances = d.appliances.filter((a) => a.id !== r.id)), { action: "appliance.removed", detail: r.name })}
                >
                  Remove
                </Button>
              ) : null,
          },
        ]}
      />
      {editable && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-3 border-t border-border px-5 py-4">
          <Field label="Add equipment not in the list" htmlFor="ap-name" className="min-w-56 flex-1">
            <Input id="ap-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rice huller" />
          </Field>
          <Field label="Rated power (W)" htmlFor="ap-watts" className="w-36">
            <Input id="ap-watts" type="number" min="1" value={form.watts} onChange={(e) => setForm({ ...form, watts: e.target.value })} />
          </Field>
          <Field label="Category" htmlFor="ap-cat" className="w-52">
            <Select id="ap-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(APPLIANCE_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={!valid}>
            Add to library
          </Button>
        </form>
      )}
    </Card>
  );
}

function DemoDataCard({ data, role }) {
  const counts = [
    ["Communities", data.communities.length],
    ["Public reports", data.reports.length],
    ["Verifications", data.verifications.length],
    ["Assessments", data.assessments.length],
    ["Assumption versions", data.assumptionSets.length],
  ];
  return (
    <Card>
      <CardHeader
        title="Prototype demo data"
        description="Data is stored in this browser only (localStorage). It is not shared between users or devices."
        actions={can(role, "resetDemoData") ? <ResetDemoButton /> : null}
      />
      <CardBody className="space-y-3">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {counts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="text-lg font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {!can(role, "resetDemoData") && <p className="text-xs text-muted">Only System Administrators can reset demo data.</p>}
        {data.activity.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold">Recent changes in this browser</p>
            <ul className="space-y-1 text-sm text-muted">
              {data.activity.slice(0, 6).map((a, i) => (
                <li key={i}>
                  {formatDateTime(a.at)} · {a.name || ROLES[a.role]?.short || "Unknown user"} · {a.action}
                  {a.detail ? ` – ${a.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function SettingsView() {
  const data = useData();
  const { role } = useCurrentUser();
  const current = getCurrentAssumptions(data);
  const editable = can(role, "editAssumptions");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Assumptions & Settings"
        description="All calculations in this platform are rule-based and use the values below. Nothing here is an AI model or a final engineering design."
      />
      {/* key remounts the editor when the active version changes */}
      <AssumptionsEditor key={current.id} current={current} sets={data.assumptionSets} editable={editable} role={role} />
      <VersionHistory sets={data.assumptionSets} currentId={data.currentAssumptionSetId} editable={editable} />
      <ApplianceLibrary appliances={data.appliances} editable={editable} />
      <DemoDataCard data={data} role={role} />
    </div>
  );
}
