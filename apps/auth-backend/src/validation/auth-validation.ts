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
