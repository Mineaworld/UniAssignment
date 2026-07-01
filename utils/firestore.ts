/**
 * Checks whether a value is a plain JavaScript object (i.e., an object
 * whose prototype is `Object.prototype`).
 *
 * Returns `false` for class instances such as `Date`, Firestore `Timestamp`,
 * `Map`, `Set`, and Firestore sentinel values (`deleteField()`,
 * `serverTimestamp()`, etc.).
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Deeply removes `undefined` values from an object to make it Firestore-compatible.
 * Firestore does not accept `undefined` values; they must be omitted or set to `null`.
 *
 * This function recursively processes nested plain objects and arrays to ensure
 * no `undefined` values exist at any level of the data structure.
 *
 * Non-plain objects (e.g. `Date`, Firestore `Timestamp`, sentinels) are preserved
 * as-is rather than being iterated.
 *
 * @param obj - The object to sanitize
 * @returns A new object with all `undefined` values removed
 */
export const sanitizeForFirestore = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined values entirely
    if (value === undefined) {
      continue;
    }

    // Recursively sanitize nested plain objects
    if (value !== null && isPlainObject(value)) {
      const nestedSanitized = sanitizeForFirestore(value);
      // Only include the nested object if it has properties after sanitization
      if (Object.keys(nestedSanitized).length > 0) {
        sanitized[key] = nestedSanitized;
      }
      continue;
    }

    // Recursively sanitize arrays
    if (Array.isArray(value)) {
      sanitized[key] = value
        .filter((item) => item !== undefined)
        .map((item) =>
          item !== null && isPlainObject(item)
            ? sanitizeForFirestore(item)
            : item
        );
      continue;
    }

    // Include primitive values and non-plain objects directly
    sanitized[key] = value;
  }

  return sanitized as Partial<T>;
};
