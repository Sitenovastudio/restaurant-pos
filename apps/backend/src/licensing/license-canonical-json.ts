/**
 * Minimal RFC-8785-compatible canonical JSON for the licence payload's
 * deliberately restricted JSON value set. Reject non-finite numbers and
 * unsupported values rather than signing ambiguous representations.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite JSON number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return '{' + keys.map((key) =>
      JSON.stringify(key) + ':' + canonicalJson(record[key]),
    ).join(',') + '}';
  }
  throw new Error('Unsupported value in canonical JSON');
}
