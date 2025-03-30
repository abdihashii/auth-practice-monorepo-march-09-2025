import type { z } from 'zod';

import { VALID_AUTH_PROVIDERS } from '@/constants';

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

/**
 * Validates that all auth providers in an array are valid according to the defined constants
 *
 * @param {string[]} providers - Array of auth provider strings to validate
 * @returns {boolean} - True if all providers are valid, false otherwise
 */
export function validateAuthProviders(providers: string[]): boolean {
  if (!Array.isArray(providers) || providers.length === 0) {
    return false;
  }

  // Cast to any to avoid type issues when comparing with the string literals
  return providers.every((provider) =>
    (VALID_AUTH_PROVIDERS as readonly string[]).includes(provider),
  );
}
