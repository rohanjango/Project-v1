/**
 * Meet 2 — Goal Normalizer
 * Turns Form 4's human-readable role into a stable role_id.
 * This file is deliberately deterministic; Gemini should not decide the role id.
 */

const ROLE_ALIASES = {
  ai_engineer: ["ai engineer", "ai developer", "artificial intelligence engineer"],
  software_engineer: ["software engineer", "software developer", "developer", "web developer"],
  data_scientist: ["data scientist", "data science", "data analyst"],
  product_manager: ["product manager", "product management", "pm"],
  product_designer: ["product designer", "designer", "ux designer", "ui ux designer", "ui designer", "design"],
  researcher: ["researcher", "research", "r&d"],
  entrepreneur: ["entrepreneur", "startup founder", "founder", "business founder"],
  finance_quant: ["finance", "quant", "quant trader", "quantitative finance", "finance / quant"]
};

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ");
}

function normalizeTargetRole(targetRole) {
  const normalized = normalizeText(targetRole);

  for (const [roleId, aliases] of Object.entries(ROLE_ALIASES)) {
    if (aliases.some(alias => normalized === normalizeText(alias))) {
      return {
        role_id: roleId,
        matched_input: targetRole,
        confidence: "exact"
      };
    }
  }

  return {
    role_id: null,
    matched_input: targetRole,
    confidence: "unknown"
  };
}

function getRoleSkillDimensions(targetRole, skillMap) {
  const normalized = normalizeTargetRole(targetRole);

  if (!normalized.role_id || !skillMap?.roles?.[normalized.role_id]) {
    return {
      ...normalized,
      dimensions: []
    };
  }

  return {
    ...normalized,
    display_name: skillMap.roles[normalized.role_id].display_name,
    dimensions: skillMap.roles[normalized.role_id].dimensions
  };
}

const api = { ROLE_ALIASES, normalizeText, normalizeTargetRole, getRoleSkillDimensions };
if (typeof module !== "undefined") module.exports = api;
if (typeof window !== "undefined") window.Meet2GoalNormalizer = api;
