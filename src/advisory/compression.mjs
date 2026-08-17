const LEVEL = Object.freeze({ HIGH_RELEVANCE: 3, MEDIUM_RELEVANCE: 2, LOW_RELEVANCE: 1 });

export function normalizeAdvisoryBudget(value, { defaultItems = 5, maximumItems = 7 } = {}) {
  if (value === undefined) return defaultItems;
  if (!Number.isInteger(value) || value < 1 || value > maximumItems) {
    throw new TypeError(`advisory_budget.max_items must be an integer from 1 to ${maximumItems}.`);
  }
  return value;
}

export function applyAdvisoryBudget(records, maxItems) {
  const ordered = [...records].sort((left, right) => {
    const relevance = (LEVEL[right.relevance] ?? 0) - (LEVEL[left.relevance] ?? 0);
    return relevance || left.preference_id.localeCompare(right.preference_id);
  });
  return {
    returned: ordered.slice(0, maxItems),
    discarded: ordered.slice(maxItems),
    action: ordered.length > maxItems
      ? { type: "MAX_ITEMS", before: ordered.length, after: maxItems }
      : null
  };
}

export function deduplicateMyEyesCompact(records) {
  const groups = [];
  const consumed = new Set();
  const byId = new Map(records.map((record) => [record.preference_id, record]));
  const mergeSets = [
    ["MYE_PREF_000008", "MYE_PREF_000009", "MYE_PREF_000011"],
    ["MYE_PREF_000010", "MYE_PREF_000012", "MYE_PREF_000016"]
  ];

  for (const ids of mergeSets) {
    const members = ids.map((id) => byId.get(id)).filter(Boolean);
    if (members.length < 2) continue;
    members.forEach((member) => consumed.add(member.preference_id));
    const hasComplexity = members.some((member) => member.preference_id === "MYE_PREF_000008");
    const message = hasComplexity
      ? "Complexity is conditionally accepted when elements converge on one idea and each visible detail has a narrative, compositional, depth, atmospheric, integration, or readability function; element count alone is not a failure condition."
      : "Cards and floating elements are conditionally accepted. Risk rises when components become interchangeable, generically distributed, independently lit, weakly grouped, or detached from narrative and compositional purpose; their presence alone is not a failure.";
    groups.push({
      compact_id: `MYE_COMPACT_${groups.length + 1}`,
      actionable_insight: message,
      important_exception: hasComplexity ? "Do not infer that fewer elements are better." : "Do not forbid cards or floating elements.",
      evidence_confidence: members.every((member) => member.confidence === "HIGH") ? "HIGH" : "MIXED",
      relevant_warning: [...new Set(members.flatMap((member) => member.warnings))].join(" "),
      full_record_refs: members.map((member) => member.record_id),
      source_preference_ids: members.map((member) => member.preference_id)
    });
  }

  for (const record of records) {
    if (consumed.has(record.preference_id)) continue;
    groups.push({
      compact_id: `MYE_COMPACT_${groups.length + 1}`,
      actionable_insight: record.actionable_insight,
      important_exception: record.known_exceptions[0] ?? "Apply only within the supplied context.",
      evidence_confidence: record.confidence,
      relevant_warning: record.warnings[0] ?? "No additional warning.",
      full_record_refs: [record.record_id],
      source_preference_ids: [record.preference_id]
    });
  }

  return {
    compact: groups,
    action: groups.length < records.length
      ? { type: "SEMANTIC_MERGE", before: records.length, after: groups.length, preserved_source_ids: records.map((record) => record.preference_id) }
      : null
  };
}

