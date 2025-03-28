import type { z } from 'zod';

/**
 * Validate user input data against a Zod schema
 * Returns a boolean indicating success or failure
 * Returns an object with isValid, errors, and data properties
 *
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @param {unknown} data - The data to validate
 * @returns {object} An object with isValid, errors, and data properties
 */
export function validateAuthSchema<T extends z.ZodSchema>(
  schema: T,
  data: unknown,
): {
    isValid: boolean;
    errors: string[];
    data?: z.infer<typeof schema>;
  } {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      isValid: true,
      errors: [],
      data: result.data,
    };
  } else {
    // Format errors in a consistent way: "field: error message"
    return {
      isValid: false,
      errors: result.error.errors.map((err: any) => {
        const field = err.path.length > 0 ? err.path[0] : 'unknown';
        return `${field}: ${err.message}`;
      }),
    };
  }
}
