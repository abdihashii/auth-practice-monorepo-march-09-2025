// Third-party imports
import { z } from "zod";

// Local imports
import { PASSWORD_REQUIREMENTS, type PasswordValidationResult } from "@/types";

/**
 * Validation schema for password
 * Ensures the password
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_REQUIREMENTS.minLength,
    `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
  )
  .max(
    PASSWORD_REQUIREMENTS.maxLength,
    `Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`
  )
  .refine(
    (password) =>
      (password.match(/[a-z]/g) || []).length >=
      PASSWORD_REQUIREMENTS.minLowercase,
    {
      message: "Password must contain at least one lowercase letter",
    }
  )
  .refine(
    (password) =>
      (password.match(/[A-Z]/g) || []).length >=
      PASSWORD_REQUIREMENTS.minUppercase,
    {
      message: "Password must contain at least one uppercase letter",
    }
  )
  .refine(
    (password) =>
      (password.match(/[0-9]/g) || []).length >=
      PASSWORD_REQUIREMENTS.minNumbers,
    {
      message: "Password must contain at least one number",
    }
  )
  .refine(
    (password) => {
      const symbols = new RegExp(
        `[${PASSWORD_REQUIREMENTS.allowedSymbols.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          "\\$&"
        )}]`,
        "g"
      );
      return (
        (password.match(symbols) || []).length >=
        PASSWORD_REQUIREMENTS.minSymbols
      );
    },
    {
      message: "Password must contain at least one special character",
    }
  );

/**
 * Validation schema for user registration
 * Validates the CreateUserDto structure with proper constraints
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(5, "Email must be at least 5 characters")
    .max(255, "Email must be less than 255 characters"),
  password: passwordSchema,
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
});

export function validatePasswordStrength(
  password: string
): PasswordValidationResult {
  const result = passwordSchema.safeParse(password);

  if (result.success) {
    return {
      isValid: true,
      errors: [],
    };
  } else {
    return {
      isValid: false,
      errors: result.error.errors.map((err) => err.message),
    };
  }
}

/**
 * Validates user registration input data
 * @param data - The data to validate against CreateUserDto schema
 * @returns Object containing validation result and any error messages
 */
export function validateCreateUser(data: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof createUserSchema>;
} {
  const result = createUserSchema.safeParse(data);

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
        const field = err.path.length > 0 ? err.path[0] : "unknown";
        return `${field}: ${err.message}`;
      }),
    };
  }
}
