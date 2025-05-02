import { z } from 'zod';

import { PASSWORD_REQUIREMENTS } from '@/types';

/**
 **************************************************
 ******** SHARED VALIDATION SCHEMAS ***************
 **************************************************
 */

/**
 * Validation schema for email
 * Ensures the email is a valid format
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

/**
 * Validation schema for password
 * Ensures the password meets requirements
 */
export const passwordSchema = z
  .string()
  .min(
    PASSWORD_REQUIREMENTS.minLength,
    `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
  )
  .max(
    PASSWORD_REQUIREMENTS.maxLength,
    `Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`,
  )
  .refine(
    (password) =>
      (password.match(/[a-z]/g) || []).length
      >= PASSWORD_REQUIREMENTS.minLowercase,
    {
      message: 'Password must contain at least one lowercase letter',
    },
  )
  .refine(
    (password) =>
      (password.match(/[A-Z]/g) || []).length
      >= PASSWORD_REQUIREMENTS.minUppercase,
    {
      message: 'Password must contain at least one uppercase letter',
    },
  )
  .refine(
    (password) =>
      (password.match(/\d/g) || []).length
      >= PASSWORD_REQUIREMENTS.minNumbers,
    {
      message: 'Password must contain at least one number',
    },
  )
  .refine(
    (password) => {
      const symbols = new RegExp(
        `[${PASSWORD_REQUIREMENTS.allowedSymbols.replace(
          /[-[\]{}()*+?.,\\^$|#\s]/g,
          '\\$&',
        )}]`,
        'g',
      );
      return (
        (password.match(symbols) || []).length
        >= PASSWORD_REQUIREMENTS.minSymbols
      );
    },
    {
      message: 'Password must contain at least one special character',
    },
  );

/**
 * Validation schema for user ID parameter
 * Ensures the ID is a valid UUID format
 */
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Validation schema for forgot password token
 * Ensures the token is a valid UUID format
 */
export const forgotPasswordTokenSchema = z.object({
  token: z.string().uuid('Invalid token format'),
});

/*
  **************************************************
  ********** AUTH FORM VALIDATION SCHEMAS **********
  **************************************************
  */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerFormSchema = loginFormSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/*
  **************************************************
  ********** BACKEND AUTH VALIDATION SCHEMAS *******
  **************************************************
  */

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
 * Validation schema for password updates
 * Ensures both old and new passwords are required
 */
export const updatePasswordSchema = z.object({
  old_password: passwordSchema,
  new_password: passwordSchema,
  confirm_password: passwordSchema,
})
  .strict() // Ensures only expected fields are processed when changing password
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.new_password !== data.old_password, {
    message: 'New password cannot be the same as the old password',
    path: ['new_password'],
  });

/**
 * Validation schema for user update
 * Validates the UpdateUserDto structure with proper constraints
 */
export const updateUserSchema = z.object({
  // Core user information
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .nullable()
    .optional(),
  bio: z
    .string()
    .min(2, 'Bio must be at least 2 characters')
    .max(1000, 'Bio must be less than 1000 characters')
    .nullable()
    .optional(),
  profilePicture: z
    .string()
    .url('Invalid profile picture URL')
    .nullable()
    .optional(),

  // User preferences & settings
  settings: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  notificationPreferences: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
    })
    .optional(),
}).strict();

/**
 * Validation schema for user login
 * Validates the LoginUserDto structure with proper constraints
 */
export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
