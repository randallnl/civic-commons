export function isFreeStater(record = {}) {
  if (!record || typeof record !== "object") return false;

  const value =
    record.is_free_stater ??
    record.isFreeStater ??
    record.free_stater ??
    record.freeStater;

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  return ["1", "true", "yes", "y"].includes(String(value).trim().toLowerCase());
}
