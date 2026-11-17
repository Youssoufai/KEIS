// Derives each community's electricity-access status AND the evidence level
// behind it. Public reports are leads only (FRD §6): they can set a "reported"
// status but never override verified or assessed information.

import { EVIDENCE_LEVELS } from "@/lib/config/constants";

const SITUATION_TO_ACCESS = {
  none: "none",
  irregular: "unreliable",
  inadequate: "unreliable",
  partial: "unreliable",
};

/** Latest assessment for a community, if any. */
export function latestAssessment(data, communityId) {
  return data.assessments
    .filter((a) => a.communityId === communityId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

/**
 * Returns { evidence, access, source } for a community.
 *  - evidence: none | reported | under_review | verified | assessed
 *  - access:   none | unreliable | reliable | unknown
 *  - source:   short description of where the status came from
 */
export function communityStatus(data, communityId) {
  const assessment = latestAssessment(data, communityId);
  if (assessment) {
    return {
      evidence: "assessed",
      access: assessment.community.accessStatus || "unknown",
      source: `Field assessment ${assessment.date}`,
    };
  }

  const reports = data.reports.filter((r) => r.communityId === communityId && r.status !== "rejected");
  const verified = reports.filter((r) => r.status === "verified" || r.status === "assessed");
  if (verified.length) {
    return {
      evidence: "verified",
      access: SITUATION_TO_ACCESS[verified[0].situation] || "unknown",
      source: `Verified report ${verified[0].ref}`,
    };
  }
  const underReview = reports.filter((r) => r.status === "under_review");
  if (underReview.length) {
    return {
      evidence: "under_review",
      access: SITUATION_TO_ACCESS[underReview[0].situation] || "unknown",
      source: `${underReview.length} report(s) under review – not verified`,
    };
  }
  if (reports.length) {
    return {
      evidence: "reported",
      access: SITUATION_TO_ACCESS[reports[0].situation] || "unknown",
      source: `${reports.length} public report(s) – not verified`,
    };
  }
  return { evidence: "none", access: "unknown", source: "No information yet" };
}

export function isConfirmed(evidence) {
  return EVIDENCE_LEVELS[evidence]?.rank >= EVIDENCE_LEVELS.verified.rank;
}

export function lgaName(data, lgaId) {
  return data.lgas.find((l) => l.id === lgaId)?.name || "—";
}

export function wardName(data, wardId) {
  return data.wards.find((w) => w.id === wardId)?.name || "—";
}

export function communityName(data, communityId) {
  return data.communities.find((c) => c.id === communityId)?.name || "—";
}
