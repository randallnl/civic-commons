export function endorsementPillClass(endorsement = {}, organizationName = "") {
  const text = [
    endorsement.position,
    endorsement.organization?.name,
    endorsement.organization,
    organizationName,
    endorsement.statement,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("scorecard rating") ||
    text.includes("nhhra") ||
    text.includes("house republican alliance") ||
    text.includes("tpaction") ||
    text.includes("tp action") ||
    text.includes("turning point action") ||
    text.includes("free state")
  ) {
    return "warning";
  }

  return "endorse";
}
