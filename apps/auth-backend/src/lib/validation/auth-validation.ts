import {
  emailSchema,
  passwordSchema,
} from '@roll-your-own-auth/shared';
import { z } from 'zod';

/**
 * Validation schema for user registration
 * Validates the CreateUserDto structure with proper constraints
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
});

/**
 * Validation schema for user login
 * Validates the LoginUserDto structure with proper constraints
 */
export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

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
      errors: result.error.errors.map((err) => {
        const field = err.path.length > 0 ? err.path[0] : 'unknown';
        return `${field}: ${err.message}`;
      }),
    };
  }
}
